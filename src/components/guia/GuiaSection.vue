<script setup lang="ts">
// Sección numerada del manual con ancla para el índice (TOC).
defineProps<{
  anchor: string
  num: number
  title: string
}>()
</script>

<template>
  <section :id="anchor" class="scroll-mt-20 mt-12 first:mt-0">
    <h2 class="flex items-center gap-3 text-lg font-bold text-slate-900 border-b-2 border-gray-200 pb-2 mb-5">
      <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-bold flex-shrink-0">{{ num }}</span>
      {{ title }}
    </h2>
    <div class="text-sm leading-relaxed text-slate-700 space-y-3">
      <slot />
    </div>
  </section>
</template>
