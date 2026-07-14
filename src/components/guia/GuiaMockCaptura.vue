<script setup lang="ts">
// Ejemplo gráfico (solo lectura, sin store) que ilustra el flujo de CAPTURAR
// EVIDENCIA: se selecciona un fragmento del documento y se presiona Capturar
// para dejarlo como evidencia del criterio. Mismo lenguaje visual que la
// pantalla real de anotación.
import { ref, computed } from 'vue'

const DOC_ANTES = 'ANTECEDENTES: Paciente con '
const DOC_MATCH = 'hipertensión arterial en tratamiento con losartán'
const DOC_DESPUES = '. Sin otros antecedentes relevantes.'

const seleccionado = ref('')
const evidencia = ref('')

function seleccionar() {
  seleccionado.value = DOC_MATCH
}
function capturar() {
  if (seleccionado.value) evidencia.value = seleccionado.value
}
function limpiar() {
  evidencia.value = ''
  seleccionado.value = ''
}

const btnBase = 'px-2.5 py-1 rounded text-[11px] font-bold border'
const puedeCapturar = computed(() => !!seleccionado.value && !evidencia.value)
</script>

<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden bg-white my-4 not-prose">
    <div class="bg-slate-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-2">
      <span class="text-xs font-bold text-slate-700">Capturar evidencia</span>
      <span class="text-[11px] text-slate-400">Ejemplo visual</span>
    </div>

    <div class="grid md:grid-cols-2 gap-0">
      <!-- Documento con fragmento seleccionable -->
      <div class="p-4 md:border-r border-gray-100">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Documento</div>
        <p class="font-mono text-[12.5px] leading-relaxed text-slate-700">
          {{ DOC_ANTES }}<button
            type="button"
            class="rounded px-1 -mx-0.5 border-b-2"
            :class="seleccionado ? 'bg-green-200 border-green-500' : 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'"
            @click="seleccionar"
          >{{ DOC_MATCH }}</button>{{ DOC_DESPUES }}
        </p>
        <p v-if="seleccionado" class="text-[11px] text-green-700 mt-2">
          Texto seleccionado — presiona "Capturar" en el formulario.
        </p>
        <p v-else class="text-[11px] text-slate-400 mt-2">Haz clic en el texto resaltado para seleccionarlo.</p>
      </div>

      <!-- Criterio con captura -->
      <div class="p-4 bg-slate-50/50">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Formulario</div>

        <div class="border border-gray-200 rounded-lg bg-white p-2.5">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-semibold text-gray-800 leading-tight">Hipertensión arterial</p>
            <div class="flex gap-1 flex-shrink-0">
              <span :class="[btnBase, 'bg-green-500 text-white border-green-500']">Sí</span>
              <span :class="[btnBase, 'bg-white text-gray-400 border-gray-200']">No</span>
              <span :class="[btnBase, 'bg-white text-gray-400 border-gray-200']">?</span>
            </div>
          </div>

          <div class="mt-2 border-t border-gray-50 pt-2 space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Evidencia (ground truth)</label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="text-[10px] font-semibold text-brand-600 hover:text-brand-700 disabled:text-gray-300"
                  :disabled="!puedeCapturar"
                  @click="capturar"
                >Capturar</button>
                <button v-if="evidencia" type="button" class="text-[10px] text-gray-400 hover:text-red-500" @click="limpiar">limpiar</button>
              </div>
            </div>
            <div
              class="min-h-[28px] rounded border px-2 py-1.5 text-xs font-mono leading-relaxed"
              :class="evidencia ? 'bg-yellow-50 border-yellow-300 text-gray-800' : 'bg-gray-50 border-gray-200 text-gray-400 italic'"
            >{{ evidencia || 'Selecciona texto en el documento y presiona "Capturar"' }}</div>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 mt-2">Los criterios marcados Sí y ? deben tener evidencia capturada.</p>
      </div>
    </div>
  </div>
</template>
