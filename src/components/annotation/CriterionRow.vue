<script setup lang="ts">
import { computed } from 'vue'
import { useAnnotationStore } from '@/stores/annotation'
import type { CriterionState } from '@/stores/annotation'
import type { Criterion } from '@/constants/criteria'
import DifficultyBadge from './DifficultyBadge.vue'
import { DIFFICULTY_LEVELS } from '@/types/difficulty'

const props = defineProps<{
  meta: Criterion
  state: CriterionState
  isActive: boolean
  isReadOnly?: boolean
}>()

const annotationStore = useAnnotationStore()

const llm = computed(() => props.state.llm)
const llmConflicto = computed(() => llm.value?.conflicto === true)
const llmValorLabel = computed(() => {
  if (llm.value?.valor === true) return 'Sí'
  if (llm.value?.valor === false) return 'No'
  return 'Nulo'
})
const llmValorColor = computed(() => {
  if (llm.value?.valor === true) return 'text-green-700 bg-green-50'
  if (llm.value?.valor === false) return 'text-red-700 bg-red-50'
  return 'text-gray-500 bg-gray-50'
})
const confianzaPct = computed(() => Math.round((llm.value?.confianza ?? 0) * 100))

// Show evidence box when there's captured text, a decision, or the row is active
const showEvidence = computed(() =>
  props.isActive || props.state.isPresent !== null || !!props.state.evidenceText
)

const rowClasses = computed(() => [
  'p-2 rounded-lg border transition-all cursor-pointer',
  llmConflicto.value && 'border-l-4 border-l-orange-400',
  props.isActive
    ? 'border-brand-400 bg-brand-50 shadow-sm'
    : 'border-gray-100 bg-white hover:border-gray-200',
])

function activate() {
  if (!props.isReadOnly) annotationStore.setActive(props.meta.name)
}

function setPresent(value: boolean | null | 'unknown') {
  if (!props.isReadOnly) annotationStore.setIsPresent(props.meta.name, value)
}

function onCommentsInput(e: Event) {
  annotationStore.setComments(props.meta.name, (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <div :class="rowClasses" @click="activate">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-gray-800 leading-tight truncate">
          {{ meta.label }}
        </p>
        <p v-if="meta.icd10Hint" class="text-[10px] text-gray-400 font-mono">{{ meta.icd10Hint }}</p>
      </div>

      <!-- Conflict badge -->
      <span
        v-if="llmConflicto"
        title="El LLM detectó evidencia contradictoria. Requiere revisión cuidadosa."
        class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 flex-shrink-0"
      >
        ⚠ Conflicto
      </span>

      <!-- Difficulty dot (inactive state — just shows current level) -->
      <span
        v-if="state.difficulty && !isActive"
        :class="['w-2 h-2 rounded-full flex-shrink-0 mt-0.5', DIFFICULTY_LEVELS.find(l => l.value === state.difficulty)?.dot]"
        :title="`Dificultad: ${DIFFICULTY_LEVELS.find(l => l.value === state.difficulty)?.label}`"
      />

      <!-- Ground truth toggle -->
      <div class="flex gap-1 flex-shrink-0" @click.stop>
        <button
          :class="[
            'px-2 py-0.5 rounded text-[11px] font-semibold transition-colors',
            state.isPresent === true
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-green-100',
          ]"
          :disabled="isReadOnly"
          @click="setPresent(state.isPresent === true ? null : true)"
        >Sí</button>
        <button
          :class="[
            'px-2 py-0.5 rounded text-[11px] font-semibold transition-colors',
            state.isPresent === false
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-red-100',
          ]"
          :disabled="isReadOnly"
          @click="setPresent(state.isPresent === false ? null : false)"
        >No</button>
        <button
          :class="[
            'px-2 py-0.5 rounded text-[11px] font-semibold transition-colors',
            state.isPresent === 'unknown' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200',
          ]"
          :disabled="isReadOnly"
          title="No se puede determinar a partir de la epicrisis"
          @click="setPresent(state.isPresent === 'unknown' ? null : 'unknown')"
        >?</button>
      </div>
    </div>

    <!-- LLM reference row -->
    <div v-if="llm" class="flex items-center gap-2 mt-1.5 px-2 py-1 rounded bg-gray-50 border border-gray-100">
      <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">LLM</span>
      <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded', llmValorColor]">
        {{ llmValorLabel }}
      </span>
      <span class="text-[10px] text-gray-400">
        {{ llm.metodo }} · {{ confianzaPct }}%
      </span>
      <span v-if="llm.evidencia && llm.evidencia !== 'No mencionado en el texto'" class="text-[10px] text-gray-500 truncate flex-1 italic">
        "{{ llm.evidencia.slice(0, 60) }}{{ llm.evidencia.length > 60 ? '…' : '' }}"
      </span>
      <span v-else class="text-[10px] text-gray-300 italic flex-1">No detectado</span>
    </div>

    <!-- Evidence field (shown when active, has decision, or has captured text) -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out overflow-hidden"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-40"
      leave-active-class="transition-all duration-100 ease-in overflow-hidden"
      leave-from-class="opacity-100 max-h-40"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="showEvidence" class="mt-1.5">
        <div class="flex items-center justify-between mb-1">
          <label class="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            Tu evidencia (ground truth)
          </label>
          <button
            v-if="state.evidenceText && !isReadOnly"
            class="text-[10px] text-gray-400 hover:text-red-500 transition-colors leading-none"
            title="Limpiar evidencia capturada"
            @click.stop="annotationStore.setEvidence(meta.name, '')"
          >✕ limpiar</button>
        </div>
        <div
          :class="[
            'min-h-[28px] rounded border px-2 py-1.5 text-xs font-mono leading-relaxed',
            state.evidenceText
              ? 'bg-yellow-50 border-yellow-300 text-gray-800'
              : 'bg-gray-50 border-gray-200 text-gray-400 italic',
          ]"
        >
          {{ state.evidenceText || 'Selecciona texto en el documento y presiona "Capturar"' }}
        </div>
      </div>
    </Transition>

    <!-- Difficulty (when active) -->
    <div v-if="isActive" class="mt-1.5 flex items-center justify-between">
      <span class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Dificultad</span>
      <DifficultyBadge
        :model-value="state.difficulty"
        :notes="state.difficultyNotes"
        :is-read-only="isReadOnly"
        @update:model-value="annotationStore.setDifficulty(meta.name, $event)"
        @update:notes="annotationStore.setDifficultyNotes(meta.name, $event)"
      />
    </div>

    <!-- Comments (only when active) -->
    <div v-if="isActive" class="mt-1.5">
      <label class="block text-[10px] font-medium text-gray-400 mb-1 uppercase tracking-wider">
        Comentarios <span class="normal-case font-normal">(opcional — casos borde, dudas)</span>
      </label>
      <textarea
        :value="state.comments"
        :readonly="isReadOnly"
        rows="2"
        placeholder="Ej: texto ambiguo, sigla no estándar, requiere revisión de experta…"
        class="w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-400 bg-white"
        @input="onCommentsInput"
        @click.stop
      />
    </div>
  </div>
</template>
