<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant: 'blue' | 'green' | 'amber' | 'red'
  icon?: string
}>()

const boxClasses = computed(() => {
  switch (props.variant) {
    case 'green': return 'bg-green-50 border-green-200'
    case 'amber': return 'bg-amber-50 border-amber-200'
    case 'red':   return 'bg-red-50 border-red-200'
    default:      return 'bg-brand-50 border-brand-100'
  }
})
const defaultIcon = computed(() => {
  switch (props.variant) {
    case 'green': return '✅'
    case 'amber': return '⚠️'
    case 'red':   return '⛔'
    default:      return 'ℹ️'
  }
})
</script>

<template>
  <div class="flex items-start gap-3 rounded-lg border px-4 py-3.5 my-4 text-sm leading-relaxed text-slate-700" :class="boxClasses">
    <span class="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{{ icon ?? defaultIcon }}</span>
    <div><slot /></div>
  </div>
</template>
