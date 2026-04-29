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
  { key: 'pending' as const,   label: 'Por Revisar',   icon: '📋' },
  { key: 'in_review' as const, label: 'En Revisión',   icon: '✏️' },
  { key: 'reviewed' as const,  label: 'Revisadas',     icon: '✅' },
]

onMounted(() => epicrisisStore.fetchList())
</script>

<template>
  <div class="h-full overflow-y-auto bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">
          Bienvenido/a, <span class="text-brand-600">{{ auth.user?.email?.split('@')[0] }}</span>
        </h1>
        <p class="text-sm text-gray-500 mt-1">Tus epicrisis asignadas para anotar.</p>
      </div>

      <!-- Summary stats -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="bg-white rounded-xl border border-gray-200 p-4 text-center"
        >
          <div class="text-2xl font-bold text-gray-900">
            {{
              tab.key === 'pending' ? epicrisisStore.pending.length
              : tab.key === 'in_review' ? epicrisisStore.inReview.length
              : epicrisisStore.reviewed.length
            }}
          </div>
          <div class="text-xs text-gray-500 mt-1">{{ tab.label }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === tab.key
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700',
          ]"
          @click="activeTab = tab.key"
        >
          <span>{{ tab.icon }}</span>
          {{ tab.label }}
          <span
            v-if="
              (tab.key === 'pending' && epicrisisStore.pending.length > 0) ||
              (tab.key === 'in_review' && epicrisisStore.inReview.length > 0)
            "
            class="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-brand-500 text-white"
          >
            {{
              tab.key === 'pending'
                ? epicrisisStore.pending.length
                : epicrisisStore.inReview.length
            }}
          </span>
        </button>
      </div>

      <!-- Content -->
      <BaseLoader v-if="epicrisisStore.loading" message="Cargando epicrisis…" />

      <template v-else>
        <div
          v-if="activeTab === 'pending'"
          class="space-y-3"
        >
          <EpicrisisCard
            v-for="e in epicrisisStore.pending"
            :key="e.id"
            :epicrisis="e"
          />
          <div v-if="epicrisisStore.pending.length === 0" class="text-center py-12 text-gray-400 text-sm">
            No tienes epicrisis pendientes por revisar.
          </div>
        </div>

        <div
          v-if="activeTab === 'in_review'"
          class="space-y-3"
        >
          <EpicrisisCard
            v-for="e in epicrisisStore.inReview"
            :key="e.id"
            :epicrisis="e"
          />
          <div v-if="epicrisisStore.inReview.length === 0" class="text-center py-12 text-gray-400 text-sm">
            No tienes anotaciones en progreso.
          </div>
        </div>

        <div
          v-if="activeTab === 'reviewed'"
          class="space-y-3"
        >
          <EpicrisisCard
            v-for="e in epicrisisStore.reviewed"
            :key="e.id"
            :epicrisis="e"
          />
          <div v-if="epicrisisStore.reviewed.length === 0" class="text-center py-12 text-gray-400 text-sm">
            Aún no has completado ninguna anotación.
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
