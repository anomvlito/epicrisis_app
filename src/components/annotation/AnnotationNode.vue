<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue'
import type { Ref } from 'vue'
import { useAnnotationStore } from '@/stores/annotation'
import type { FormNode } from '@/constants/formSchema'
import { normalizeFecha } from '@/utils/fecha'
import { useToast } from '@/composables/useToast'
import AnnotationEvidence from './AnnotationEvidence.vue'

const props = defineProps<{
  node: FormNode
  isReadOnly?: boolean
  depth: number
}>()

const annotationStore = useAnnotationStore()
const toast = useToast()

const state = computed(() => {
  return annotationStore.criteria.find(c => c.criterionName === props.node.key) || {
    criterionName: props.node.key,
    isPresent: null,
    evidenceText: '',
    comments: '',
    difficulty: null,
    difficultyNotes: '',
    llm: null
  }
})

// Expanded state for accordion blocks / mothers
const isExpanded = ref(props.depth === 0) // Expand top level blocks by default
const savedExpandedState = ref(props.depth === 0)

// HU-033: Inject collapse signal from AnnotationTree
const collapseSignal = inject<Ref<number>>('collapseSignal', ref(0))
const isAllCollapsed = inject<Ref<boolean>>('isAllCollapsed', ref(false))

watch(collapseSignal, () => {
  if (props.node.type === 'mother') {
    if (isAllCollapsed.value) {
      // Collapsing: save current state and collapse
      savedExpandedState.value = isExpanded.value
      isExpanded.value = false
    } else {
      // Restoring: bring back saved state
      isExpanded.value = savedExpandedState.value
    }
  }
})

// Check if node is currently active (focused) for capturing text
const isActive = computed(() => {
  if (props.node.type === 'leaf') {
    return annotationStore.activeCriterionName === props.node.key
  }
  if (props.node.type === 'date') {
    return annotationStore.activeMetadataField === props.node.key
  }
  return false
})

const showEvidence = computed(() => {
  // HU-043: un "No" no necesita respaldo — no se pide evidencia ni se muestra la caja
  if (state.value.isPresent === false) return false
  return isActive.value || state.value.isPresent !== null || !!state.value.evidenceText
})

// Mother visibility check for children:
// A mother node displays its children only if its state is NOT 'No' and NOT null (unanswered)
const isMotherActive = computed(() => {
  return state.value.isPresent === true || state.value.isPresent === 'unknown'
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function activate() {
  if (props.isReadOnly) return
  if (props.node.type === 'leaf') {
    annotationStore.setActive(props.node.key)
  } else if (props.node.type === 'date' || props.node.type === 'text') {
    annotationStore.setActiveMetadata(props.node.key)
  }
}

function setPresent(value: boolean | null | 'unknown') {
  if (props.isReadOnly) return
  
  // Apply mutually exclusive rules if defined
  if (value === true || value === 'unknown') {
    if (props.node.mutuallyExclusiveWith) {
      for (const siblingKey of props.node.mutuallyExclusiveWith) {
        annotationStore.setIsPresent(siblingKey, null)
      }
    }
    activate()
  }

  annotationStore.setIsPresent(props.node.key, value)

  // HU-044: el rebote. Si marcamos No y el invariante devolvió la sección a Sí,
  // es porque quedó un Sí/? bloqueado río abajo. Se explica para que no se lea
  // como un bug — el estado No intermedio nunca llegó a renderizarse.
  if (value === false && isParent.value && state.value.isPresent === true) {
    const n = annotationStore.countSiOrUnknownBelow(props.node.key)
    toast.show(
      `Esta sección quedó en Sí: hay ${n} ${n === 1 ? 'variable marcada' : 'variables marcadas'} más abajo. Se marcó No el resto.`,
      'info'
    )
  }
}

// ── HU-044: candado manual y reset ───────────────────────────────────────────

const isParent = computed(() => (props.node.children?.length ?? 0) > 0)
const isLocked = computed(() => annotationStore.isLocked(props.node.key))
const showNodeControls = computed(() => !props.isReadOnly && isParent.value)

// Auto-candado: derivado del estado, solo informativo. Explica al anotador por qué
// la cascada no tocó esta variable.
const isAutoLocked = computed(
  () => state.value.isPresent === true || state.value.isPresent === 'unknown'
)

function onToggleLock() {
  if (props.isReadOnly) return
  const nowLocked = annotationStore.toggleLock(props.node.key)
  toast.show(
    nowLocked
      ? 'Sección bloqueada: no la tocarán las reglas automáticas'
      : 'Sección desbloqueada',
    'info'
  )
}

function onReset() {
  if (props.isReadOnly) return
  const cleared = annotationStore.resetDescendants(props.node.key)
  toast.show(
    cleared > 0
      ? `${cleared} ${cleared === 1 ? 'variable devuelta' : 'variables devueltas'} a en blanco`
      : 'No había nada que reiniciar en esta sección',
    'info'
  )
}

function onCommentsInput(e: Event) {
  annotationStore.setComments(props.node.key, (e.target as HTMLTextAreaElement).value)
}

function onDateInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  annotationStore.setEvidence(props.node.key, val)
}

function onDateBlur(e: FocusEvent) {
  const val = (e.target as HTMLInputElement).value
  const norm = normalizeFecha(val)
  annotationStore.setEvidence(props.node.key, norm)
}

function onSelectChange(e: Event) {
  const val = (e.target as HTMLInputElement | HTMLSelectElement).value
  // Save selected choice inside evidenceMetadata (preservando evidences/HU-029)
  const currentMeta = (state.value as any).evidenceMetadata || {}
  const newState = annotationStore.criteria.find(c => c.criterionName === props.node.key)
  if (newState) {
    newState.evidenceMetadata = { ...currentMeta, value: val }
  }
}

function onMetadataDateBlur(e: FocusEvent) {
  const val = (e.target as HTMLInputElement).value
  const norm = normalizeFecha(val)
  const currentMeta = (state.value as any).evidenceMetadata || {}
  const newState = annotationStore.criteria.find(c => c.criterionName === props.node.key)
  if (newState) {
    newState.evidenceMetadata = { ...currentMeta, value: norm }
  }
}

function onSuspicionChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  const currentMeta = (state.value as any).evidenceMetadata || {}
  const newState = annotationStore.criteria.find(c => c.criterionName === props.node.key)
  if (newState) {
    newState.evidenceMetadata = { ...currentMeta, suspicion: val }
  }
}

