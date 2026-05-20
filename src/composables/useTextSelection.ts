import { onMounted, onUnmounted, toRef, watch } from 'vue'
import { useAnnotationStore } from '@/stores/annotation'

type ContainerRef = { value: HTMLElement | null }

function isInsideAny(refs: ContainerRef[], node: Node): boolean {
  return refs.some(r => r.value && r.value.contains(node))
}

export function useTextSelection(containerRef: ContainerRef, ...extraRefs: ContainerRef[]) {
  const store = useAnnotationStore()
  const allRefs = () => [containerRef, ...extraRefs]

  function updatePersistentHighlight() {
    if (!('highlights' in CSS)) return;

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return

    const range = selection.getRangeAt(0)
    const isInside = isInsideAny(allRefs(), range.commonAncestorContainer)

    if (isInside) {
      // @ts-ignore
      CSS.highlights.clear()
      // @ts-ignore
      const highlight = new Highlight(range.cloneRange())
      // @ts-ignore
      CSS.highlights.set('epicrisis-selection', highlight)
    }
  }

  function clearPersistentHighlight() {
    if ('highlights' in CSS) {
      // @ts-ignore
      CSS.highlights.clear()
    }
  }

  watch(() => store.hasSelection, (hasSelection) => {
    if (!hasSelection) {
      clearPersistentHighlight()
    }
  })

  function onSelectionChange() {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const text = selection.toString().trim()
    if (!text) return

    const range = selection.getRangeAt(0)
    if (isInsideAny(allRefs(), range.commonAncestorContainer)) {
      store.selectedText = text
      store.hasSelection = true
    }
  }

  function onMouseUp(e: MouseEvent) {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    const isClickInside = isInsideAny(allRefs(), e.target as Node)

    if (isClickInside && !text) {
      store.selectedText = ''
      store.hasSelection = false
      clearPersistentHighlight()
    } else if (isClickInside && text) {
      updatePersistentHighlight()
    }
  }

  function captureAndReturn(): string {
    const text = store.selectedText
    store.clearGlobalSelection() // This sets hasSelection to false, which triggers the watcher to clear highlights
    return text
  }

  onMounted(() => {
    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('mouseup', onMouseUp)
  })

  onUnmounted(() => {
    document.removeEventListener('selectionchange', onSelectionChange)
    document.removeEventListener('mouseup', onMouseUp)
    clearPersistentHighlight()
  })

  return { 
    selectedText: toRef(store, 'selectedText'), 
    hasSelection: toRef(store, 'hasSelection'), 
    clearSelection: store.clearGlobalSelection, 
    captureAndReturn 
  }
}
