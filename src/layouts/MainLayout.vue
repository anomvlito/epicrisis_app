<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden font-outfit text-gray-900">
    <!-- Sidebar (Desktop) -->
    <aside class="hidden md:flex w-72 bg-brand-900 text-white flex-col flex-shrink-0">
      <!-- Sidebar Header -->
      <div class="p-8">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold tracking-tight">Epicrisis AI</h1>
        </div>
        <p class="text-[10px] text-brand-400 font-bold uppercase tracking-[0.2em]">Research Platform</p>
      </div>

      <!-- Sidebar Navigation -->
      <nav class="flex-1 px-4 space-y-1.5">
        <RouterLink 
          to="/dashboard" 
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group"
          :class="route.name === 'dashboard' ? 'bg-white text-brand-900 shadow-xl shadow-black/10' : 'text-brand-200 hover:bg-white/5 hover:text-white'"
        >
          <svg class="w-5 h-5" :class="route.name === 'dashboard' ? 'text-brand-600' : 'text-brand-400 group-hover:text-brand-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </RouterLink>

        <RouterLink 
          v-if="auth.isAdmin"
          to="/admin" 
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group"
          :class="route.name === 'admin' ? 'bg-white text-brand-900 shadow-xl shadow-black/10' : 'text-brand-200 hover:bg-white/5 hover:text-white'"
        >
          <svg class="w-5 h-5" :class="route.name === 'admin' ? 'text-brand-600' : 'text-brand-400 group-hover:text-brand-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Administración
        </RouterLink>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-6 border-t border-white/10 bg-black/10">
        <div class="flex items-center gap-3 mb-6 px-2">
          <div class="w-10 h-10 rounded-xl bg-brand-800 border border-white/10 flex items-center justify-center font-bold text-brand-200">
            {{ auth.user?.email?.[0].toUpperCase() }}
          </div>
          <div class="flex-1 truncate">
            <p class="text-sm font-bold truncate">{{ auth.user?.email }}</p>
            <p class="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{{ auth.user?.role }}</p>
          </div>
        </div>
        
        <button 
          class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-brand-300 text-sm font-semibold transition-all duration-200 border border-white/5"
          @click="handleLogout"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Mobile Header (Visible only on mobile) -->
    <header class="md:hidden h-16 bg-brand-900 flex items-center px-6 text-white shrink-0">
      <h1 class="font-bold">Epicrisis AI</h1>
      <div class="flex-1"></div>
      <button @click="handleLogout" class="p-2 hover:bg-white/10 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Global Breadcrumbs / Action Bar if needed -->
      <div v-if="route.name === 'dashboard' || route.name === 'admin'" class="h-16 bg-white border-b border-gray-200 hidden md:flex items-center px-8 shrink-0">
        <h2 class="text-sm font-bold text-gray-500 uppercase tracking-widest">
          {{ route.name === 'dashboard' ? 'Resumen General' : 'Panel de Control de Datos' }}
        </h2>
      </div>

      <div class="flex-1 overflow-hidden">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');

.font-outfit {
  font-family: 'Outfit', sans-serif;
}
</style>
