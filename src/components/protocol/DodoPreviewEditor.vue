<template>
  <div class="preview-editor">

    <div class="editor-surface">
      <textarea ref="textarea" :value="draft" aria-label="Protokolltext bearbeiten"
        :readonly="readonly" spellcheck="false" autocorrect="off" autocapitalize="off"
        @input="input" @compositionstart="composing = true" @compositionend="compositionEnd"
        @scroll="syncMirror" />
      <div ref="mirror" class="text-mirror"><template v-for="(part, index) in parts" :key="part.conflict?.id ?? index"><span
        v-if="part.conflict" class="conflict" :class="{ deletion: !part.text }"
        role="button" :tabindex="readonly ? -1 : 0" :aria-disabled="readonly"
        :aria-label="part.text ? `Textänderung auswählen: ${part.text}` : 'Gelöschten Text auswählen'"
        :data-conflict-id="part.conflict.id" @pointerdown.prevent
        @click="openConflict(part.conflict.id, $event)"
        @keydown.enter.prevent="openConflict(part.conflict.id, $event)"
        @keydown.space.prevent="openConflict(part.conflict.id, $event)"
      >{{ part.text }}</span><span v-else aria-hidden="true">{{ part.text }}</span></template>{{ '\u200b' }}</div>
    </div>
    <IonPopover :is-open="!!selected" :event="popoverEvent" @didDismiss="selectedId = null">
      <div v-if="selected" class="conflict-options">
        <p class="alternative">{{ selected.userText || '(Text entfernen)' }}</p>
        <IonButton expand="block" color="success" @click="resolve('user')">Eigene Version</IonButton>
        <hr>
        <p class="alternative">{{ selected.generatedText || '(Text entfernen)' }}</p>
        <IonButton expand="block" color="danger" @click="resolve('generated')">Neue Version</IonButton>
      </div>
    </IonPopover>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PreviewConflict, PreviewDocument } from '@/utils/preview-document'
import { textEdits } from '@/utils/preview-document'

const props = defineProps<{ document: PreviewDocument; readonly?: boolean }>()
const emit = defineEmits<{
  edit: [text: string]
  resolve: [id: string, choice: 'user' | 'generated']
}>()
const textarea = ref<HTMLTextAreaElement>()
const mirror = ref<HTMLDivElement>()
const draft = ref(props.document.text)
const composing = ref(false)
const selectedId = ref<string | null>(null)
const popoverEvent = ref<Event>()
const selected = computed(() => props.document.conflicts.find(item => item.id === selectedId.value))
const parts = computed(() => {
  const result: { text: string; conflict?: PreviewConflict }[] = []
  let position = 0
  // During IME composition the native text remains authoritative; highlights resume on commit.
  for (const conflict of composing.value ? [] : props.document.conflicts) {
    result.push({ text: draft.value.slice(position, conflict.start) })
    result.push({ text: draft.value.slice(conflict.start, conflict.end), conflict })
    position = conflict.end
  }
  result.push({ text: draft.value.slice(position) })
  return result
})

function syncMirror() {
  if (!textarea.value || !mirror.value) return
  mirror.value.style.width = `${textarea.value.clientWidth}px`
  mirror.value.scrollTop = textarea.value.scrollTop
  mirror.value.scrollLeft = textarea.value.scrollLeft
}

watch(() => props.document.text, async text => {
  if (composing.value || text === draft.value) return
  const input = textarea.value
  const edits = textEdits(draft.value, text, true)
  const mapPosition = (position: number) => {
    let shift = 0
    for (const edit of edits) {
      if (position < edit.start) break
      if (position <= edit.end) return edit.start + shift + edit.text.length
      shift += edit.text.length - (edit.end - edit.start)
    }
    return position + shift
  }
  const start = mapPosition(input?.selectionStart ?? 0)
  const end = mapPosition(input?.selectionEnd ?? 0)
  const scrollTop = input?.scrollTop ?? 0
  draft.value = text
  await nextTick()
  if (input) {
    input.setSelectionRange(start, end)
    input.scrollTop = scrollTop
  }
  syncMirror()
})

function input(event: Event) {
  draft.value = (event.target as HTMLTextAreaElement).value
  if (!composing.value) emit('edit', draft.value)
  void nextTick(syncMirror)
}

function compositionEnd(event: CompositionEvent) {
  composing.value = false
  input(event)
}

function openConflict(id: string, event: Event) {
  if (props.readonly || composing.value) return
  selectedId.value = id
  popoverEvent.value = event
}

function resolve(choice: 'user' | 'generated') {
  if (!selectedId.value || props.readonly) return
  emit('resolve', selectedId.value, choice)
  selectedId.value = null
  void nextTick(() => textarea.value?.focus({ preventScroll: true }))
}

let observer: ResizeObserver | undefined
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined' && textarea.value) {
    observer = new ResizeObserver(syncMirror)
    observer.observe(textarea.value)
  }
  syncMirror()
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.preview-editor { display: flex; flex-direction: column; height: 100%; }
.conflict-summary { padding: 0.5rem 1rem; font-size: 0.85rem; color: var(--ion-color-warning); }
.editor-surface { position: relative; flex: 1; min-height: 0; }
textarea, .text-mirror {
  position: absolute; inset: 0; box-sizing: border-box; width: 100%; height: 100%;
  border: 0; margin: 0; padding: 1rem 1rem 6rem; font: inherit; line-height: 1.5;
  letter-spacing: normal; tab-size: 8; white-space: pre-wrap; overflow-wrap: break-word;
}
textarea { resize: none; display: block; background: var(--ion-background-color); color: var(--ion-text-color); }
.text-mirror { color: transparent; pointer-events: none; overflow: hidden; user-select: none; }
.conflict { background: rgb(255 196 9 / 30%); border-radius: 2px; pointer-events: auto; cursor: pointer; }
.conflict:focus-visible { outline: 2px solid var(--ion-color-warning); }
.deletion {
  position: relative; display: inline-block; width: 1em; height: 1em;
  margin-right: -1em; vertical-align: text-bottom;
}
.deletion::after {
  content: '↧'; position: absolute; left: 0; top: -0.35em; color: var(--ion-color-warning);
  background: var(--ion-background-color); border: 1px solid currentColor; border-radius: 3px;
  line-height: 1; padding: 0.1em; pointer-events: auto;
}
.conflict-options { padding: 1rem; }
.alternative {
  margin: 0; padding: 0 0 .25rem 0;
  font-size: 0.9rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
