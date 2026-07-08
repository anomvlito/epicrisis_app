<script setup lang="ts">
// Bloque de ejemplo: fragmento de epicrisis (quote) → resultado de anotación.
defineProps<{ label?: string }>()
</script>

<template>
  <div class="bg-slate-50 border border-gray-200 border-l-[3px] border-l-brand-500 rounded-r-md px-3.5 py-2.5 my-2.5 text-[13px]">
    <div v-if="label" class="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-1">{{ label }}</div>
    <div class="font-mono text-xs text-slate-800 bg-white border border-gray-200 rounded px-2.5 py-1.5 my-1">
      <slot name="quote" />
    </div>
    <div class="text-slate-600 mt-1.5">
      <slot name="result" />
    </div>
  </div>
</template>
