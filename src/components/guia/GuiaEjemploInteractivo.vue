<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EjemploAnotacion, ValorAnotacion, SospechaClinica } from '@/constants/guiaEjemplos'
import GuiaValuePill from './GuiaValuePill.vue'

// Réplica FIEL (autocontenida) de un criterio del formulario real (AnnotationNode.vue):
// botones Sí/No/?, bloque de evidencia y "Sospecha clínica" al marcar ?. Estado
// LOCAL — no toca el store de producción. Enseña sin efectos secundarios.
const props = defineProps<{ ejemplo: EjemploAnotacion }>()

const valor = ref<ValorAnotacion | null>(null)
const evidencia = ref('')
const sospecha = ref<SospechaClinica | ''>('')
const seleccionado = ref('')
const revelado = ref(false)

// Divide el texto del documento para resaltar el fragmento de evidencia.
const partes = computed(() => {
  const full = props.ejemplo.textoDocumento
  const target = props.ejemplo.evidenciaResaltada
  const i = full.indexOf(target)
  if (i === -1) return { antes: full, match: '', despues: '' }
  return { antes: full.slice(0, i), match: target, despues: full.slice(i + target.length) }
})

const mostrarEvidencia = computed(() => valor.value === 'si' || valor.value === 'ns')

function setValor(v: ValorAnotacion) {
  valor.value = valor.value === v ? null : v
}
function capturar() {
  if (seleccionado.value) evidencia.value = seleccionado.value
}

// Compara la respuesta del usuario con la correcta (para el feedback al revelar).
const acierto = computed(() => {
  const r = props.ejemplo.respuesta
  if (valor.value !== r.valor) return false
  if (r.valor === 'ns') return sospecha.value === r.sospecha
  return true
})

const btnBase = 'px-2.5 py-1 rounded text-[11px] font-bold transition-colors border'
</script>

<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
    <!-- Cabecera del ejemplo -->
    <div class="bg-slate-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-2">
      <span class="text-xs font-bold text-slate-700">{{ ejemplo.seccion }}</span>
      <span class="text-[11px] text-slate-400">Ejemplo interactivo</span>
    </div>

    <div class="grid md:grid-cols-2 gap-0">
      <!-- Documento simulado -->
      <div class="p-4 md:border-r border-gray-100">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Documento</div>
        <p class="font-mono text-[12.5px] leading-relaxed text-slate-700">
          {{ partes.antes }}<button
            type="button"
            class="rounded px-1 -mx-0.5 border-b-2 transition-colors"
            :class="seleccionado ? 'bg-green-200 border-green-500' : 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'"
            @click="seleccionado = partes.match"
          >{{ partes.match }}</button>{{ partes.despues }}
        </p>
        <p v-if="seleccionado" class="text-[11px] text-green-700 mt-2">
          Texto seleccionado — presiona "Capturar" en el formulario.
        </p>
        <p v-else class="text-[11px] text-slate-400 mt-2">Haz clic en el texto resaltado para seleccionarlo.</p>
      </div>

      <!-- Mini-formulario (mismo estilo que el real) -->
      <div class="p-4 bg-slate-50/50">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Formulario</div>

        <div class="border border-gray-200 rounded-lg bg-white p-2.5">
          <!-- Encabezado del criterio + botones -->
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs font-semibold text-gray-800 leading-tight">{{ ejemplo.campoLabel }}</p>
              <p v-if="ejemplo.icd10" class="text-[10px] text-gray-400 font-mono">{{ ejemplo.icd10 }}</p>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <button
                type="button" :class="[btnBase, valor === 'si' ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50']"
                @click="setValor('si')"
              >Sí</button>
              <button
                type="button" :class="[btnBase, valor === 'no' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50']"
                @click="setValor('no')"
              >No</button>
              <button
                type="button" :class="[btnBase, valor === 'ns' ? 'bg-gray-500 text-white border-gray-500 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100']"
                title="No se puede determinar a partir de la epicrisis"
                @click="setValor('ns')"
              >?</button>
            </div>
          </div>

          <!-- Bloque de evidencia / sospecha (Sí o ?) -->
          <div v-if="mostrarEvidencia" class="mt-2 border-t border-gray-50 pt-2 space-y-1.5">
            <!-- Incertidumbre (solo ?) -->
            <div v-if="valor === 'ns'" class="flex items-center justify-between gap-2">
              <span class="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Incertidumbre</span>
              <select v-model="sospecha" class="rounded border border-orange-200 px-2 py-0.5 text-[10px] text-orange-700 bg-orange-50 outline-none">
                <option value="">— Elegir nivel —</option>
                <option value="Alto">Alto</option>
                <option value="Bajo">Bajo</option>
                <option value="Indeterminado">Indeterminado</option>
              </select>
            </div>

            <!-- Evidencia -->
            <div class="flex items-center justify-between">
              <label class="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Evidencia (ground truth)</label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="text-[10px] font-semibold text-brand-600 hover:text-brand-700 disabled:text-gray-300"
                  :disabled="!seleccionado"
                  @click="capturar"
                >Capturar</button>
                <button v-if="evidencia" type="button" class="text-[10px] text-gray-400 hover:text-red-500" @click="evidencia = ''">limpiar</button>
              </div>
            </div>
            <div
              class="min-h-[28px] rounded border px-2 py-1.5 text-xs font-mono leading-relaxed"
              :class="evidencia ? 'bg-yellow-50 border-yellow-300 text-gray-800' : 'bg-gray-50 border-gray-200 text-gray-400 italic'"
            >{{ evidencia || 'Selecciona texto en el documento y presiona "Capturar"' }}</div>
          </div>
        </div>

        <!-- Revelar respuesta -->
        <button
          type="button"
          class="mt-3 w-full text-xs font-semibold text-brand-600 border border-brand-200 bg-brand-50 rounded-lg py-2 hover:bg-brand-100 transition-colors"
          @click="revelado = !revelado"
        >{{ revelado ? 'Ocultar respuesta' : 'Ver respuesta correcta' }}</button>

        <div v-if="revelado" class="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-[13px] text-slate-700" data-respuesta>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] font-bold uppercase tracking-wider text-green-700">Respuesta correcta</span>
            <GuiaValuePill :variant="ejemplo.respuesta.valor" />
            <span v-if="ejemplo.respuesta.sospecha" class="text-[11px] text-orange-700 font-semibold">Incertidumbre: {{ ejemplo.respuesta.sospecha }}</span>
            <span v-if="valor !== null" class="ml-auto text-[11px] font-semibold" :class="acierto ? 'text-green-700' : 'text-red-600'">
              {{ acierto ? 'coincide con tu respuesta' : 'difiere de tu respuesta' }}
            </span>
          </div>
          <p v-if="ejemplo.respuesta.evidencia" class="font-mono text-[11px] bg-white border border-green-200 rounded px-2 py-1 my-1 text-green-800">{{ ejemplo.respuesta.evidencia }}</p>
          <p>{{ ejemplo.explicacion }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
