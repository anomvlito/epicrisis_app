<script setup lang="ts">
// Render recursivo de la jerarquía del glosario (GLOSARIO_ESTRUCTURA), derivada
// del formSchema. Un nodo puede tener definición propia y/o hijos (p. ej. Diabetes
// mellitus con sus subtipos, o los focos de infección con sus subcampos). Se usa
// tanto en la pestaña Glosario (collapsible) como en el modal in-context.
import { ref, inject, watch, type Ref } from 'vue'
import type { GlosarioSection } from '@/constants/glosario.generated'

const props = withDefaults(
  defineProps<{
    nodes: GlosarioSection[]
    activeKey?: string | null
    depth?: number
    collapsible?: boolean
  }>(),
  { depth: 0, activeKey: null, collapsible: false }
)

// Estado de colapso por nodo (solo aplica cuando collapsible=true). Por defecto abierto.
const openState = ref<Record<string, boolean>>({})
const isOpen = (key: string) => openState.value[key] ?? true
function toggle(key: string) {
  openState.value = { ...openState.value, [key]: !isOpen(key) }
}
const showChildren = (key: string) => !props.collapsible || isOpen(key)

// Señal global de colapsar/expandir todo (la provee la pestaña Glosario).
const collapseSignal = inject<Ref<number>>('glosCollapseSignal', ref(0))
const allCollapsed = inject<Ref<boolean>>('glosAllCollapsed', ref(false))
watch(collapseSignal, () => {
  if (!props.collapsible) return
  const open = !allCollapsed.value
  const next: Record<string, boolean> = {}
  for (const node of props.nodes) {
    if (node.children && node.children.length) next[node.key] = open
  }
  openState.value = { ...openState.value, ...next }
})
</script>

<template>
  <template v-for="node in nodes" :key="node.key">
    <!-- Nodo con definición propia (hoja, o hoja con subcampos) -->
    <div
      v-if="node.definitionHtml"
      :data-glos-key="node.key"
      :class="[
        'p-3 border rounded-xl transition-all scroll-mt-4',
        node.key === activeKey
          ? 'border-brand-300 bg-brand-50/40 ring-1 ring-brand-300 shadow-xs'
          : 'border-slate-100 bg-slate-50/30'
      ]"
    >
      <div class="flex items-center gap-1.5 mb-1">
        <button
          v-if="collapsible && node.children && node.children.length"
          type="button"
          class="text-slate-400 hover:text-slate-600 flex-shrink-0"
          @click="toggle(node.key)"
        >
          <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-90': isOpen(node.key) }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </button>
        <h4 :class="['font-bold text-xs', node.key === activeKey ? 'text-brand-700' : 'text-slate-800']">{{ node.label }}</h4>
        <span
          v-if="node.key === activeKey"
          class="bg-brand-100 text-brand-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase select-none"
        >Actual</span>
      </div>
      <div class="glosario-html text-[11px] text-slate-600 leading-relaxed" v-html="node.definitionHtml" />

      <!-- Subcampos anidados -->
      <div
        v-if="node.children && node.children.length && showChildren(node.key)"
        class="mt-2.5 pl-3 border-l-2 border-slate-100 space-y-2"
      >
        <GlosarioTree :nodes="node.children" :active-key="activeKey" :depth="depth + 1" :collapsible="collapsible" />
      </div>
    </div>

    <!-- Categoría/sección sin definición propia: cabecera (colapsable) + recursión -->
    <template v-else-if="node.children && node.children.length">
      <component
        :is="collapsible ? 'button' : 'div'"
        type="button"
        :class="[
          'font-bold flex items-center gap-2 w-full text-left',
          collapsible ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
          depth === 0
            ? 'text-sm text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1.5 mt-4 first:mt-0'
            : depth === 1
              ? 'text-[11px] text-slate-500 uppercase tracking-widest mt-2'
              : 'text-[11px] font-semibold text-slate-400 mt-1'
        ]"
        @click="collapsible ? toggle(node.key) : undefined"
      >
        <svg
          v-if="collapsible"
          class="w-3 h-3 text-slate-400 transition-transform flex-shrink-0"
          :class="{ 'rotate-90': isOpen(node.key) }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        <span v-if="depth === 0 && !collapsible" class="w-1.5 h-3.5 bg-brand-500 rounded-xs flex-shrink-0"></span>
        {{ node.label }}
      </component>
      <div v-if="showChildren(node.key)" :class="depth >= 1 ? 'pl-3 border-l-2 border-slate-100 space-y-2' : 'space-y-2'">
        <GlosarioTree :nodes="node.children" :active-key="activeKey" :depth="depth + 1" :collapsible="collapsible" />
      </div>
    </template>
  </template>
</template>

<style scoped>
.glosario-html :deep(p) { margin-bottom: 0.5rem; }
.glosario-html :deep(p:last-child) { margin-bottom: 0; }
.glosario-html :deep(ul) { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.5rem; }
.glosario-html :deep(li) { margin-bottom: 0.25rem; }
.glosario-html :deep(strong) { font-weight: 600; color: #1e293b; }
.glosario-html :deep(em) { font-style: italic; }
.glosario-html :deep(hr) { border: none; border-top: 1px dashed #e2e8f0; margin: 0.75rem 0; }
</style>
