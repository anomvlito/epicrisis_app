<script setup lang="ts">
import { computed } from 'vue'

// Pill de valor del formulario de anotación: refleja los tres estados actuales
// de un criterio (Sí / No / ?). No existe "dificultad" ni tipos de incertidumbre.
const props = defineProps<{ variant: 'si' | 'no' | 'ns' }>()

const label = computed(() => (props.variant === 'si' ? 'Sí' : props.variant === 'no' ? 'No' : '?'))
const classes = computed(() => {
  switch (props.variant) {
    case 'si': return 'bg-green-100 text-green-700 border-green-300'
    case 'no': return 'bg-red-100 text-red-700 border-red-300'
    default:   return 'bg-amber-100 text-amber-700 border-amber-300'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full border align-middle"
    :class="classes"
  >{{ label }}</span>
</template>
