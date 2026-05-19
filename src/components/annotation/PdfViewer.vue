<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ pdfPath: string }>()

const pdfUrl = computed(() => {
  if (!props.pdfPath) return ''
  const filename = props.pdfPath.split('/').pop()
  return `/api/pdf?id=${filename}`
})
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0 h-full bg-gray-100">
    <iframe
      v-if="pdfUrl"
      :src="pdfUrl"
      class="flex-1 w-full h-full border-0"
      title="Visor de PDF"
    ></iframe>
    <div v-else class="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400 text-sm">
      <svg class="w-10 h-10 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Cargando PDF…</span>
    </div>
  </div>
</template>
