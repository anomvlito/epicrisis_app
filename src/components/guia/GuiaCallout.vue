<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant: 'blue' | 'green' | 'amber' | 'red'
}>()

// Acento por variante mediante fondo + borde izquierdo de color (sin iconos/emojis).
const boxClasses = computed(() => {
  switch (props.variant) {
    case 'green': return 'bg-green-50 border-green-200 border-l-4 border-l-green-400'
    case 'amber': return 'bg-amber-50 border-amber-200 border-l-4 border-l-amber-400'
    case 'red':   return 'bg-red-50 border-red-200 border-l-4 border-l-red-400'
    default:      return 'bg-brand-50 border-brand-100 border-l-4 border-l-brand-400'
  }
})
</script>

<template>
  <div class="rounded-lg border px-4 py-3.5 my-4 text-sm leading-relaxed text-slate-700" :class="boxClasses">
    <slot />
  </div>
</template>
