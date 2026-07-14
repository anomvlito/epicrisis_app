<script setup lang="ts">
import { ref, computed } from 'vue'
import { GLOSARIO_DEFINICIONES, GLOSARIO_ESTRUCTURA } from '@/constants/glosario.generated'

const searchQuery = ref('')

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const isSearching = computed(() => !!searchQuery.value.trim())

const searchResults = computed(() => {
  const q = normalize(searchQuery.value.trim())
  if (!q) return []
  return Object.values(GLOSARIO_DEFINICIONES).filter(e => 
    normalize(e.term).includes(q) || 
    normalize(e.definitionMarkdown).includes(q)
  )
})
</script>

<template>
  <div class="flex-1 min-h-0 overflow-y-auto">
    <div class="max-w-3xl mx-auto px-5 py-8 sm:px-8">
      
      <!-- Card Portada -->
      <div class="border-l-4 border-brand-500 bg-brand-50 rounded-r-lg px-6 py-5 mb-8">
        <h1 class="text-xl font-extrabold text-brand-700">Glosario de Anotación Clínica</h1>
        <p class="text-sm text-slate-600 mt-1">
          Definiciones oficiales, criterios de inclusión y notas de desambiguación para anotadores del Hospital Sótero del Río.
        </p>
        <div class="flex flex-wrap gap-2 mt-3">
          <span class="text-xs font-medium text-brand-600 bg-white border border-brand-100 rounded-full px-3 py-1">UCI</span>
          <span class="text-xs font-medium text-brand-600 bg-white border border-brand-100 rounded-full px-3 py-1">Criterios Oficiales</span>
        </div>
      </div>

      <!-- Buscador -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-8 flex flex-col sm:flex-row gap-3 items-center">
        <div class="relative flex-1 w-full">
          <svg class="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Buscar término o descripción en el glosario..."
            class="w-full pl-11 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-brand-400 bg-slate-50/50"
          />
        </div>
        <button 
          v-if="isSearching"
          class="text-xs text-slate-500 hover:text-slate-700 font-bold border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto"
          @click="searchQuery = ''"
        >
          Limpiar filtro
        </button>
      </div>

      <!-- Resultados de Búsqueda -->
      <div v-if="isSearching" class="space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Resultados de búsqueda ({{ searchResults.length }})
        </h2>
        
        <div 
          v-for="entry in searchResults" 
          :key="entry.key"
          class="p-5 border border-slate-200 rounded-xl bg-white shadow-xs"
        >
          <div class="flex items-center gap-2 mb-3">
            <h3 class="font-extrabold text-sm text-slate-800">{{ entry.term }}</h3>
            <span class="text-[9px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              {{ entry.key }}
            </span>
          </div>
          <div 
            class="glosario-html text-xs text-slate-600 leading-relaxed" 
            v-html="entry.definitionHtml"
          />
        </div>

        <div 
          v-if="searchResults.length === 0"
          class="text-center py-12 text-slate-400 text-sm border border-slate-100 rounded-xl bg-white"
        >
          No se encontraron términos para "{{ searchQuery }}".
        </div>
      </div>

      <!-- Vista Jerárquica Normal -->
      <div v-else class="space-y-8">
        <div 
          v-for="block in GLOSARIO_ESTRUCTURA" 
          :key="block.key"
          class="space-y-4"
        >
          <!-- Título de Categoría Madre (Bloque 2, 4, 7) -->
          <h2 class="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2 uppercase tracking-wide">
            <span class="w-1.5 h-3.5 bg-brand-500 rounded-xs"></span>
            {{ block.label }}
          </h2>

          <div class="space-y-3.5">
            <!-- Recursion handler inside the block -->
            <template v-for="child in block.children" :key="child.key">
              <!-- If child has children (e.g. subcategories like cardiovascular) -->
              <div v-if="child.children && child.children.length > 0" class="pl-3 border-l-2 border-slate-100 py-1 space-y-3.5">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">{{ child.label }}</h3>
                <div 
                  v-for="termNode in child.children" 
                  :key="termNode.key"
                  class="p-4 border border-slate-100 rounded-xl bg-white hover:border-slate-200 transition-colors shadow-xs"
                >
                  <h4 class="font-extrabold text-xs text-slate-800 mb-2">{{ termNode.label }}</h4>
                  <div 
                    class="glosario-html text-[11px] text-slate-600 leading-relaxed" 
                    v-html="termNode.definitionHtml"
                  />
                </div>
              </div>

              <!-- Direct term under the block -->
              <div 
                v-else
                class="p-4 border border-slate-150 rounded-xl bg-white hover:border-slate-200 transition-colors shadow-xs"
              >
                <h4 class="font-extrabold text-xs text-slate-800 mb-2">{{ child.label }}</h4>
                <div 
                  class="glosario-html text-[11px] text-slate-600 leading-relaxed" 
                  v-html="child.definitionHtml"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.glosario-html :deep(p) {
  margin-bottom: 0.5rem;
}
.glosario-html :deep(p:last-child) {
  margin-bottom: 0;
}
.glosario-html :deep(ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.glosario-html :deep(li) {
  margin-bottom: 0.25rem;
}
.glosario-html :deep(strong) {
  font-weight: 600;
  color: #1e293b;
}
.glosario-html :deep(em) {
  font-style: italic;
}
.glosario-html :deep(hr) {
  border: none;
  border-top: 1px dashed #e2e8f0;
  margin: 0.75rem 0;
}
</style>