// Check if this node is visible based on parent's toggle
const isVisible = computed(() => {
  return true
})

</script>

<template>
  <div v-show="isVisible" class="space-y-1.5 transition-all">
    <!-- ── TYPE: MOTHER ── -->
    <div v-if="node.type === 'mother'" class="border border-gray-100 rounded-lg bg-gray-50/50 overflow-hidden shadow-xs">
      <div 
        class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100/70 transition-colors"
        @click="toggleExpand"
      >
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <!-- Expand icon -->
          <svg 
            class="w-4 h-4 text-gray-400 transform transition-transform duration-200 flex-shrink-0"
            :class="{ 'rotate-90': isExpanded }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-xs font-bold text-gray-700 select-none truncate">
            {{ node.label }}
          </span>
        </div>

        <!-- Header controls -->
        <div class="flex items-center gap-1 flex-shrink-0" @click.stop>
          <!-- Mother toggle [Sí] [No] — HU-042: hidden on blocks whose content isn't a Sí/No question -->
          <div v-if="!node.hideToggle" class="flex gap-1">
            <button
              :class="[
                'px-2 py-0.5 rounded text-[10px] font-bold transition-colors border',
                state.isPresent === true
                  ? 'bg-green-500 text-white border-green-500 shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50',
              ]"
              :disabled="isReadOnly"
              @click="setPresent(state.isPresent === true ? null : true)"
            >Sí</button>
            <button
              :class="[
                'px-2 py-0.5 rounded text-[10px] font-bold transition-colors border',
                state.isPresent === false
                  ? 'bg-red-500 text-white border-red-500 shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50',
              ]"
              :disabled="isReadOnly"
              @click="setPresent(state.isPresent === false ? null : false)"
            >No</button>
          </div>

          <!-- HU-044: reset (giro) y candado manual, solo en nodos con hijos -->
          <template v-if="showNodeControls">
            <button
              type="button"
              data-testid="reset-button"
              title="Dejar en blanco todo lo de esta sección"
              class="p-1 rounded border border-gray-200 bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              @click="onReset"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button
              type="button"
              data-testid="lock-button"
              :title="isLocked
                ? 'Sección bloqueada: las reglas automáticas no la tocan. Click para desbloquear'
                : 'Bloquear esta sección frente a las reglas automáticas'"
              :class="[
                'p-1 rounded border transition-colors',
                isLocked
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-gray-400 border-gray-200 hover:bg-amber-50 hover:text-amber-600',
              ]"
              @click="onToggleLock"
            >
              <svg v-if="isLocked" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
            </button>
          </template>
        </div>
      </div>

      <!-- Mother Children -->
      <div
        v-show="isExpanded"
        data-testid="mother-children"
        class="p-2.5 bg-white border-t border-gray-50 space-y-2"
        :style="{ paddingLeft: `${(depth + 1) * 6 + 10}px` }"
      >
        <AnnotationNode
          v-for="child in node.children"
          :key="child.key"
          :node="child"
          :is-read-only="isReadOnly"
          :depth="depth + 1"
        />
      </div>
    </div>

    <!-- ── TYPE: LEAF ── -->
    <div 
      v-else-if="node.type === 'leaf'" 
      :data-criterion="node.key"
      data-capture-zone
      :class="[
        'p-2 rounded-lg border transition-all cursor-pointer',
        isActive ? 'border-brand-400 bg-brand-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
      ]"
      @click="activate"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2">
            <p class="text-xs font-semibold text-gray-800 leading-tight">
              {{ node.label }}
            </p>
            <button
              type="button"
              class="text-brand-500 hover:text-brand-700 cursor-pointer select-none inline-flex items-center align-middle"
              title="Glosario"
              @click.stop="annotationStore.openGlossary(node.key)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </button>
            <!-- HU-044: auto-candado. Solo informativo: explica por qué la cascada no la tocó -->
            <span
              v-if="isAutoLocked"
              data-testid="auto-lock-badge"
              class="text-amber-500 inline-flex items-center align-middle flex-shrink-0"
              title="Protegida de la cascada automática por estar en Sí o ?. Se libera al cambiarla."
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </span>
          </div>
          <p v-if="node.icd10Hint" class="text-[9px] text-gray-400 font-mono mt-0.5">{{ node.icd10Hint }}</p>
        </div>

        <!-- 3-State Toggle [Sí] [No] [?] -->
        <div class="flex gap-1 flex-shrink-0" @click.stop>
          <button
            :class="[
              'px-2 py-0.5 rounded text-[10px] font-bold transition-colors border',
              state.isPresent === true
                ? 'bg-green-500 text-white border-green-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50',
            ]"
            :disabled="isReadOnly"
            @click="setPresent(state.isPresent === true ? null : true)"
          >Sí</button>
          <button
            :class="[
              'px-2 py-0.5 rounded text-[10px] font-bold transition-colors border',
              state.isPresent === false
                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50',
            ]"
            :disabled="isReadOnly"
            @click="setPresent(state.isPresent === false ? null : false)"
          >No</button>
          <button
            :class="[
              'px-2 py-0.5 rounded text-[10px] font-bold transition-colors border',
              state.isPresent === 'unknown'
                ? 'bg-gray-500 text-white border-gray-500 shadow-sm'
                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100',
            ]"
            :disabled="isReadOnly"
            title="No se puede determinar a partir de la epicrisis"
            @click="setPresent(state.isPresent === 'unknown' ? null : 'unknown')"
          >?</button>
        </div>
      </div>

      <!-- Evidence block (if Sí or ? is selected) -->
      <Transition
        enter-active-class="transition-all duration-150 ease-out overflow-hidden"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-40"
        leave-active-class="transition-all duration-100 ease-in overflow-hidden"
        leave-from-class="opacity-100 max-h-40"
        leave-to-class="opacity-0 max-h-0"
      >
        <div v-show="showEvidence" data-testid="evidence-box" class="mt-2 border-t border-gray-50 pt-2 space-y-1.5" @click.stop>
          
          <!-- Suspicion Dropdown (only for '?') -->
          <div v-if="state.isPresent === 'unknown'" class="flex items-center justify-between gap-2">
            <span class="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Incertidumbre</span>
            <select 
              :value="(state as any).evidenceMetadata?.suspicion || ''"
              :disabled="isReadOnly"
              class="rounded border border-orange-200 px-2 py-0.5 text-[10px] text-orange-700 bg-orange-50/50 outline-none"
              @change="onSuspicionChange"
            >
              <option value="">— Elegir nivel —</option>
              <option value="Alto">Alto</option>
              <option value="Bajo">Bajo</option>
              <option value="Indeterminado">Indeterminado</option>
            </select>
          </div>

          <!-- Date value block if leaf is a date check -->
          <div v-if="state.isPresent === true && (node.key.includes('fecha') || node.key.includes('inicio') || node.key.includes('termino') || node.key.includes('realizacion'))" class="flex items-center justify-between gap-2">
            <span class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Valor Fecha</span>
            <input 
              type="text" 
              placeholder="DD/MM/AAAA"
              :value="(state as any).evidenceMetadata?.value || ''"
              :disabled="isReadOnly"
              class="w-32 rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-700 outline-none focus:border-brand-400 bg-white"
              @input="onSelectChange"
              @blur="onMetadataDateBlur"
            />
          </div>

          <!-- Evidencia (ground truth) — múltiples fragmentos (HU-029) -->
          <AnnotationEvidence :node-key="node.key" :is-read-only="isReadOnly" />

          <!-- Comments (when row is active) -->
          <div v-show="isActive" class="space-y-1.5 pt-1.5 border-t border-gray-100">
            
            <!-- Comment text -->
            <div>
              <label class="block text-[9px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">
                Comentario {{ state.isPresent === 'unknown' ? '(obligatorio)' : '(opcional)' }}
              </label>
              <textarea
                :value="state.comments"
                :readonly="isReadOnly"
                rows="2"
                placeholder="Indica observaciones sobre la extracción o el estado de duda..."
                class="w-full resize-none rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-brand-400 bg-white"
                @input="onCommentsInput"
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Children of leaves (e.g. subfields under VMI, or habits subfields like carga tabáquica) -->
      <div 
        v-if="node.children && isMotherActive" 
        class="mt-2.5 pl-3 border-l-2 border-brand-200 space-y-2"
        @click.stop
      >
        <AnnotationNode
          v-for="child in node.children"
          :key="child.key"
          :node="child"
          :is-read-only="isReadOnly"
          :depth="depth + 1"
        />
      </div>
    </div>

    <!-- ── TYPE: SELECT (e.g. calidad) ── -->
    <div 
      v-else-if="node.type === 'select'" 
      class="p-2 border border-gray-100 rounded-lg bg-white space-y-2 shadow-xs"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-baseline gap-2">
          <span class="text-xs font-bold text-gray-700">{{ node.label }}</span>
          <button
            type="button"
            class="text-brand-500 hover:text-brand-700 cursor-pointer select-none inline-flex items-center align-middle"
            title="Glosario"
            @click.stop="annotationStore.openGlossary(node.key)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </button>
        </div>
        <select 
          :value="(state as any).evidenceMetadata?.value || ''"
          :disabled="isReadOnly"
          class="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-700 bg-white outline-none focus:border-brand-400"
          @change="onSelectChange"
        >
          <option value="">— Seleccionar —</option>
          <option v-for="opt in node.choices" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>
    </div>

    <!-- ── TYPE: TEXT (e.g. calidad.comentario) ── -->
    <div 
      v-else-if="node.type === 'text'" 
      data-capture-zone
      class="p-2 border border-gray-100 rounded-lg bg-white space-y-1.5 shadow-xs"
    >
      <div class="flex items-baseline gap-2">
        <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ node.label }}</label>
        <button
          type="button"
          class="text-brand-500 hover:text-brand-700 cursor-pointer select-none inline-flex items-center align-middle"
          title="Glosario"
          @click.stop="annotationStore.openGlossary(node.key)"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </button>
      </div>
      <textarea
        :value="state.evidenceText"
        :readonly="isReadOnly"
        rows="3"
        placeholder="Escribe comentarios u observaciones finales aquí..."
        class="w-full resize-none rounded border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-brand-400 bg-white disabled:bg-gray-50"
        @input="annotationStore.setEvidence(node.key, ($event.target as HTMLTextAreaElement).value)"
        @focus="activate"
      />
    </div>

    <!-- ── TYPE: DATE (Simple Dates) ── -->
    <div 
      v-else-if="node.type === 'date'" 
      data-capture-zone
      class="p-2 border border-gray-100 rounded-lg bg-white space-y-1.5 shadow-xs"
      :class="{ 'border-brand-400 bg-brand-50 shadow-sm': isActive }"
      @click="activate"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-baseline gap-2">
          <span class="text-xs font-bold text-gray-700">{{ node.label }}</span>
          <button
            type="button"
            class="text-brand-500 hover:text-brand-700 cursor-pointer select-none inline-flex items-center align-middle"
            title="Glosario"
            @click.stop="annotationStore.openGlossary(node.key)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </button>
        </div>
        <input 
          type="text" 
          placeholder="DD/MM/AAAA"
          :value="state.evidenceText"
          :disabled="isReadOnly"
          class="w-32 rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-700 outline-none focus:border-brand-400 bg-white disabled:bg-gray-50"
          @input="onDateInput"
          @blur="onDateBlur"
          @click.stop
        />
      </div>
    </div>
  </div>
</template>
