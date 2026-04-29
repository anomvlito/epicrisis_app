<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <!-- Navbar -->
    <header class="flex-shrink-0 h-14 bg-brand-900 text-white flex items-center px-6 shadow-md z-10">
      <RouterLink
        to="/dashboard"
        class="text-sm font-semibold tracking-wide uppercase mr-auto"
      >
        Plataforma Anotación Epicrisis
      </RouterLink>

      <div class="flex items-center gap-4 text-sm">
        <RouterLink
          v-if="auth.isAdmin"
          to="/admin"
          class="text-xs font-medium px-3 py-1.5 rounded bg-yellow-400 text-yellow-900 hover:bg-yellow-300 transition-colors"
        >
          ⚙ Admin
        </RouterLink>
        <span class="text-brand-100 truncate max-w-xs">{{ auth.user?.email }}</span>
        <button
          class="px-3 py-1.5 rounded bg-brand-700 hover:bg-brand-600 transition-colors text-xs font-medium"
          @click="handleLogout"
        >
          Cerrar sesión
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 overflow-hidden">
      <slot />
    </main>
  </div>
</template>
