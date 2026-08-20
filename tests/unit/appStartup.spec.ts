import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  createAppStartup,
  type AppStartupDependencies,
} from '@/services/app-startup'

const createStore = (action: 'none' | 'prompt' | 'reset' = 'none') => ({
  $subscribe: vi.fn(() => vi.fn()),
  autoResetProtocol: vi.fn().mockResolvedValue(undefined),
  discardTemporaryProtocol: vi.fn().mockResolvedValue(undefined),
  getAutoProtocolResetAction: vi.fn(() => action),
  hydrateFromStorage: vi.fn().mockResolvedValue(undefined),
  markAutoProtocolResetPrompted: vi.fn().mockResolvedValue(undefined),
  newProtocol: vi.fn().mockResolvedValue(undefined),
  persistToStorage: vi.fn().mockResolvedValue(undefined),
  restoreTemporaryProtocol: vi.fn().mockResolvedValue(true),
})

const createDependencies = (
  store: ReturnType<typeof createStore>,
  overrides: Partial<AppStartupDependencies> = {},
): AppStartupDependencies => ({
  getStore: () => store,
  hasTemporaryProtocol: vi.fn().mockResolvedValue(false),
  initializeStorage: vi.fn().mockResolvedValue(undefined),
  presentProtocolResetPrompt: vi.fn().mockResolvedValue('cancel'),
  presentTemporaryProtocolRestore: vi.fn().mockResolvedValue('dismiss'),
  registerAppStateChange: vi.fn().mockResolvedValue(undefined),
  scheduleAfterPaint: callback => callback(),
  showError: vi.fn().mockResolvedValue(undefined),
  startupTimeoutMs: 1000,
  ...overrides,
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('application startup', () => {
  test('hydrates before making the routed application ready', async () => {
    let resolveHydration!: () => void
    const hydration = new Promise<void>(resolve => {
      resolveHydration = resolve
    })
    const store = createStore()
    store.hydrateFromStorage.mockReturnValueOnce(hydration)
    const dependencies = createDependencies(store)
    const startup = createAppStartup(dependencies)

    const startPromise = startup.start()
    expect(startup.state.status).toBe('loading')

    resolveHydration()
    await startPromise

    expect(startup.state.status).toBe('ready')
    expect(store.hydrateFromStorage).toHaveBeenCalledOnce()
    expect(store.$subscribe).toHaveBeenCalledOnce()
  })

  test('shows a visible startup error when storage never settles', async () => {
    vi.useFakeTimers()
    const store = createStore()
    const dependencies = createDependencies(store, {
      initializeStorage: () => new Promise<void>(() => undefined),
    })
    const startup = createAppStartup(dependencies)

    const startPromise = startup.start()
    await vi.advanceTimersByTimeAsync(1000)
    await startPromise

    expect(startup.state.status).toBe('error')
    expect(startup.state.errorMessage).toContain('Protokolldaten')
    expect(store.hydrateFromStorage).not.toHaveBeenCalled()
  })

  test('does not keep startup waiting for the automatic-reset restore toast', async () => {
    const store = createStore('reset')
    const presentRestore = vi.fn(() => new Promise<'restore' | 'dismiss'>(() => undefined))
    const dependencies = createDependencies(store, {
      presentTemporaryProtocolRestore: presentRestore,
    })
    const startup = createAppStartup(dependencies)

    await startup.start()

    expect(startup.state.status).toBe('ready')
    expect(store.autoResetProtocol).toHaveBeenCalledOnce()
    expect(presentRestore).toHaveBeenCalledOnce()
  })

  test('keeps the application ready when reset or lifecycle follow-up work fails', async () => {
    const store = createStore('reset')
    store.autoResetProtocol.mockRejectedValueOnce(new Error('audit unavailable'))
    const showError = vi.fn().mockResolvedValue(undefined)
    const dependencies = createDependencies(store, {
      registerAppStateChange: vi.fn().mockRejectedValue(new Error('listener unavailable')),
      showError,
    })
    const startup = createAppStartup(dependencies)

    await startup.start()
    await vi.waitFor(() => expect(showError).toHaveBeenCalledOnce())

    expect(startup.state.status).toBe('ready')
  })

  test('offers a snapshot left by an interrupted previous startup', async () => {
    const store = createStore()
    const dependencies = createDependencies(store, {
      hasTemporaryProtocol: vi.fn().mockResolvedValue(true),
      presentTemporaryProtocolRestore: vi.fn().mockResolvedValue('restore'),
    })
    const startup = createAppStartup(dependencies)

    await startup.start()
    await vi.waitFor(() => expect(store.restoreTemporaryProtocol).toHaveBeenCalledOnce())

    expect(store.autoResetProtocol).not.toHaveBeenCalled()
    expect(store.discardTemporaryProtocol).not.toHaveBeenCalled()
  })

  test('presents the 10-minute prompt only after the application is ready', async () => {
    const store = createStore('prompt')
    const startupRef: { current?: ReturnType<typeof createAppStartup> } = {}
    const presentPrompt = vi.fn(async () => {
      expect(startupRef.current?.state.status).toBe('ready')
      return 'cancel' as const
    })
    const dependencies = createDependencies(store, {
      presentProtocolResetPrompt: presentPrompt,
    })
    const startup = createAppStartup(dependencies)
    startupRef.current = startup

    await startup.start()
    await vi.waitFor(() => expect(store.markAutoProtocolResetPrompted).toHaveBeenCalledOnce())

    expect(presentPrompt).toHaveBeenCalledOnce()
  })

  test('does not rehydrate on resume and still evaluates automatic reset', async () => {
    const store = createStore()
    store.getAutoProtocolResetAction
      .mockReturnValueOnce('none')
      .mockReturnValueOnce('reset')
    let appStateHandler: ((isActive: boolean) => void) | undefined
    const dependencies = createDependencies(store, {
      registerAppStateChange: vi.fn(async handler => {
        appStateHandler = handler
      }),
    })
    const startup = createAppStartup(dependencies)

    await startup.start()
    await vi.waitFor(() => expect(appStateHandler).toBeTypeOf('function'))
    appStateHandler!(true)
    await vi.waitFor(() => expect(store.autoResetProtocol).toHaveBeenCalledOnce())

    expect(store.hydrateFromStorage).toHaveBeenCalledOnce()
  })
})
