import { App as CapacitorApp } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
import { toastController } from '@ionic/vue'
import { reactive, readonly, type DeepReadonly } from 'vue'

import { useDokuStore, type AutoProtocolResetAction } from '@/store/doku'
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
  newProtocol: DokuStore['newProtocol']
  persistToStorage: DokuStore['persistToStorage']
  hydrateFromStorage: DokuStore['hydrateFromStorage']
  wasCurrentProtocolSent: DokuStore['wasCurrentProtocolSent']
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
  let isResetFlowOpen = false
  let pendingResetAction: AutoProtocolResetAction = 'none'
  let pendingResetError: string | null = null

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

  const installPersistenceSubscription = (): void => {
    if (!store) return
    store.$subscribe(() => {
      if (persistTimer) clearTimeout(persistTimer)
      persistTimer = setTimeout(() => {
        persistTimer = null
        void flushPersistence()
      }, PERSISTENCE_DEBOUNCE_MS)
    }, { detached: true })
  }

  const handleResetAction = async (action: AutoProtocolResetAction): Promise<void> => {
    if (!store || action === 'none' || isResetFlowOpen) return

    isResetFlowOpen = true
    try {
      await store.autoResetProtocol()
    } catch (error) {
      await reportNonFatalError('Das Protokoll konnte nicht automatisch zurückgesetzt werden.', error)
    } finally {
      isResetFlowOpen = false
    }
  }

  const runPostReadyFlow = async (): Promise<void> => {
    if (!store) return

    if (pendingResetError) {
      const message = pendingResetError
      pendingResetError = null
      await reportNonFatalError(message, new Error('Protocol reset failed during startup.'))
    }

    const action = pendingResetAction
    pendingResetAction = 'none'
    await handleResetAction(action)
  }

  const handleAppStateChange = (isActive: boolean): void => {
    if (!isActive) {
      void flushPersistence()
      return
    }

    if (!store || mutableState.status !== 'ready') return
    void handleResetAction(store.getAutoProtocolResetAction())
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
      logStartupStage('initializing storage')
      await withStartupTimeout('Storage initialization', dependencies.initializeStorage())

      store = dependencies.getStore()
      logStartupStage('hydrating protocol state')
      await withStartupTimeout('Protocol hydration', store.hydrateFromStorage())

      let sentProtocolResetFailed = false
      if (store.wasCurrentProtocolSent()) {
        try {
          logStartupStage('resetting successfully sent protocol')
          await withStartupTimeout('Sent protocol reset', store.newProtocol())
        } catch (error) {
          console.error('[startup] Sent protocol reset failed.', error)
          pendingResetError = 'Das gesendete Protokoll konnte beim Start nicht zurückgesetzt werden.'
          sentProtocolResetFailed = true
        }
      }

      if (!sentProtocolResetFailed) {
        pendingResetAction = store.getAutoProtocolResetAction()
      }

      if (pendingResetAction === 'reset') {
        try {
          logStartupStage('automatically resetting expired protocol')
          await withStartupTimeout('Automatic protocol reset', store.autoResetProtocol())
          pendingResetAction = 'none'
        } catch (error) {
          console.error('[startup] Automatic protocol reset failed.', error)
          pendingResetError = 'Das Protokoll konnte nicht automatisch zurückgesetzt werden.'
          pendingResetAction = 'none'
        }
      }

      installPersistenceSubscription()
      registerLifecycleListener()

      mutableState.status = 'ready'
      logStartupStage('application ready')
      dependencies.scheduleAfterPaint(() => {
        void runPostReadyFlow()
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
