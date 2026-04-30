import { ref, onMounted, onUnmounted } from 'vue'

export function useTextSelection(containerRef: { value: HTMLElement | null }) {
  const selectedText = ref('')
  const hasSelection = ref(false)

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
        selectedText.value = text
        hasSelection.value = true
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
      selectedText.value = ''
      hasSelection.value = false
    }
    // Clicks fuera (en pestañas, botones, inputs) se ignoran por completo
    // para preservar la última selección válida guardada por onSelectionChange.
  }

  function clearSelection() {
    selectedText.value = ''
    hasSelection.value = false
    window.getSelection()?.removeAllRanges()
  }

  function captureAndReturn(): string {
    const text = selectedText.value
    clearSelection()
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

  return { selectedText, hasSelection, clearSelection, captureAndReturn }
}
