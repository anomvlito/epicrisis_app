import { onMounted, onUnmounted, toRef } from 'vue'
import { useAnnotationStore } from '@/stores/annotation'

export function useTextSelection(containerRef: { value: HTMLElement | null }) {
  const store = useAnnotationStore()

  function onSelectionChange() {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const text = selection.toString().trim()
    if (!text) return

    // Solo guardamos si la selección ocurre DENTRO del contenedor
    if (containerRef.value) {
      const range = selection.getRangeAt(0)
      const isInside = containerRef.value.contains(range.commonAncestorContainer)
      if (isInside) {
        store.selectedText = text
        store.hasSelection = true
      }
    }
  }

  function onMouseUp(e: MouseEvent) {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    // Solo limpiamos si:
    // 1. El click fue dentro del documento clínico
    // 2. No hay una selección activa en ese momento (es un click simple)
    const isClickInside = containerRef.value && containerRef.value.contains(e.target as Node)
    
    if (isClickInside && !text) {
      store.selectedText = ''
      store.hasSelection = false
    }
  }

  function captureAndReturn(): string {
    const text = store.selectedText
    store.clearGlobalSelection()
    return text
  }

  onMounted(() => {
    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('mouseup', onMouseUp)
  })

  onUnmounted(() => {
    document.removeEventListener('selectionchange', onSelectionChange)
    document.removeEventListener('mouseup', onMouseUp)
  })

  return { 
    selectedText: toRef(store, 'selectedText'), 
    hasSelection: toRef(store, 'hasSelection'), 
    clearSelection: store.clearGlobalSelection, 
    captureAndReturn 
  }
}
