<script setup lang="ts">
import { ref } from 'vue'
import { COMORBIDITIES } from '@/constants/criteria'
import type { AdminMatrixRow } from '@/services/admin.service'

defineProps<{
  rows: AdminMatrixRow[]
  loading?: boolean
}>()

const hoverData = ref<{ text: string, label: string, x: number, y: number } | null>(null)

function handleMouseEnter(e: MouseEvent, text: string, label: string) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  hoverData.value = {
    text,
    label,
    x: rect.left + rect.width / 2,
    y: rect.top
  }
}

function handleMouseLeave() {
  hoverData.value = null
}

function maskedId(id: number) {
  return `EPC-${String(id).padStart(5, '0')}`
}
</script>

<template>
  <div class="w-full bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
    <!-- Table Container for scrolling -->
    <div class="flex-1 overflow-auto relative custom-scrollbar bg-gray-50/30">
      <table class="w-full text-[11px] border-separate border-spacing-0">
        <thead>
          <tr class="bg-gray-50">
            <!-- Patient ID Sticky Header -->
            <th class="sticky left-0 top-0 z-40 bg-gray-100 border-b border-r border-gray-200 px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-widest min-w-[140px]">
              ID Paciente
            </th>
            <!-- Comorbidities Headers -->
            <th 
              v-for="c in COMORBIDITIES" 
              :key="c.name"
              class="sticky top-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-2 py-4 text-center font-bold text-gray-400 uppercase tracking-tighter whitespace-nowrap min-w-[90px]"
            >
              <div class="rotate-[-12deg] transform origin-center py-2 px-1">
                {{ c.label.length > 14 ? c.label.substring(0, 12) + '..' : c.label }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white">
          <tr v-if="rows.length === 0">
            <td :colspan="COMORBIDITIES.length + 1" class="px-4 py-32 text-center bg-white">
              <div class="flex flex-col items-center justify-center text-gray-400">
                <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p class="text-base font-bold text-gray-900">Sin datos de hallazgos</p>
                <p class="text-sm opacity-60 mt-1 max-w-xs mx-auto">No se encontraron epicrisis con anotaciones registradas en el sistema.</p>
              </div>
            </td>
          </tr>

          <tr v-for="row in rows" :key="row.id" class="hover:bg-brand-50/30 group transition-colors">
            <!-- Sticky Patient ID Column -->
            <td class="sticky left-0 z-20 bg-white group-hover:bg-brand-50/50 border-r border-gray-200 px-6 py-3 font-mono font-bold text-gray-700 transition-colors">
              <div class="flex flex-col">
                <span class="text-brand-600">{{ maskedId(row.id) }}</span>
                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 truncate max-w-[100px]" :title="row.assigneeEmail || 'Sin asignar'">
                  {{ row.assigneeEmail?.split('@')[0] || 'Unassigned' }}
                </span>
              </div>
            </td>

            <!-- Cells -->
            <td 
              v-for="c in COMORBIDITIES" 
              :key="c.name"
              class="border-r border-gray-100 p-0 relative"
            >
              <div 
                v-if="row.annotations[c.name]"
                class="w-full h-12 flex items-center justify-center transition-all cursor-help relative group/cell"
                :class="[
                  row.annotations[c.name].isPresent === true ? 'bg-green-50 text-green-700 font-bold' : 
                  row.annotations[c.name].isPresent === false ? 'bg-red-50 text-red-700 font-bold' : 
                  'bg-gray-50 text-gray-400'
                ]"
                @mouseenter="handleMouseEnter($event, row.annotations[c.name].evidenceText || '', c.label)"
                @mouseleave="handleMouseLeave"
              >
                <!-- Professional Status Indicators -->
                <svg v-if="row.annotations[c.name].isPresent === true" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="row.annotations[c.name].isPresent === false" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span v-else class="text-[10px] font-bold opacity-30">NR</span>

                <!-- Indicator for evidence presence -->
                <div v-if="row.annotations[c.name].evidenceText" class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-current opacity-40"></div>
              </div>
              
              <!-- Empty state (no annotation record) -->
              <div v-else class="w-full h-12 bg-gray-50/30 flex items-center justify-center text-gray-200">
                <span class="text-[10px] font-black opacity-20">—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer / Legend -->
    <div class="bg-white border-t border-gray-200 px-8 py-4 flex items-center gap-8 text-[10px] uppercase font-bold tracking-widest text-gray-400">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 bg-green-100 border border-green-200 rounded flex items-center justify-center text-green-600">
           <svg class="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" /></svg>
        </span>
        <span>Presente</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 bg-red-100 border border-red-200 rounded flex items-center justify-center text-red-600">
           <svg class="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M6 18L18 6M6 6l12 12" /></svg>
        </span>
        <span>Ausente</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 bg-gray-100 border border-gray-200 rounded text-center leading-none text-gray-400 pt-0.5">NR</span>
        <span>No evaluado</span>
      </div>
      <div class="ml-auto text-brand-500 font-black">
        Pase el cursor sobre los hallazgos para inspeccionar la evidencia clínica.
      </div>
    </div>

    <!-- Tooltip Portalled to Body to avoid clipping -->
    <Teleport to="body">
      <div 
        v-if="hoverData && hoverData.text"
        :style="{ left: hoverData.x + 'px', top: hoverData.y + 'px' }"
        class="fixed -translate-x-1/2 -translate-y-full mb-3 z-[9999] w-72 p-4 bg-gray-900 text-white rounded-2xl shadow-2xl pointer-events-none transition-all duration-200"
      >
        <div class="relative">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 mb-2 border-b border-white/10 pb-2">Evidencia: {{ hoverData.label }}</p>
          <p class="text-xs leading-relaxed font-medium italic text-gray-200">"{{ hoverData.text }}"</p>
          <!-- Triangle Arrow -->
          <div class="absolute top-[calc(100%+16px)] left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* Fix sticky transparency and borders */
td.sticky, th.sticky {
  box-shadow: 1px 0 0 0 #e5e7eb;
}
</style>
