<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { normalizeSearch } from '@/constants/clinicalItems'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const props = defineProps<{ pdfPath: string; searchQuery?: string }>()

// Expose container so AnnotationView can include it in text-selection scope
const containerRef = ref<HTMLDivElement | null>(null)
const pdfMatchCount = ref(0)

function applyHighlights() {
  if (!containerRef.value) return
  const spans = containerRef.value.querySelectorAll<HTMLElement>('.pdfTextLayer span')
  const q = normalizeSearch(props.searchQuery?.trim() ?? '')
  let count = 0
  spans.forEach(span => {
    const matches = q.length >= 2 && normalizeSearch(span.textContent ?? '').includes(q)
    span.classList.toggle('search-highlight', matches)
    if (matches) count++
  })
  pdfMatchCount.value = count
}

function scrollToPdfMatch(index: number) {
  if (!containerRef.value) return
  const matches = containerRef.value.querySelectorAll<HTMLElement>('.search-highlight')
  matches[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

defineExpose({ containerRef, pdfMatchCount, scrollToPdfMatch })

const pdfUrl = computed(() => {
  if (!props.pdfPath) return ''
  const filename = props.pdfPath.split('/').pop()
  return `/api/pdf?id=${filename}`
})

const loading = ref(true)
const error = ref('')
const scale = ref(1.4)

let currentDoc: PDFDocumentProxy | null = null

async function renderPage(page: PDFPageProxy, wrapper: HTMLDivElement) {
  const viewport = page.getViewport({ scale: scale.value })

  // Canvas
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  canvas.style.display = 'block'
  canvas.style.width = '100%'

  // Text layer div (overlays canvas)
  const textDiv = document.createElement('div')
  textDiv.className = 'pdfTextLayer'
  textDiv.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    overflow: hidden; line-height: 1; user-select: text; -webkit-user-select: text;
  `

  wrapper.style.position = 'relative'
  wrapper.appendChild(canvas)
  wrapper.appendChild(textDiv)

  // Render canvas
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, canvas, viewport }).promise

  // Render text layer
  try {
    const textLayer = new pdfjsLib.TextLayer({
      textContentSource: page.streamTextContent(),
      container: textDiv,
      viewport,
    })
    await textLayer.render()
  } catch {
    // text layer optional — canvas still visible
  }
}

async function loadPdf(url: string) {
  if (!url) return
  loading.value = true
  error.value = ''

  // Clear previous content
  if (containerRef.value) containerRef.value.innerHTML = ''

  // Cancel any previous doc
  if (currentDoc) {
    await currentDoc.destroy()
    currentDoc = null
  }

  try {
    const doc = await pdfjsLib.getDocument({ url, withCredentials: false }).promise
    currentDoc = doc

    if (!containerRef.value) return

    const total = doc.numPages
    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i)
      const wrapper = document.createElement('div')
      wrapper.style.cssText =
        'margin: 0 auto 12px auto; max-width: 860px; background: white; box-shadow: 0 1px 4px rgba(0,0,0,.15); overflow: hidden;'
      containerRef.value.appendChild(wrapper)
      await renderPage(page, wrapper)
      page.cleanup()
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Error cargando PDF'
  } finally {
    loading.value = false
    applyHighlights()
  }
}

watch(pdfUrl, (url) => { loadPdf(url) }, { immediate: true })
watch(() => props.searchQuery, applyHighlights)

onBeforeUnmount(async () => {
  if (currentDoc) await currentDoc.destroy()
})
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0 h-full bg-[#e8ecf0] overflow-y-auto">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400 text-sm">
      <svg class="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span>Cargando PDF…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center flex-1 text-red-500 text-sm p-4 text-center">
      {{ error }}
    </div>

    <!-- PDF pages rendered here -->
    <div
      ref="containerRef"
      class="py-6 px-4"
      :class="{ 'hidden': loading || error }"
    />
  </div>
</template>

<style>
/* PDF.js text layer styles */
.pdfTextLayer span,
.pdfTextLayer br {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
.pdfTextLayer ::selection {
  background: rgba(0, 120, 255, 0.25);
}
.pdfTextLayer .highlight {
  margin: -1px;
  padding: 1px;
  background-color: rgba(180, 0, 170, 0.2);
  border-radius: 4px;
}
.pdfTextLayer .search-highlight {
  background-color: rgba(250, 200, 0, 0.5);
  border-radius: 2px;
  outline: 1px solid rgba(200, 150, 0, 0.5);
}
</style>
