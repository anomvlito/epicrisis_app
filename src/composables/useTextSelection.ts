import { ref, onMounted, onUnmounted } from 'vue'

export function useTextSelection(containerRef: { value: HTMLElement | null }) {
  const selectedText = ref('')
  const hasSelection = ref(false)

  function onMouseUp(e: MouseEvent) {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    // 1. Si hay texto seleccionado, intentamos capturarlo si está dentro del contenedor
    if (text) {
      let isInside = true
      if (containerRef.value) {
        const range = selection!.getRangeAt(0)
        isInside = containerRef.value.contains(range.commonAncestorContainer)
      }

      if (isInside) {
        selectedText.value = text
        hasSelection.value = true
        return
      }
    }

    // 2. Si no hay texto o la selección es externa, solo limpiamos si el click
    // físico ocurrió dentro del contenedor. Esto permite que clicks en botones/pestañas
    // fuera del documento no borren la selección que el usuario ya tenía.
    if (containerRef.value && containerRef.value.contains(e.target as Node)) {
      selectedText.value = ''
      hasSelection.value = false
    }
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
    document.addEventListener('mouseup', onMouseUp)
  })

  onUnmounted(() => {
    document.removeEventListener('mouseup', onMouseUp)
  })

  return { selectedText, hasSelection, clearSelection, captureAndReturn }
}
