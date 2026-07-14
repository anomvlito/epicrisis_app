<script setup lang="ts">
// HU-029: lista de fragmentos de evidencia (ground truth) de un criterio.
// - Candado abierto: casilla editable y "a la escucha" de la captura.
// - Candado cerrado: casilla confirmada, solo lectura, no recibe capturas.
// - [+] agrega casilla secundaria; [-] elimina secundarias (la principal no).
// - Solo una casilla activa en todo el formulario (store.activeCriterionName + índice).
import { computed } from 'vue'
import { useAnnotationStore } from '@/stores/annotation'
import type { EvidenceFragment } from '@/stores/annotation'

const props = defineProps<{ nodeKey: string; isReadOnly?: boolean }>()
const store = useAnnotationStore()

// Garantiza que siempre se vea al menos la casilla principal.
const fragments = computed<EvidenceFragment[]>(() => {
  const list = store.getEvidenceList(props.nodeKey)
  return list.length > 0 ? list : [{ text: '', locked: false }]
})

function isActiveBox(i: number) {
  return store.activeCriterionName === props.nodeKey && store.activeEvidenceIndex === i
}

function focusBox(i: number) {
  if (props.isReadOnly || fragments.value[i]?.locked) return
  store.setActiveEvidence(props.nodeKey, i)
}
function onInput(i: number, e: Event) {
  store.setEvidenceFragmentText(props.nodeKey, i, (e.target as HTMLTextAreaElement).value)
}
function toggleLock(i: number) {
  if (props.isReadOnly) return
  store.toggleEvidenceLock(props.nodeKey, i)
}
function add() {
  if (props.isReadOnly) return
  store.addEvidenceFragment(props.nodeKey)
}
function remove(i: number) {
  if (props.isReadOnly) return
  store.removeEvidenceFragment(props.nodeKey, i)
}
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between">
      <label class="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">
        Evidencia (ground truth)
      </label>
      <button
        v-if="!isReadOnly"
        type="button"
        class="flex items-center gap-0.5 text-[10px] font-semibold text-brand-600 hover:text-brand-700 transition-colors leading-none"
        title="Agregar otro fragmento de evidencia"
        @click.stop="add"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
        fragmento
      </button>
    </div>

    <div
      v-for="(frag, i) in fragments"
      :key="i"
      class="flex items-start gap-1.5"
    >
      <!-- Casilla de evidencia -->
      <div class="flex-1 min-w-0">
        <!-- Abierta: editable / a la escucha -->
        <textarea
          v-if="!frag.locked"
          :value="frag.text"
          :readonly="isReadOnly"
          rows="2"
          :placeholder="isActiveBox(i) ? 'Selecciona texto en el documento y presiona &quot;Capturar&quot; (o escribe aquí)' : 'Haz clic para activar y capturar aquí'"
          :class="[
            'w-full resize-none rounded border px-2 py-1.5 text-xs font-mono leading-relaxed outline-none transition-colors',
            isActiveBox(i)
              ? 'border-brand-400 bg-brand-50/60 text-gray-800 ring-1 ring-brand-200'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          ]"
          @focus="focusBox(i)"
          @click.stop="focusBox(i)"
          @input="onInput(i, $event)"
        />
        <!-- Cerrada: confirmada, solo lectura -->
        <div
          v-else
          class="w-full rounded border px-2 py-1.5 text-xs font-mono leading-relaxed bg-yellow-50 border-yellow-300 text-gray-800 whitespace-pre-wrap break-words"
        >{{ frag.text || '—' }}</div>
        <p v-if="isActiveBox(i) && !frag.locked" class="text-[9px] text-brand-500 mt-0.5 leading-none">Casilla activa — a la escucha de la captura</p>
      </div>

      <!-- Candado + eliminar -->
      <div class="flex flex-col items-center gap-1 pt-0.5">
        <button
          v-if="!isReadOnly"
          type="button"
          :class="[
            'p-1 rounded border transition-colors',
            frag.locked
              ? 'border-yellow-300 bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
              : 'border-gray-200 bg-white text-gray-400 hover:text-brand-600 hover:border-brand-300',
          ]"
          :title="frag.locked ? 'Casilla confirmada (clic para reabrir)' : 'Confirmar y bloquear casilla'"
          @click.stop="toggleLock(i)"
        >
          <!-- candado cerrado -->
          <svg v-if="frag.locked" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v3m-4-6V6a4 4 0 118 0v2m-9 0h10a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1V9a1 1 0 011-1z" /></svg>
          <!-- candado abierto -->
          <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v3m-5-6V6a4 4 0 017.874-1M6 8h10a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1V9a1 1 0 011-1z" /></svg>
        </button>

        <!-- [-] solo en secundarias -->
        <button
          v-if="!isReadOnly && i > 0"
          type="button"
          class="p-1 rounded border border-gray-200 bg-white text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
          title="Eliminar este fragmento"
          @click.stop="remove(i)"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" /></svg>
        </button>
      </div>
    </div>
  </div>
</template>
