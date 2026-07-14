<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { EjemploAnotacion } from '@/constants/guiaEjemplos'
import GuiaEjemploInteractivo from './GuiaEjemploInteractivo.vue'

// Muestra los ejemplos como pestañas navegables (uno a la vez), en lugar de
// apilarlos todos hacia abajo. HU-034.
const props = defineProps<{ ejemplos: EjemploAnotacion[] }>()

const active = ref(0)
const tabEls = ref<HTMLElement[]>([])
const setTabRef = (el: unknown, i: number) => { if (el) tabEls.value[i] = el as HTMLElement }

const go = (i: number) => { active.value = i }
const prev = () => { if (active.value > 0) active.value-- }
const next = () => { if (active.value < props.ejemplos.length - 1) active.value++ }

// Al cambiar de pestaña (por click o por Anterior/Siguiente), desplaza la barra
// para que la pestaña activa quede visible.
watch(active, async () => {
  await nextTick()
  tabEls.value[active.value]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
})
</script>

<template>
  <div>
    <!-- Barra de pestañas (scroll horizontal) -->
    <div class="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1" role="tablist" data-ejemplos-tabs>
      <button
        v-for="(ej, i) in ejemplos"
        :key="ej.id"
        :ref="(el) => setTabRef(el, i)"
        role="tab"
        :aria-selected="active === i"
        class="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0"
        :class="active === i
          ? 'bg-brand-500 text-white border-brand-500'
          : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50'"
        @click="go(i)"
      >
        {{ ej.campoLabel }}
      </button>
    </div>

    <!-- Ejemplo activo (key fuerza estado limpio al cambiar de pestaña) -->
    <div class="mt-1">
      <GuiaEjemploInteractivo :key="ejemplos[active].id" :ejemplo="ejemplos[active]" />
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between mt-3">
      <button
        class="text-xs font-semibold text-brand-600 disabled:text-gray-300 disabled:cursor-default"
        :disabled="active === 0"
        @click="prev"
      >Anterior</button>
      <span class="text-xs text-slate-400">{{ active + 1 }} / {{ ejemplos.length }}</span>
      <button
        class="text-xs font-semibold text-brand-600 disabled:text-gray-300 disabled:cursor-default"
        :disabled="active === ejemplos.length - 1"
        @click="next"
      >Siguiente</button>
    </div>
  </div>
</template>
