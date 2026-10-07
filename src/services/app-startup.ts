import { App as CapacitorApp } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
import { toastController } from '@ionic/vue'
import { reactive, readonly, type DeepReadonly } from 'vue'

import { useDokuStore } from '@/store/doku'
import { initStorage } from '@/store/persistence'

export type StartupStatus = 'loading' | 'ready' | 'error'

export interface StartupState {
  status: StartupStatus
  errorMessage: string | null
}

type DokuStore = ReturnType<typeof useDokuStore>

interface StartupStore {
  $subscribe: DokuStore['$subscribe']
  autoResetProtocol: DokuStore['autoResetProtocol']
  getAutoProtocolResetAction: DokuStore['getAutoProtocolResetAction']
  markProtocolOpened: DokuStore['markProtocolOpened']
  isProtocolChanging: boolean
  connection: Pick<DokuStore['connection'], 'isTransmitting'>
  persistToStorage: DokuStore['persistToStorage']
  hydrateFromStorage: DokuStore['hydrateFromStorage']
}

type AppStateChangeHandler = (isActive: boolean) => void

export interface AppStartupDependencies {
  getStore: () => StartupStore
  initializeStorage: () => Promise<void>
  registerAppStateChange: (handler: AppStateChangeHandler) => Promise<void>
  scheduleAfterPaint: (callback: () => void) => void
  showError: (message: string) => Promise<void>
  startupTimeoutMs: number
}

const PERSISTENCE_DEBOUNCE_MS = 3000
const DEFAULT_STARTUP_TIMEOUT_MS = 10_000
const STARTUP_ERROR_MESSAGE = 'Die gespeicherten Protokolldaten konnten nicht geladen werden. Bitte starte die App neu.'

async function showErrorToast(message: string): Promise<void> {
  const toast = await toastController.create({
    message,
    color: 'danger',
    duration: 5000,
    position: 'bottom',
  })
  await toast.present()
}

async function registerAppStateChange(handler: AppStateChangeHandler): Promise<void> {
  const listener: PluginListenerHandle = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    handler(isActive)
  })

  // The listener intentionally lives for the lifetime of the application.
  void listener
  handler((await CapacitorApp.getState()).isActive)
}

function scheduleAfterPaint(callback: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(callback))
}

const defaultDependencies: AppStartupDependencies = {
  getStore: () => useDokuStore(),
  initializeStorage: initStorage,
  registerAppStateChange,
  scheduleAfterPaint,
  showError: showErrorToast,
  startupTimeoutMs: DEFAULT_STARTUP_TIMEOUT_MS,
}

function logStartupStage(stage: string): void {
  console.info(`[startup] ${stage}`)
}

