<script setup lang="ts">
// Panel demo (solo lectura, sin store) que ilustra el layout real de anotación:
// documento a la izquierda y formulario a la derecha, ambos scrolleables. El
// panel derecho lista las macrosecciones reales, derivadas de FORM_SCHEMA para
// mantenerse sincronizado con la app.
import { FORM_SCHEMA } from '@/constants/formSchema'

const macrosecciones = FORM_SCHEMA.map((bloque) => bloque.label)

const documentoDemo = `EPICRISIS UCI — Hospital Sótero del Río

IDENTIFICACIÓN: Paciente de 71 años, sexo masculino.

ANTECEDENTES: Hipertensión arterial en tratamiento con losartán.
Diabetes mellitus tipo 2. Enfermedad renal crónica etapa 3.
Ex tabáquico. Sin alergias conocidas.

INGRESO: Ingresa a UCI el 12/03 derivado desde urgencias por
neumonía adquirida en la comunidad con insuficiencia respiratoria.

EVOLUCIÓN: Requiere ventilación mecánica invasiva por 6 días y
drogas vasoactivas (noradrenalina). Cursa con injuria renal aguda
que requiere hemofiltración. Al 5º día desarrolla delirium
hiperactivo (CAM-ICU positivo).

INFECCIONES: Hemocultivos positivos para S. aureus; se maneja
como sepsis de foco respiratorio con antibioterapia dirigida.

EGRESO: Evoluciona favorablemente. Se traslada a sala médica el
26/03 en buenas condiciones generales.`
</script>

<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden bg-white my-4 not-prose">
    <div class="bg-slate-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-2">
      <span class="text-xs font-bold text-slate-700">Vista de anotación</span>
      <span class="text-[11px] text-slate-400">Ejemplo visual</span>
    </div>

    <div class="grid md:grid-cols-2 gap-0">
      <!-- Documento (scrolleable) -->
      <div class="p-4 md:border-r border-gray-100">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Documento</div>
        <div class="max-h-64 overflow-y-auto pr-1">
          <pre class="font-mono text-[11.5px] leading-relaxed text-slate-700 whitespace-pre-wrap">{{ documentoDemo }}</pre>
        </div>
      </div>

      <!-- Formulario: macrosecciones (scrolleable) -->
      <div class="p-4 bg-slate-50/50">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Formulario</div>
        <div class="max-h-64 overflow-y-auto pr-1 space-y-1.5">
          <div
            v-for="label in macrosecciones"
            :key="label"
            class="flex items-center gap-2 border border-gray-200 rounded-md bg-white px-3 py-2"
          >
            <!-- caret dibujado con CSS (sin glifos) -->
            <span
              class="inline-block w-0 h-0 flex-shrink-0 border-l-[5px] border-l-slate-400 border-y-[4px] border-y-transparent"
              aria-hidden="true"
            ></span>
            <span class="text-xs font-semibold text-gray-700 leading-tight">{{ label }}</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 mt-2">Cada macrosección se abre al marcarla para mostrar sus campos.</p>
      </div>
    </div>
  </div>
</template>
