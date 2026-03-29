import { nextTick, unref } from "vue"

export function gainFocus(inputVal: any|null, selectAll: boolean = false)
{
  setTimeout(() => {

    const inputCmp = unref(inputVal)

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

export async function tryScrollingToTop()
{
  await nextTick()
  setTimeout(() => {
    const ionContents = document.getElementsByTagName('ion-content')
    if (ionContents.length>0) {
      ionContents[0].scrollToBottom?.()
      ionContents[0].scrollToTop?.(200)
    }
  }, 300)
}

export async function tryScrollingToBottom()
{
  await nextTick()
  setTimeout(() => {
    const ionContents = document.getElementsByTagName('ion-content')
    if (ionContents.length>0) {
      ionContents[0].scrollToBottom?.(200)
    }
  }, 300)
}