export function createAppStartup(dependencies: AppStartupDependencies = defaultDependencies) {
  const mutableState = reactive<StartupState>({
    status: 'loading',
    errorMessage: null,
  })
  const state = readonly(mutableState) as DeepReadonly<StartupState>

  let startPromise: Promise<void> | null = null
  let store: StartupStore | null = null
  let persistTimer: ReturnType<typeof setTimeout> | null = null
  let appIsActive = true
  let processingLifecycle = false
  const lifecycleEvents: { isActive: boolean; openedAt: number }[] = []
  let pendingError: { message: string; error: unknown } | null = null

  const withStartupTimeout = async <T>(stage: string, operation: Promise<T>): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`${stage} timed out`)), dependencies.startupTimeoutMs)
    })

    try {
      return await Promise.race([operation, timeout])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  const reportNonFatalError = async (message: string, error: unknown): Promise<void> => {
    console.error(`[startup] ${message}`, error)
    try {
      await dependencies.showError(message)
    } catch (overlayError) {
      console.error('[startup] Could not present the error message.', overlayError)
    }
  }

  const flushPersistence = async (): Promise<void> => {
    if (!store) return
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
    }

    try {
      await store.persistToStorage()
      logStartupStage('protocol state persisted')
    } catch (error) {
      console.error('[startup] Could not persist protocol state.', error)
    }
  }

  const reportPendingError = async (): Promise<void> => {
    if (!appIsActive || mutableState.status !== 'ready' || !pendingError) return
    const { message, error } = pendingError
    pendingError = null
    await reportNonFatalError(message, error)
  }

  const isProtocolBusy = (): boolean => Boolean(store?.isProtocolChanging || store?.connection.isTransmitting)

  const processLifecycleEvent = async (event: { isActive: boolean; openedAt: number }): Promise<void> => {
    if (!store) return
    let errorMessage = 'Das Protokoll konnte nicht automatisch zurückgesetzt werden.'
    try {
      if (store.getAutoProtocolResetAction() === 'reset') {
        await store.autoResetProtocol()
      }
      errorMessage = 'Der Protokollstatus konnte nicht gespeichert werden.'
      if (event.isActive) {
        // Check the previous opening time first. A failed reset must not restart
        // the clock, otherwise the next lifecycle event could miss the retry.
        await store.markProtocolOpened(event.openedAt)
      } else {
        await store.persistToStorage()
      }
    } catch (error) {
      pendingError = { message: errorMessage, error }
      console.error(`[startup] ${errorMessage}`, error)
    }
  }

  const drainLifecycleEvents = async (): Promise<void> => {
    if (processingLifecycle || mutableState.status !== 'ready' || isProtocolBusy()) return
    processingLifecycle = true
    try {
      while (lifecycleEvents.length && !isProtocolBusy()) {
        await processLifecycleEvent(lifecycleEvents.shift()!)
      }
      await reportPendingError()
    } finally {
      processingLifecycle = false
      if (lifecycleEvents.length && !isProtocolBusy()) void drainLifecycleEvents()
    }
  }

  const installPersistenceSubscription = (): void => {
    if (!store) return
    store.$subscribe(() => {
      if (persistTimer) clearTimeout(persistTimer)
      persistTimer = setTimeout(() => {
        persistTimer = null
        void flushPersistence()
      }, PERSISTENCE_DEBOUNCE_MS)
      // Busy transitions also come through this subscription. Retain lifecycle
      // events until a send/restore/reset has finished instead of dropping them.
      if (lifecycleEvents.length) void drainLifecycleEvents()
    }, { detached: true })
  }

  const handleAppStateChange = (isActive: boolean): void => {
    if (isActive === appIsActive) return
    appIsActive = isActive
    lifecycleEvents.push({ isActive, openedAt: Date.now() })
    if (mutableState.status !== 'ready') return
    if (!isActive) {
      if (persistTimer) clearTimeout(persistTimer)
      persistTimer = null
      // A send may continue while hidden; save its current draft immediately,
      // then reconsider resetting once the send has recorded its outcome.
      if (isProtocolBusy() || processingLifecycle) void flushPersistence()
    }
    void drainLifecycleEvents()
  }

  const registerLifecycleListener = (): void => {
    void dependencies.registerAppStateChange(handleAppStateChange)
      .then(() => logStartupStage('application lifecycle listener registered'))
      .catch(error => console.error('[startup] Could not register the application lifecycle listener.', error))
  }

  const startInternal = async (): Promise<void> => {
    mutableState.status = 'loading'
    mutableState.errorMessage = null

    try {
      registerLifecycleListener()
      logStartupStage('initializing storage')
      await withStartupTimeout('Storage initialization', dependencies.initializeStorage())

      store = dependencies.getStore()
      logStartupStage('hydrating protocol state')
      await withStartupTimeout('Protocol hydration', store.hydrateFromStorage())

      // Events received during hydration are represented by the latest app
      // state. Further events are queued while this first evaluation runs.
      lifecycleEvents.length = 0
      try {
        await withStartupTimeout('Protocol lifecycle initialization',
          processLifecycleEvent({ isActive: appIsActive, openedAt: Date.now() }))
      } catch (error) {
        pendingError = { message: 'Das Protokoll konnte nicht automatisch zurückgesetzt werden.', error }
      }

      installPersistenceSubscription()

      mutableState.status = 'ready'
      logStartupStage('application ready')
      dependencies.scheduleAfterPaint(() => {
        void drainLifecycleEvents()
      })
    } catch (error) {
      console.error('[startup] Application startup failed.', error)
      mutableState.errorMessage = STARTUP_ERROR_MESSAGE
      mutableState.status = 'error'
    }
  }

  return {
    state,
    start(): Promise<void> {
      if (!startPromise) startPromise = startInternal()
      return startPromise
    },
    reload(): void {
      window.location.reload()
    },
  }
}

export const appStartup = createAppStartup()
