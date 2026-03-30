import { nextTick, unref } from "vue"

// ############################################################################

export function gainFocus(inputRef: any|null, selectAll: boolean = false)
{
  setTimeout(() => {

    const inputCmp = unref(inputRef)

    if (!inputCmp) { return }
    if (!inputCmp.$el) { return }

    const EL = inputCmp.$el
    if (typeof EL.setFocus === "function") { EL.setFocus() }
    else
    {
      // fallback for multi-input components
      const fallbackEL = EL.querySelector('ion-input')
      if (fallbackEL && typeof fallbackEL.setFocus === "function") { fallbackEL.setFocus() }
    }

    if (!selectAll) { return }
    if (typeof EL.querySelector === "function")
    {

      const nativeInput = EL.querySelector('input')
      if (typeof nativeInput.select === "function") { nativeInput.select() }

    }

  }, 300)
}

export function setNativeValue(inputRef: any|null, value: string) {
  const inputCmp = inputRef?.value
  if (!inputCmp?.$el) { return }
  inputCmp.$el.value = value
}

// ############################################################################

var currentlyScrolling: boolean = false
const Scroll_Top = 'top'
const Scroll_Bottom = 'bottom'
const Scroll_Delay = 300

function getActiveIonContent(): HTMLElement | null
{
  const ionContents = document.querySelectorAll('ion-content')
  if (ionContents.length <= 0) { return null }

  for (let i = ionContents.length - 1; i >= 0; i--)
  {
    const ionContent = ionContents[i] as HTMLElement
    const rect = ionContent.getBoundingClientRect()
    const isVisible = rect.height > 0 && rect.width > 0
    if (isVisible) { return ionContent }
  }

  return ionContents[ionContents.length - 1] as HTMLElement
}
async function tryScrolling(where: string)
{

  if (currentlyScrolling) { return }
  currentlyScrolling = true

  try
  {
    await nextTick()
    await customElements.whenDefined('ion-content')
    setTimeout(async () => {
      const ionContent = getActiveIonContent() as any | null
      if (!ionContent) { return }

      if (where === Scroll_Top) { await ionContent.scrollToTop?.(Scroll_Delay) }
      else if (where === Scroll_Bottom) { await ionContent.scrollToBottom?.(Scroll_Delay) }
    }, Scroll_Delay)
  }
  finally
  {
    setTimeout(() => currentlyScrolling = false, Scroll_Delay * 2)
  }

}

export async function tryScrollingToTop()
{
  await tryScrolling(Scroll_Top)
}
export async function tryScrollingToBottom()
{
  await tryScrolling(Scroll_Bottom)
}
