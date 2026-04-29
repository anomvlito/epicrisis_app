<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEpicrisisStore } from '@/stores/epicrisis'
import { useAuthStore } from '@/stores/auth'
import EpicrisisCard from '@/components/EpicrisisCard.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

const epicrisisStore = useEpicrisisStore()
const auth = useAuthStore()

const activeTab = ref<'pending' | 'in_review' | 'reviewed'>('pending')

const tabs = [
  { key: 'pending' as const,   label: 'Por Revisar' },
  { key: 'in_review' as const, label: 'En Revisión' },
  { key: 'reviewed' as const,  label: 'Revisadas' },
]

onMounted(() => epicrisisStore.fetchList())
</script>

<template>
  <div class="h-full overflow-y-auto bg-slate-50 font-outfit">
    <div class="max-w-4xl mx-auto px-6 py-10">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">
          Bienvenido, <span class="text-brand-600 font-black">{{ auth.user?.email?.split('@')[0] }}</span>
        </h1>
        <p class="text-slate-500 mt-2 font-medium">Gestión de anotaciones de ground truth y validación clínica.</p>
      </div>

      <!-- Summary stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          :class="{ 'ring-2 ring-brand-500/20 bg-brand-50/10 border-brand-200': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <div class="flex items-center justify-between mb-2">
             <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="[
               tab.key === 'pending' ? 'bg-amber-100 text-amber-600' :
               tab.key === 'in_review' ? 'bg-blue-100 text-blue-600' :
               'bg-green-100 text-green-600'
             ]">
                <svg v-if="tab.key === 'pending'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <svg v-else-if="tab.key === 'in_review'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <span class="text-xs font-black px-2 py-1 bg-slate-100 rounded-lg text-slate-500">
               {{ tab.key === 'pending' ? epicrisisStore.pending.length : tab.key === 'in_review' ? epicrisisStore.inReview.length : epicrisisStore.reviewed.length }}
             </span>
          </div>
          <div class="text-sm font-bold text-slate-800">{{ tab.label }}</div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl mb-6 w-fit border border-slate-200">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200',
            activeTab === tab.key
              ? 'bg-white shadow-lg text-brand-600 ring-1 ring-black/5'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Content -->
      <BaseLoader v-if="epicrisisStore.loading" message="Sincronizando base de datos…" />

      <template v-else>
        <div v-if="activeTab === 'pending'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EpicrisisCard v-for="e in epicrisisStore.pending" :key="e.id" :epicrisis="e" />
          <div v-if="epicrisisStore.pending.length === 0" class="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div class="text-slate-400 text-sm font-medium">Bandeja de entrada vacía</div>
          </div>
        </div>

        <div v-if="activeTab === 'in_review'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EpicrisisCard v-for="e in epicrisisStore.inReview" :key="e.id" :epicrisis="e" />
          <div v-if="epicrisisStore.inReview.length === 0" class="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div class="text-slate-400 text-sm font-medium">No hay borradores guardados</div>
          </div>
        </div>

        <div v-if="activeTab === 'reviewed'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EpicrisisCard v-for="e in epicrisisStore.reviewed" :key="e.id" :epicrisis="e" />
          <div v-if="epicrisisStore.reviewed.length === 0" class="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div class="text-slate-400 text-sm font-medium">No has completado anotaciones aún</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
.font-outfit { font-family: 'Outfit', sans-serif; }
</style>
