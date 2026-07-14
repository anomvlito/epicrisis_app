<script setup lang="ts">
// Panel demo (solo lectura, sin store) que ilustra la pantalla real de anotación:
// documento a la izquierda y formulario a la derecha, ambos scrolleables, con
// barra de búsqueda y los campos anidados. La búsqueda filtra las hojas por su
// nombre reutilizando normalizeSearch (igual que la app real).
import { ref, computed } from 'vue'
import { normalizeSearch } from '@/constants/clinicalItems'

interface Subcat {
  label: string
  hojas: string[]
}
interface Bloque {
  label: string
  subcats: Subcat[]
}

// Subconjunto representativo (hardcodeado) solo para ilustrar la anidación.
const ARBOL: Bloque[] = [
  {
    label: 'Antecedentes',
    subcats: [
      { label: 'Cardiovascular', hojas: ['Hipertensión arterial', 'Insuficiencia cardíaca', 'Arritmia crónica', 'Enfermedad coronaria'] },
      { label: 'Metabólico / endocrino', hojas: ['Diabetes mellitus', 'Obesidad', 'Hipotiroidismo', 'Dislipidemia'] },
      { label: 'Renal', hojas: ['Enfermedad renal crónica'] },
    ],
  },
  {
    label: 'Falla orgánica',
    subcats: [
      { label: 'Órganos', hojas: ['Falla renal aguda', 'Falla hepática aguda', 'Delirium'] },
    ],
  },
]

const query = ref('')

const arbolFiltrado = computed<Bloque[]>(() => {
  const q = normalizeSearch(query.value.trim())
  if (!q) return ARBOL
  return ARBOL.map((bloque) => ({
    ...bloque,
    subcats: bloque.subcats
      .map((sub) => ({ ...sub, hojas: sub.hojas.filter((h) => normalizeSearch(h).includes(q)) }))
      .filter((sub) => sub.hojas.length > 0),
  })).filter((bloque) => bloque.subcats.length > 0)
})

const sinResultados = computed(() => arbolFiltrado.value.length === 0)

const documentoDemo = `EPICRISIS UCI — Hospital Sótero del Río

IDENTIFICACIÓN: Paciente de 71 años, sexo masculino.

ANTECEDENTES: Hipertensión arterial en tratamiento con losartán.
Diabetes mellitus tipo 2. Enfermedad renal crónica etapa 3.
Ex tabáquico. Sin alergias conocidas.

INGRESO: Ingresa a UCI el 12/03 derivado desde urgencias por
neumonía adquirida en la comunidad con insuficiencia respiratoria.

EVOLUCIÓN: Requiere ventilación mecánica invasiva y drogas
vasoactivas. Cursa con injuria renal aguda que requiere
hemofiltración.

EGRESO: Evoluciona favorablemente. Se traslada a sala médica.`

const btnBase = 'px-2 py-0.5 rounded text-[10px] font-bold border bg-white text-gray-400 border-gray-200'
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
        <div class="max-h-72 overflow-y-auto pr-1">
          <pre class="font-mono text-[11.5px] leading-relaxed text-slate-700 whitespace-pre-wrap">{{ documentoDemo }}</pre>
        </div>
      </div>

      <!-- Formulario: búsqueda + árbol anidado (scrolleable) -->
      <div class="p-4 bg-slate-50/50">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Formulario</div>

        <input
          v-model="query"
          type="text"
          placeholder="Buscar un campo…"
          aria-label="Buscar un campo"
          class="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-400 bg-white mb-3"
        />

        <p v-if="sinResultados" class="text-[11px] text-slate-400 italic px-1 py-2">
          Sin resultados para "{{ query }}".
        </p>

        <div v-else data-arbol class="max-h-72 overflow-y-auto pr-1 space-y-2">
          <div v-for="bloque in arbolFiltrado" :key="bloque.label">
            <p class="text-xs font-bold text-slate-700">{{ bloque.label }}</p>
            <div v-for="sub in bloque.subcats" :key="sub.label" class="pl-3 mt-1">
              <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{{ sub.label }}</p>
              <div
                v-for="hoja in sub.hojas"
                :key="hoja"
                class="flex items-center justify-between gap-2 border border-gray-200 rounded-md bg-white px-2.5 py-1.5 mt-1 ml-2"
              >
                <span class="text-xs text-gray-700 leading-tight min-w-0">{{ hoja }}</span>
                <div class="flex gap-1 flex-shrink-0" aria-hidden="true">
                  <span :class="btnBase">Sí</span>
                  <span :class="btnBase">No</span>
                  <span :class="btnBase">?</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 mt-3">Los campos están anidados y se scrollean; el buscador te lleva directo a uno.</p>
      </div>
    </div>
  </div>
</template>
