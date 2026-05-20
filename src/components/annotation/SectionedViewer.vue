<script setup lang="ts">
import { computed } from 'vue'
import type { EpicrisisSection } from '@/stores/epicrisis'

const props = defineProps<{
  sections: EpicrisisSection[]
  highlightQuery?: string
  activeMatch?: number
}>()

// Limpia artefactos de anonimización del texto
function cleanText(text: string): string {
  return text
    .replace(/[ \t]*\[FIRMA MÉDICO ANONIMIZADA\][ \t]*\n+[ \t]*\d{1,2}[-/]\d{1,2}[-/]\d{4}[^\n]*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Convierte texto plano a HTML simple (párrafos, negritas "Label: valor")
function textToHtml(raw: string): string {
  const text = cleanText(raw)
  const paragraphs = text.split(/\n{2,}/)
  return paragraphs
    .map((block) => {
      const lines = block.split('\n').map((line) => {
        const s = line.trim()
        if (!s) return ''
        // "Label: valor" → <strong>Label:</strong> valor
        const colonIdx = s.indexOf(':')
        if (
          colonIdx > 0 &&
          colonIdx < 40 &&
          !/^[-*>]/.test(s) &&
          !s.startsWith('<')
        ) {
          const label = s.slice(0, colonIdx).trim()
          const value = s.slice(colonIdx + 1).trim()
          if (value && label.split(' ').length <= 4) {
            return `<strong>${label}:</strong> ${escapeHtml(value)}`
          }
        }
        return escapeHtml(s)
      })
      return `<p>${lines.filter(Boolean).join('<br>')}</p>`
    })
    .join('')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function applyHighlight(html: string, query: string, activeIdx: number, startCount: number): [string, number] {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(escaped, 'gi')
  let idx = startCount
  const result = html.replace(/(?<=>)[^<]+(?=<)/g, (text) =>
    text.replace(re, (m) => {
      const i = idx++
      const style =
        i === activeIdx
          ? 'background:#f59e0b;color:#fff;border-radius:2px;'
          : 'background:#fef08a;color:#78350f;border-radius:2px;'
      return `<mark data-match="${i}" style="${style}">${m}</mark>`
    })
  )
  return [result, idx]
}

const renderedSections = computed(() => {
  const q = props.highlightQuery?.trim()
  const activeIdx = props.activeMatch ?? 0
  let matchCount = 0

  return props.sections.map((section) => {
    let html = textToHtml(section.content)
    if (q && q.length >= 2) {
      const [highlighted, nextCount] = applyHighlight(html, q, activeIdx, matchCount)
      html = highlighted
      matchCount = nextCount
    }
    return { ...section, html }
  })
})
</script>

<template>
  <article class="epi-sectioned">
    <template v-for="(section, idx) in renderedSections" :key="section.sectionName">
      <!-- Separador entre secciones (no antes de la primera) -->
      <hr v-if="idx > 0" class="epi-section-divider" />

      <!-- Header de sección -->
      <h2 class="epi-section-header">{{ section.label }}</h2>

      <!-- Contenido -->
      <div class="epi-section-body" v-html="section.html" />
    </template>
  </article>
</template>

<style scoped>
.epi-sectioned {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 0.9375rem;
  line-height: 1.75;
  color: #1e293b;
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: break-word;
}

.epi-section-divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 1.75rem 0;
}

.epi-section-header {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  background: #f8fafc;
  border-left: 3px solid #3b82f6;
  padding: 0.35rem 0.75rem;
  margin: 0 0 1rem 0;
  border-radius: 0 4px 4px 0;
}

.epi-sectioned :deep(.epi-section-body p) {
  margin: 0 0 0.75rem 0;
}

.epi-sectioned :deep(.epi-section-body p:last-child) {
  margin-bottom: 0;
}

.epi-sectioned :deep(.epi-section-body strong) {
  font-weight: 600;
  color: #0f172a;
}

.epi-sectioned :deep(::selection) {
  background: #bae6fd;
  color: #0c4a6e;
}

.epi-sectioned :deep(mark) {
  background: unset;
  color: unset;
}
</style>
