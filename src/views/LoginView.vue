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
    router.push({ name: 'dashboard' })
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
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-outfit">
    <!-- Main Card Container -->
    <div class="w-full max-w-5xl flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl shadow-brand-100/50 overflow-hidden min-h-[600px]">
      
      <!-- Left side: Form -->
      <div class="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
        <div class="mb-10">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4 shadow-lg shadow-brand-200">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Bienvenido de nuevo</h1>
          <p class="text-gray-500 mt-2 font-medium">Ingresa tus credenciales para acceder a la plataforma.</p>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5" for="email">
              Correo Institucional
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="usuario@institucion.cl"
                class="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5" for="password">
              Contraseña
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
              />
            </div>
          </div>

          <div
            v-if="error"
            class="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700 animate-shake"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            {{ error }}
          </div>

          <BaseButton type="submit" class="w-full !rounded-xl !py-3 shadow-lg shadow-brand-200" :loading="auth.loading">
            Iniciar sesión
          </BaseButton>
        </form>

        <div class="mt-12 pt-8 border-t border-gray-100 flex flex-col gap-4">
          <p class="text-xs text-gray-400 leading-relaxed">
            Plataforma diseñada para la investigación académica y validación de modelos LLM en el ámbito clínico.
          </p>
          <div class="flex items-center gap-4 grayscale opacity-50">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by</span>
            <span class="text-xs font-bold text-gray-600">Epicrisis AI</span>
          </div>
        </div>
      </div>

      <!-- Right side: Info / Visual -->
      <div class="hidden md:block md:w-1/2 relative bg-brand-600 overflow-hidden">
        <!-- Abstract Background Pattern -->
        <div class="absolute inset-0 opacity-20 pointer-events-none">
          <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="url(#grad1)" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div class="relative h-full flex flex-col items-center justify-center text-white p-12 text-center">
          <div class="w-full max-w-sm space-y-8">
            <div class="space-y-4">
              <h2 class="text-4xl font-bold leading-tight">Anotación Médica de Siguiente Generación</h2>
              <p class="text-brand-100 text-lg opacity-90 font-light">
                Optimiza la detección de comorbilidades utilizando inteligencia artificial asistida por expertos.
              </p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div class="text-2xl font-bold">98%</div>
                <div class="text-[10px] uppercase tracking-wider font-semibold opacity-60">Precisión Asistida</div>
              </div>
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div class="text-2xl font-bold">15+</div>
                <div class="text-[10px] uppercase tracking-wider font-semibold opacity-60">Comorbilidades</div>
              </div>
            </div>

            <div class="pt-8">
              <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
                <span class="flex h-2 w-2 rounded-full bg-green-400"></span>
                Sistema de Monitoreo en Tiempo Real
              </div>
            </div>
          </div>
        </div>

        <!-- Decorative elements -->
        <div class="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -top-12 -left-12 w-48 h-48 bg-brand-400/20 rounded-full blur-2xl"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');

.font-outfit {
  font-family: 'Outfit', sans-serif;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out 0s 1;
}
</style>
