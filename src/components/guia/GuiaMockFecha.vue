<script setup lang="ts">
// Ejemplo gráfico (solo lectura, sin store) de un campo de FECHA: la primera
// sección pide la "Fecha de ingreso al hospital" (Bloque 1). Se ilustra cómo se
// toma la fecha desde el documento y se ingresa en formato DD/MM/AAAA.
import { ref } from 'vue'

const DOC_ANTES = 'INGRESO: El paciente '
const DOC_MATCH = 'ingresa al hospital el 12/03/2026'
const DOC_DESPUES = ' y es trasladado a la UCI el mismo día.'

const fecha = ref('')

function usarFecha() {
  fecha.value = '12/03/2026'
}
</script>

<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden bg-white my-4 not-prose">
    <div class="bg-slate-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-2">
      <span class="text-xs font-bold text-slate-700">Campo de fecha</span>
      <span class="text-[11px] text-slate-400">Ejemplo visual</span>
    </div>

    <div class="grid md:grid-cols-2 gap-0">
      <!-- Documento con la fecha -->
      <div class="p-4 md:border-r border-gray-100">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Documento</div>
        <p class="font-mono text-[12.5px] leading-relaxed text-slate-700">
          {{ DOC_ANTES }}<button
            type="button"
            class="rounded px-1 -mx-0.5 border-b-2"
            :class="fecha ? 'bg-green-200 border-green-500' : 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'"
            @click="usarFecha"
          >{{ DOC_MATCH }}</button>{{ DOC_DESPUES }}
        </p>
        <p class="text-[11px] text-slate-400 mt-2">Haz clic en la fecha del documento para usarla.</p>
      </div>

      <!-- Campo de fecha -->
      <div class="p-4 bg-slate-50/50">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Formulario</div>

        <div class="border border-gray-200 rounded-lg bg-white p-2.5">
          <label class="block text-xs font-semibold text-gray-800 leading-tight mb-1.5">Fecha de ingreso al hospital</label>
          <input
            v-model="fecha"
            type="text"
            placeholder="DD/MM/AAAA"
            aria-label="Fecha de ingreso al hospital"
            class="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs font-mono text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-400 bg-white"
          />
        </div>
        <p class="text-[11px] text-slate-400 mt-2">Algunos campos piden una fecha en vez de Sí / No / ?.</p>
      </div>
    </div>
  </div>
</template>
