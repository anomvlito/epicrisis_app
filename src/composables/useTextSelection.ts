import { ref, onMounted, onUnmounted } from 'vue'

export function useTextSelection(containerRef: { value: HTMLElement | null }) {
  const selectedText = ref('')
  const hasSelection = ref(false)

  function onMouseUp() {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const text = selection.toString().trim()
    if (!text) {
      hasSelection.value = false
      return
    }

    if (containerRef.value) {
      const range = selection.getRangeAt(0)
      const isInsideContainer = containerRef.value.contains(range.commonAncestorContainer)
      if (!isInsideContainer) return
    }

    selectedText.value = text
    hasSelection.value = true
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
