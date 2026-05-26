<script setup lang="ts">
import { DIFFICULTY_LEVELS } from '@/types/difficulty'
import type { DifficultyLevel } from '@/types/difficulty'

defineProps<{
  modelValue: DifficultyLevel
  notes: string
  isReadOnly?: boolean
}>()

defineEmits<{
  'update:modelValue': [v: DifficultyLevel]
  'update:notes': [v: string]
}>()
</script>

<template>
  <div class="group/diff relative inline-flex items-center gap-1.5" @click.stop>

    <!-- Tooltip oscuro — aparece en hover sobre el grupo completo -->
    <div class="absolute bottom-full right-0 mb-2 hidden group-hover/diff:block z-50 pointer-events-none">
      <div class="bg-gray-900 text-white text-[10px] rounded-lg px-3 py-2 shadow-xl space-y-1 w-52">
        <p class="font-semibold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
          Dificultad de extracción
        </p>
        <div v-for="l in DIFFICULTY_LEVELS" :key="l.value" class="flex items-center gap-1.5">
          <span :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', l.dot]" />
          <span><strong>{{ l.label }}</strong> — {{ l.description }}</span>
        </div>
      </div>
      <!-- Flecha del tooltip -->
      <div class="flex justify-end pr-2">
        <div class="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
      </div>
    </div>

    <!-- Semáforo: 3 puntos -->
    <button
      v-for="l in DIFFICULTY_LEVELS"
      :key="l.value"
      :disabled="isReadOnly"
      :title="l.label"
      :class="[
        'w-3 h-3 rounded-full transition-all duration-150 flex-shrink-0',
        modelValue === l.value
          ? [l.dot, 'ring-2', l.ring, 'scale-125']
          : [l.dot, 'opacity-25', !isReadOnly && 'hover:opacity-60 cursor-pointer', isReadOnly && 'cursor-default'],
      ]"
      @click.stop="$emit('update:modelValue', modelValue === l.value ? null : l.value)"
    />

    <!-- Buzón de notas -->
    <input
      v-if="!isReadOnly || notes"
      type="text"
      :value="notes"
      :readonly="isReadOnly"
      placeholder="¿Qué costó?"
      class="text-[10px] text-gray-500 placeholder-gray-300 bg-transparent border-b border-gray-200 focus:border-gray-400 focus:outline-none w-28 min-w-0 leading-none py-0.5"
      @input="$emit('update:notes', ($event.target as HTMLInputElement).value)"
      @click.stop
    />

  </div>
</template>
