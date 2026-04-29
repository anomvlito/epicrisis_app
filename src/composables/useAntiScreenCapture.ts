import { ref, onMounted, onUnmounted } from 'vue'

export function useAntiScreenCapture(containerRef: { value: HTMLElement | null }) {
  const isObscured = ref(false)

  function obscure() {
    isObscured.value = true
    if (containerRef.value) {
      containerRef.value.classList.add('blurred')
      containerRef.value.classList.remove('unblurred')
    }
  }

  function reveal() {
    isObscured.value = false
    if (containerRef.value) {
      containerRef.value.classList.remove('blurred')
      containerRef.value.classList.add('unblurred')
    }
  }

  function onVisibilityChange() {
    if (document.hidden) obscure()
    else reveal()
  }

  function onKeyDown(e: KeyboardEvent) {
    const isCtrl = e.ctrlKey || e.metaKey
    if (isCtrl && (e.key === 'c' || e.key === 'x' || e.key === 'p')) {
      e.preventDefault()
    }
    if (e.key === 'PrintScreen') {
      e.preventDefault()
      obscure()
      setTimeout(reveal, 3000)
    }
  }

  function onContextMenu(e: MouseEvent) {
    if (containerRef.value?.contains(e.target as Node)) {
      e.preventDefault()
    }
  }

  function onCopy(e: ClipboardEvent) {
    if (containerRef.value?.contains(e.target as Node)) {
      e.preventDefault()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('copy', onCopy)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('contextmenu', onContextMenu)
    document.removeEventListener('copy', onCopy)
  })

  return { isObscured, obscure, reveal }
}
