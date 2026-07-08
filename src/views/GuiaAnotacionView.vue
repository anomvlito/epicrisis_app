<script setup lang="ts">
import GuiaSection from '@/components/guia/GuiaSection.vue'
import GuiaCallout from '@/components/guia/GuiaCallout.vue'
import GuiaValuePill from '@/components/guia/GuiaValuePill.vue'
import GuiaExample from '@/components/guia/GuiaExample.vue'

// Índice del manual — fuente única para el TOC y el orden de las secciones.
const toc = [
  { anchor: 'objetivo',   num: 1, title: 'Objetivo y alcance' },
  { anchor: 'plataforma', num: 2, title: 'Cómo usar la plataforma' },
  { anchor: 'protocolo',  num: 3, title: 'Protocolo de lectura' },
  { anchor: 'valores',    num: 4, title: 'Valores: Sí, No y ?' },
  { anchor: 'dificiles',  num: 5, title: 'Casos difíciles' },
  { anchor: 'flujo',      num: 6, title: 'Flujo de trabajo resumido' },
  { anchor: 'referencia', num: 7, title: 'Referencia por bloque clínico' },
]
</script>

<template>
  <div class="flex-1 min-h-0 overflow-y-auto">
    <div class="max-w-3xl mx-auto px-5 py-8 sm:px-8">

      <!-- Portada -->
      <div class="border-l-4 border-brand-500 bg-brand-50 rounded-r-lg px-6 py-5 mb-8">
        <h1 class="text-xl font-extrabold text-brand-700">Manual de Anotación de Epicrisis</h1>
        <p class="text-sm text-slate-600 mt-1">Guía de uso de la plataforma y criterios de anotación · Hospital Sótero del Río</p>
        <div class="flex flex-wrap gap-2 mt-3">
          <span class="text-xs font-medium text-brand-600 bg-white border border-brand-100 rounded-full px-3 py-1">Anotador</span>
          <span class="text-xs font-medium text-brand-600 bg-white border border-brand-100 rounded-full px-3 py-1">Formulario V3</span>
        </div>
      </div>

      <!-- Índice (TOC) -->
      <nav class="bg-slate-50 border border-gray-200 rounded-lg px-6 py-5 mb-10">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Contenido</h2>
        <ol class="list-decimal pl-5 space-y-1">
          <li v-for="item in toc" :key="item.anchor">
            <a :href="`#${item.anchor}`" class="text-sm text-brand-600 hover:underline">{{ item.title }}</a>
          </li>
        </ol>
      </nav>

      <!-- 1. Objetivo -->
      <GuiaSection anchor="objetivo" :num="1" title="Objetivo y alcance">
        <p>
          Esta guía explica cómo anotar epicrisis de la Unidad de Cuidados Intensivos (UCI) en la
          plataforma. Tu trabajo como anotador es <strong>validar y corregir</strong>, criterio por criterio,
          la extracción que propone el modelo de lenguaje (LLM), dejando como resultado un conjunto de datos
          confiable (<em>ground truth</em>).
        </p>
        <p>
          El formulario está organizado como un <strong>árbol de bloques clínicos</strong> (antecedentes,
          soporte e intervenciones, falla orgánica, infecciones, complicaciones, egreso y calidad). Cada bloque
          agrupa criterios que se responden con los valores <GuiaValuePill variant="si" />,
          <GuiaValuePill variant="no" /> o <GuiaValuePill variant="ns" />.
        </p>
      </GuiaSection>

      <!-- 2. Cómo usar la plataforma -->
      <GuiaSection anchor="plataforma" :num="2" title="Cómo usar la plataforma">
        <p>
          La pantalla de anotación se divide en dos paneles: el <strong>documento</strong> (la epicrisis) a un
          lado y el <strong>formulario</strong> de criterios al otro. Anotas leyendo el documento y respondiendo
          cada criterio del formulario.
        </p>

        <h3 class="text-sm font-semibold text-slate-800 pt-2">Los tres valores de un criterio</h3>
        <p>
          Cada criterio se responde con un valor. Solo uno puede estar activo a la vez:
        </p>
        <ul class="list-disc pl-5 space-y-1">
          <li><GuiaValuePill variant="si" /> — la condición está presente. Debes <strong>capturar la evidencia</strong> (el fragmento del documento que lo respalda).</li>
          <li><GuiaValuePill variant="no" /> — la condición está ausente o negada. No requiere evidencia.</li>
          <li><GuiaValuePill variant="ns" /> — no se puede determinar con el documento. Requiere un <strong>comentario obligatorio</strong> explicando la duda.</li>
        </ul>

        <h3 class="text-sm font-semibold text-slate-800 pt-2">Capturar evidencia</h3>
        <ol class="list-decimal pl-5 space-y-1">
          <li>Selecciona con el cursor el fragmento relevante en el panel del documento.</li>
          <li>Presiona <strong>Capturar</strong> junto al criterio correspondiente.</li>
          <li>El texto queda registrado como evidencia de ese criterio.</li>
          <li>Para corregir, usa <strong>limpiar</strong> y vuelve a capturar.</li>
        </ol>

        <GuiaCallout variant="green">
          <strong>Regla de evidencia:</strong> todo criterio marcado <GuiaValuePill variant="si" /> debe tener
          evidencia capturada. Los <GuiaValuePill variant="no" /> pueden quedar sin evidencia. Los
          <GuiaValuePill variant="ns" /> no requieren evidencia, pero sí un comentario que explique la duda.
        </GuiaCallout>

        <h3 class="text-sm font-semibold text-slate-800 pt-2">La predicción del LLM</h3>
        <p>
          Para cada criterio, la plataforma muestra la <strong>predicción del modelo</strong> (su valor
          propuesto y su confianza). Tu rol es confirmarla o corregirla según el documento. Cuando el modelo
          detecta evidencia en conflicto, marca el criterio con una insignia
          <span class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-700">⚠ Conflicto</span>:
          revísalo con especial cuidado.
        </p>
      </GuiaSection>

      <!-- 3. Protocolo de lectura -->
      <GuiaSection anchor="protocolo" :num="3" title="Protocolo de lectura">
        <p>Un orden de lectura recomendado para no perder información:</p>
        <ol class="list-decimal pl-5 space-y-2">
          <li><strong>Antecedentes primero.</strong> Es donde se concentran las comorbilidades preexistentes. Complétalos a medida que lees.</li>
          <li><strong>Evolución en UCI en detalle.</strong> Aquí aparecen intervenciones, infecciones, fallas orgánicas y complicaciones. Varía mucho entre casos: léela con atención.</li>
          <li><strong>Segunda pasada por antecedentes.</strong> Al terminar, revisa si apareció una comorbilidad fuera de la sección de antecedentes; si la encuentras con certeza, actualízala a <GuiaValuePill variant="si" /> y captura la evidencia.</li>
          <li><strong>Verificación final.</strong> Confirma que todo <GuiaValuePill variant="si" /> tenga evidencia y que cada <GuiaValuePill variant="ns" /> tenga su comentario.</li>
        </ol>
      </GuiaSection>

      <!-- 4. Valores Sí / No / ? -->
      <GuiaSection anchor="valores" :num="4" title="Valores: Sí, No y ?">
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse min-w-[520px]">
            <thead>
              <tr>
                <th class="text-left font-semibold text-xs uppercase tracking-wide px-3 py-2 border bg-green-50 text-green-700 border-green-200">Marca Sí cuando…</th>
                <th class="text-left font-semibold text-xs uppercase tracking-wide px-3 py-2 border bg-red-50 text-red-700 border-red-200">Marca No cuando…</th>
                <th class="text-left font-semibold text-xs uppercase tracking-wide px-3 py-2 border bg-amber-50 text-amber-700 border-amber-200">Marca ? cuando…</th>
              </tr>
            </thead>
            <tbody class="align-top">
              <tr>
                <td class="border border-gray-200 px-3 py-2">
                  <ul class="list-disc pl-4 space-y-1">
                    <li>La condición aparece nombrada explícitamente.</li>
                    <li>Se usa un sinónimo claro.</li>
                    <li>La deducción es directa e inequívoca.</li>
                  </ul>
                </td>
                <td class="border border-gray-200 px-3 py-2">
                  <ul class="list-disc pl-4 space-y-1">
                    <li>No aparece en ninguna sección.</li>
                    <li>Se menciona en negación ("sin antecedentes de…").</li>
                    <li>Es una sospecha descartada.</li>
                  </ul>
                </td>
                <td class="border border-gray-200 px-3 py-2">
                  <ul class="list-disc pl-4 space-y-1">
                    <li>La información es genuinamente ambigua.</li>
                    <li>La deducción requiere más de un paso no trivial.</li>
                    <li>No es posible resolverla con la lectura.</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <GuiaCallout variant="amber">
          Al marcar <GuiaValuePill variant="ns" /> es <strong>obligatorio</strong> escribir un comentario que
          explique la duda. Úsalo con moderación: es para incertidumbre genuina, no un reemplazo de la lectura
          cuidadosa.
        </GuiaCallout>

        <GuiaExample label="Ejemplo — criterio marcado con ?">
          <template #quote>Fármacos habituales: furosemida 40 mg/día. Sin mención explícita de insuficiencia cardíaca.</template>
          <template #result>
            → Criterio <em>Insuficiencia cardíaca</em> · valor <GuiaValuePill variant="ns" /> ·
            comentario: <em>"Solo furosemida, sin diagnóstico explícito de IC. Duda genuina."</em>
          </template>
        </GuiaExample>
      </GuiaSection>

      <!-- 5. Casos difíciles -->
      <GuiaSection anchor="dificiles" :num="5" title="Casos difíciles">
        <h3 class="text-sm font-semibold text-slate-800">Deducciones a partir de fármacos</h3>
        <p>Cuando un fármaco habitual es suficientemente específico de una condición, la deducción es aceptable:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Antihipertensivos crónicos → <GuiaValuePill variant="si" /> Hipertensión arterial.</li>
          <li>Insulina o metformina habitual → <GuiaValuePill variant="si" /> Diabetes.</li>
          <li>Diurético (furosemida) como único indicio → insuficiente para deducir IC; marca <GuiaValuePill variant="no" /> o <GuiaValuePill variant="ns" /> con comentario.</li>
        </ul>

        <h3 class="text-sm font-semibold text-slate-800 pt-2">Negaciones</h3>
        <p>
          Frases como <em>"no presenta diabetes"</em>, <em>"sin antecedentes de HTA"</em> o
          <em>"se descarta infección urinaria"</em> se anotan como <GuiaValuePill variant="no" />.
        </p>

        <GuiaCallout variant="amber">
          Ante abreviaturas institucionales o dudas de significado, <strong>consulta al adjudicador</strong> antes
          de anotar. No asumas equivalencias.
        </GuiaCallout>
      </GuiaSection>

      <!-- 6. Flujo resumido -->
      <GuiaSection anchor="flujo" :num="6" title="Flujo de trabajo resumido">
        <div class="bg-slate-50 border border-gray-200 rounded-lg px-6 py-5 space-y-2 text-sm">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-brand-50 border border-brand-100 text-brand-600 rounded px-3 py-1.5 font-medium">1. Leer antecedentes</span>
            <span class="text-slate-400">→</span>
            <span class="bg-white border border-gray-200 rounded px-3 py-1.5">Completar comorbilidades</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-brand-50 border border-brand-100 text-brand-600 rounded px-3 py-1.5 font-medium">2. Leer evolución UCI</span>
            <span class="text-slate-400">→</span>
            <span class="bg-white border border-gray-200 rounded px-3 py-1.5">Intervenciones · Infecciones · Fallas · Complicaciones · Egreso</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-brand-50 border border-brand-100 text-brand-600 rounded px-3 py-1.5 font-medium">3. Segunda pasada</span>
            <span class="text-slate-400">→</span>
            <span class="bg-white border border-gray-200 rounded px-3 py-1.5">¿Apareció una comorbilidad nueva?</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-brand-50 border border-brand-100 text-brand-600 rounded px-3 py-1.5 font-medium">4. Verificación final</span>
            <span class="text-slate-400">→</span>
            <span class="bg-white border border-gray-200 rounded px-3 py-1.5">Todo Sí con evidencia · cada ? con comentario</span>
          </div>
        </div>
      </GuiaSection>

      <!-- 7. Referencia por bloque (HU-035) -->
      <GuiaSection anchor="referencia" :num="7" title="Referencia por bloque clínico">
        <GuiaCallout variant="blue">
          La referencia detallada de cada criterio (qué marcar en cada campo, por bloque clínico) se incorpora en
          una entrega posterior (HU-035), derivada directamente del formulario para mantenerse siempre
          sincronizada con la app.
        </GuiaCallout>
      </GuiaSection>

    </div>
  </div>
</template>
