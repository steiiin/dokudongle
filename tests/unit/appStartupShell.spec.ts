import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  hide: vi.fn().mockResolvedValue(undefined),
  reload: vi.fn(),
  start: vi.fn(() => new Promise<void>(() => undefined)),
  state: {
    status: 'loading' as const,
    errorMessage: null,
  },
}))

vi.mock('@/services/app-startup', () => ({
  appStartup: {
    state: mocks.state,
    start: mocks.start,
    reload: mocks.reload,
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}))

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: mocks.hide,
  },
}))

vi.mock('@ionic/vue', () => ({
  IonApp: {
    template: '<div class="ion-app"><slot /></div>',
  },
  IonRouterOutlet: {
    template: '<div class="router-outlet" />',
  },
}))

import App from '@/App.vue'

describe('application startup shell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
  })

  test('renders loading content before startup settles or routes mount', async () => {
    const wrapper = mount(App)

    expect(wrapper.text()).toContain('DokuDongle wird geladen')
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.find('.router-outlet').exists()).toBe(false)
    await vi.waitFor(() => expect(mocks.start).toHaveBeenCalledOnce())
  })
})
