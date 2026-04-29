<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/services/api'
import BaseButton from '@/components/ui/BaseButton.vue'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')

async function handleSubmit() {
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    if (auth.isAdmin) {
      router.push({ name: 'admin' })
    } else {
      router.push({ name: 'dashboard' })
    }
  } catch (e) {
    if (e instanceof ApiError) {
      error.value = e.message
    } else {
      error.value = 'Error de conexión. Intenta nuevamente.'
    }
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Simple Brand Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-6 shadow-xl shadow-brand-200">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">EPICRISIS AI</h1>
        <p class="text-slate-500 mt-2 font-semibold uppercase tracking-widest text-[10px]">Research Platform</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-8 sm:p-10">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2" for="email">
              Correo Institucional
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="usuario@institucion.cl"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2" for="password">
              Contraseña
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
            />
          </div>

          <div
            v-if="error"
            class="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-700 font-bold"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            {{ error }}
          </div>

          <BaseButton type="submit" class="w-full !rounded-xl !py-4 font-black shadow-lg shadow-brand-100" :loading="auth.loading">
            ENTRAR AL PANEL
          </BaseButton>
        </form>
      </div>

      <p class="text-center text-xs text-slate-400 mt-10 font-medium">
        Plataforma restringida para fines de investigación clínica.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Simplified style */
</style>
