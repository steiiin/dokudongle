import { isPlatform } from '@ionic/vue'

// Only the main app bars adapt to iOS; the app itself always uses Material mode.
export const getMainHeaderMode = (): 'ios' | 'md' => isPlatform('ios') ? 'ios' : 'md'
