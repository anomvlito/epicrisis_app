<script setup lang="ts">
// Ejemplo gráfico (solo lectura, sin store) del flujo de CAPTURAR EVIDENCIA con
// múltiples fragmentos (HU-029): seleccionar un fragmento del documento y
// capturarlo en la casilla activa y abierta; candado (abierto = a la escucha /
// cerrado = confirmado), botón + para agregar casillas y − para quitar las
// secundarias. Réplica autocontenida del comportamiento real de AnnotationEvidence.
import { ref, computed } from 'vue'

interface Frag { text: string; locked: boolean }

const DOC_ANTES = 'ANTECEDENTES: Paciente con '
const DOC_MATCH = 'hipertensión arterial en tratamiento con losartán'
const DOC_MEDIO = '. Diagnóstico de '
const DOC_MATCH2 = 'diabetes mellitus tipo 2'
const DOC_DESPUES = '.'

const fragments = ref<Frag[]>([{ text: '', locked: false }])
const activeIdx = ref(0)
const selected = ref('')

function selectFragment(t: string) { selected.value = t }
function focusBox(i: number) { if (!fragments.value[i].locked) activeIdx.value = i }
function capturar() {
  const box = fragments.value[activeIdx.value]
  if (selected.value && box && !box.locked) {
    box.text = selected.value
    selected.value = ''
  }
}
function toggleLock(i: number) { fragments.value[i].locked = !fragments.value[i].locked }
function clear(i: number) { if (!fragments.value[i].locked) fragments.value[i].text = '' }
function add() { fragments.value.push({ text: '', locked: false }); activeIdx.value = fragments.value.length - 1 }
function remove(i: number) {
  if (i <= 0) return
  fragments.value.splice(i, 1)
  if (activeIdx.value >= fragments.value.length) activeIdx.value = fragments.value.length - 1
}
const puedeCapturar = computed(() => !!selected.value && !fragments.value[activeIdx.value]?.locked)
</script>

<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden bg-white my-4 not-prose">
    <div class="bg-slate-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-2">
      <span class="text-xs font-bold text-slate-700">Capturar evidencia</span>
      <span class="text-[11px] text-slate-400">Ejemplo visual</span>
    </div>

    <div class="grid md:grid-cols-2 gap-0">
      <!-- Documento con fragmentos seleccionables -->
      <div class="p-4 md:border-r border-gray-100">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Documento</div>
        <p class="font-mono text-[12.5px] leading-relaxed text-slate-700">
          {{ DOC_ANTES }}<button
            type="button" class="rounded px-1 -mx-0.5 border-b-2"
            :class="selected === DOC_MATCH ? 'bg-green-200 border-green-500' : 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'"
            @click="selectFragment(DOC_MATCH)"
          >{{ DOC_MATCH }}</button>{{ DOC_MEDIO }}<button
            type="button" class="rounded px-1 -mx-0.5 border-b-2"
            :class="selected === DOC_MATCH2 ? 'bg-green-200 border-green-500' : 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'"
            @click="selectFragment(DOC_MATCH2)"
          >{{ DOC_MATCH2 }}</button>{{ DOC_DESPUES }}
        </p>
        <p v-if="selected" class="text-[11px] text-green-700 mt-2">Texto seleccionado — presiona "Capturar".</p>
        <p v-else class="text-[11px] text-slate-400 mt-2">Haz clic en un fragmento resaltado para seleccionarlo.</p>
        <button
          type="button"
          class="mt-2 text-[11px] font-semibold rounded border px-2.5 py-1 transition-colors"
          :class="puedeCapturar ? 'border-brand-300 text-brand-600 hover:bg-brand-50' : 'border-gray-200 text-gray-300'"
          :disabled="!puedeCapturar"
          @click="capturar"
        >Capturar</button>
      </div>

      <!-- Casillas de evidencia -->
      <div class="p-4 bg-slate-50/50">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Evidencia (ground truth)</span>
          <button
            type="button"
            class="p-0.5 rounded border border-brand-200 text-brand-600 hover:bg-brand-50 transition-colors leading-none"
            title="Agregar otro fragmento"
            @click="add"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        <div v-for="(frag, i) in fragments" :key="i" class="flex items-start gap-1.5 mb-1.5">
          <div class="flex-1 min-w-0">
            <div
              v-if="!frag.locked"
              class="w-full rounded border px-2 py-1.5 text-xs font-mono leading-relaxed min-h-[30px] cursor-text transition-colors"
              :class="activeIdx === i ? 'border-brand-400 bg-brand-50/60 ring-1 ring-brand-200 text-gray-800' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'"
              @click="focusBox(i)"
            >
              <span v-if="frag.text">{{ frag.text }}</span>
              <span v-else class="text-gray-400 italic">{{ activeIdx === i ? 'Casilla activa — selecciona texto y captura aquí' : 'Haz clic para activar' }}</span>
            </div>
            <div v-else class="w-full rounded border px-2 py-1.5 text-xs font-mono leading-relaxed bg-yellow-50 border-yellow-300 text-gray-800 whitespace-pre-wrap break-words">{{ frag.text || '—' }}</div>
          </div>

          <div class="flex flex-col items-center gap-1 pt-0.5">
            <button
              type="button"
              :class="['p-1 rounded border transition-colors', frag.locked ? 'border-yellow-300 bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'border-gray-200 bg-white text-gray-400 hover:text-brand-600 hover:border-brand-300']"
              :title="frag.locked ? 'Casilla confirmada (clic para reabrir)' : 'Confirmar y bloquear casilla'"
              @click="toggleLock(i)"
            >
              <svg v-if="frag.locked" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v3m-4-6V6a4 4 0 118 0v2m-9 0h10a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1V9a1 1 0 011-1z" /></svg>
              <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v3m-5-6V6a4 4 0 017.874-1M6 8h10a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1V9a1 1 0 011-1z" /></svg>
            </button>
            <button
              v-if="!frag.locked && frag.text"
              type="button"
              class="p-1 rounded border border-gray-200 bg-white text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
              title="Limpiar esta casilla"
              @click="clear(i)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button
              v-if="i > 0"
              type="button"
              class="p-1 rounded border border-gray-200 bg-white text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
              title="Eliminar este fragmento"
              @click="remove(i)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" /></svg>
            </button>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 mt-2">Solo la casilla activa y abierta recibe la captura; el candado la confirma.</p>
      </div>
    </div>
  </div>
</template>
