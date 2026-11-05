import { getMode } from '@ionic/core'
import '@/theme/ripple.css'

// Match the app mode used by Ionic's built-in buttons and chips.
export const isMaterialMode = () => getMode() === 'md'
