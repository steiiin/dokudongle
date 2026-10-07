import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  createAppStartup,
  type AppStartupDependencies,
} from '@/services/app-startup'

const createStore = (action: 'none' | 'reset' = 'none') => ({
  $subscribe: vi.fn(() => vi.fn()),
  autoResetProtocol: vi.fn().mockResolvedValue(undefined),
  getAutoProtocolResetAction: vi.fn(() => action),
  hydrateFromStorage: vi.fn().mockResolvedValue(undefined),
  markProtocolOpened: vi.fn().mockResolvedValue(undefined),
  isProtocolChanging: false,
  connection: { isTransmitting: false },
  persistToStorage: vi.fn().mockResolvedValue(undefined),
})

const createDependencies = (
  store: ReturnType<typeof createStore>,
  overrides: Partial<AppStartupDependencies> = {},
): AppStartupDependencies => ({
  getStore: () => store,
  initializeStorage: vi.fn().mockResolvedValue(undefined),
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

  test('finishes startup after automatically resetting an expired protocol', async () => {
    const store = createStore('reset')
    const startup = createAppStartup(createDependencies(store))
    await startup.start()
    expect(startup.state.status).toBe('ready')
    expect(store.autoResetProtocol).toHaveBeenCalledOnce()
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

  test('clears a successfully sent protocol on cold start without offering restore', async () => {
    const store = createStore('reset')
    const dependencies = createDependencies(store)
    const startup = createAppStartup(dependencies)

    await startup.start()

    expect(store.hydrateFromStorage).toHaveBeenCalledOnce()
    expect(store.autoResetProtocol).toHaveBeenCalledOnce()
    expect(dependencies.showError).not.toHaveBeenCalled()
    expect(startup.state.status).toBe('ready')
  })

  test('does not rehydrate on resume and still evaluates automatic reset', async () => {
    const store = createStore()
    store.getAutoProtocolResetAction
      .mockReturnValueOnce('none')
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
    appStateHandler!(false)
    appStateHandler!(true)
    await vi.waitFor(() => expect(store.autoResetProtocol).toHaveBeenCalledOnce())

    expect(store.hydrateFromStorage).toHaveBeenCalledOnce()
  })

})
