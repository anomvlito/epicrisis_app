<script setup lang="ts">
import GuiaSection from '@/components/guia/GuiaSection.vue'
import GuiaCallout from '@/components/guia/GuiaCallout.vue'
import GuiaValuePill from '@/components/guia/GuiaValuePill.vue'
import GuiaEjemplosTabs from '@/components/guia/GuiaEjemplosTabs.vue'
import GuiaMockPantalla from '@/components/guia/GuiaMockPantalla.vue'
import GuiaMockCaptura from '@/components/guia/GuiaMockCaptura.vue'
import GuiaMockFecha from '@/components/guia/GuiaMockFecha.vue'
import { GUIA_EJEMPLOS } from '@/constants/guiaEjemplos'

// Índice del manual — fuente única para el TOC y el orden de las secciones.
// Estructura espejo de guias/manual-anotacion.md (documento base definitivo).
const toc = [
  { anchor: 'objetivo',        num: 1, title: 'Objetivo y alcance' },
  { anchor: 'plataforma',      num: 2, title: 'Cómo usar la plataforma' },
  { anchor: 'macrosecciones',  num: 3, title: 'Macrosecciones del formulario' },
  { anchor: 'ejemplos',        num: 4, title: 'Ejemplos interactivos' },
  { anchor: 'recomendaciones', num: 5, title: 'Recomendaciones de rellenado' },
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

      <!-- Video tutorial -->
      <div class="mb-10">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Video tutorial</h2>
        <div class="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-black">
          <iframe
            class="w-full h-full"
            src="https://www.youtube.com/embed/cucU2fMMd9s?rel=0"
            title="Video tutorial de anotación"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
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

      <!-- 1. Objetivo y alcance -->
      <GuiaSection anchor="objetivo" :num="1" title="Objetivo y alcance">
        <p>
          Esta guía explica cómo <strong>extraer campos clínicos a partir de las epicrisis</strong> de la Unidad
          de Cuidados Intensivos (UCI) del Hospital Sótero del Río.
        </p>
        <p>
          El objetivo de esta extracción es tener un <strong>registro humano del proceso de extracción</strong>,
          que sirve como referencia (<em>gold standard</em>) para <strong>validar la extracción automatizada que
          hace la IA</strong>. Es decir: lo que tú anotas es lo que después usamos para medir qué tan bien lo hace
          el sistema automático.
        </p>
        <p>El proceso consiste, para cada campo clínico del formulario, en:</p>
        <ol class="list-decimal pl-5 space-y-1">
          <li>Marcar <strong>si la condición existe o no</strong>, y con qué <strong>nivel de incertidumbre</strong>.</li>
          <li><strong>Anotar la evidencia textual</strong> (el fragmento de la epicrisis) que respalda tu decisión.</li>
          <li>Opcionalmente, <strong>dejar un comentario</strong> cuando algo requiera aclaración.</li>
        </ol>
      </GuiaSection>

      <!-- 2. Cómo usar la plataforma -->
      <GuiaSection anchor="plataforma" :num="2" title="Cómo usar la plataforma">

        <h3 class="text-sm font-semibold text-slate-800">2.1 La pantalla de anotación</h3>
        <p>
          La pantalla de anotación se divide en <strong>dos paneles</strong>: a la <strong>izquierda</strong> el
          documento de la epicrisis y a la <strong>derecha</strong> el formulario de anotación. Anotas leyendo el
          documento de la izquierda y respondiendo cada campo del formulario de la derecha.
        </p>
        <p>
          Los campos están <strong>anidados</strong> (organizados como un acordeón): una categoría madre agrupa
          varios campos hoja. Al marcar una categoría se despliegan sus campos internos. Además, en la
          <strong>barra superior</strong> puedes <strong>buscar un campo específico</strong> por su nombre, sin
          recorrer todo el árbol.
        </p>

        <GuiaMockPantalla />

        <h3 class="text-sm font-semibold text-slate-800 pt-2">2.2 Opciones de respuesta</h3>
        <p>Cada campo se responde con <strong>un único valor activo a la vez</strong>:</p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse min-w-[520px]">
            <thead>
              <tr>
                <th class="text-left font-semibold text-xs uppercase tracking-wide px-3 py-2 border bg-slate-50 text-slate-600 border-gray-200">Valor</th>
                <th class="text-left font-semibold text-xs uppercase tracking-wide px-3 py-2 border bg-slate-50 text-slate-600 border-gray-200">Qué significa</th>
                <th class="text-left font-semibold text-xs uppercase tracking-wide px-3 py-2 border bg-slate-50 text-slate-600 border-gray-200">¿Requiere evidencia?</th>
              </tr>
            </thead>
            <tbody class="align-top">
              <tr>
                <td class="border border-gray-200 px-3 py-2"><GuiaValuePill variant="si" /></td>
                <td class="border border-gray-200 px-3 py-2">La condición está presente, ya sea por existencia textual explícita o por inferencia directa.</td>
                <td class="border border-gray-200 px-3 py-2"><strong>Sí</strong>, debes capturar el fragmento que lo respalda.</td>
              </tr>
              <tr>
                <td class="border border-gray-200 px-3 py-2"><GuiaValuePill variant="no" /></td>
                <td class="border border-gray-200 px-3 py-2">La condición está ausente o aparece negada.</td>
                <td class="border border-gray-200 px-3 py-2">No.</td>
              </tr>
              <tr>
                <td class="border border-gray-200 px-3 py-2"><GuiaValuePill variant="ns" /></td>
                <td class="border border-gray-200 px-3 py-2">La evidencia es poco clara, exige deducciones poco seguras o es inconsistente.</td>
                <td class="border border-gray-200 px-3 py-2"><strong>Sí</strong>, además eliges el nivel de <strong>Incertidumbre</strong> (Alto / Bajo / Indeterminado) y puedes dejar un comentario.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Usa <GuiaValuePill variant="ns" /> solo para incertidumbre genuina; no lo utilices como atajo para
          evitar leer con cuidado.
        </p>

        <h3 class="text-sm font-semibold text-slate-800 pt-2">2.3 Capturar evidencia</h3>
        <p>La evidencia es el fragmento del documento que justifica tu respuesta. Para capturarla:</p>
        <ol class="list-decimal pl-5 space-y-1">
          <li><strong>Selecciona con el cursor</strong> el fragmento relevante en el panel del documento (izquierda).</li>
          <li>Presiona el botón <strong>Capturar</strong>, arriba a la derecha en el criterio correspondiente, o pulsa la <strong>barra espaciadora</strong>.</li>
        </ol>
        <p>Para corregir una captura, pulsa <strong>Limpiar</strong> y vuelve a seleccionar y capturar.</p>
        <p>
          Puedes capturar <strong>varios fragmentos</strong> para un mismo criterio: cada uno vive en su propia
          casilla. El botón <strong>+</strong> agrega otra casilla y <strong>−</strong> elimina las secundarias
          (la casilla principal no se elimina).
        </p>
        <p>
          Cada casilla tiene un <strong>candado</strong>: <strong>abierto</strong> significa que está editable y
          "a la escucha" (la captura cae ahí); <strong>cerrado</strong> la deja confirmada y en solo lectura, sin
          recibir nuevas capturas. Solo hay <strong>una casilla activa a la vez</strong> en todo el formulario.
        </p>
        <GuiaCallout variant="green">
          <strong>Regla de evidencia:</strong> los criterios marcados <GuiaValuePill variant="si" /> y
          <GuiaValuePill variant="ns" /> deben tener evidencia capturada (es <strong>obligatorio</strong>); los
          <GuiaValuePill variant="no" /> pueden quedar sin evidencia. Al marcar <GuiaValuePill variant="ns" />
          además eliges el nivel de <strong>Incertidumbre</strong> y, si lo consideras útil, dejas un comentario.
        </GuiaCallout>

        <GuiaMockCaptura />

        <h3 class="text-sm font-semibold text-slate-800 pt-2">2.4 Campos de texto y fecha</h3>
        <p>En algunas ocasiones, en vez de responder con <GuiaValuePill variant="si" /> / <GuiaValuePill variant="no" /> / <GuiaValuePill variant="ns" />, el formulario te pedirá:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Texto en formato "Capturar evidencia"</strong> — seleccionas el fragmento del documento igual que con la evidencia normal.</li>
          <li><strong>Una fecha</strong> — la ingresas en el campo de fecha correspondiente.</li>
        </ul>

        <GuiaMockFecha />
      </GuiaSection>

      <!-- 3. Macrosecciones del formulario -->
      <GuiaSection anchor="macrosecciones" :num="3" title="Macrosecciones del formulario">
        <p>
          El formulario se divide en las siguientes macrosecciones. En general comparten una estructura similar,
          con algunas excepciones que se indican en cada caso.
        </p>
        <div class="space-y-3">
          <p><strong>Antecedentes.</strong> Condiciones que el paciente ya traía antes de entrar a la UCI: enfermedades, cirugías, alergias, hábitos y dependencia funcional. Se llenan una sola vez. Cada categoría (corazón, riñón, pulmón…) se abre al marcarla, y ahí eliges las condiciones puntuales. Algunos campos podrían encajar en dos secciones, pero se registran en una sola; por ejemplo, un ataque cerebral previo va en la categoría de corazón y vasos, no en la neurológica.</p>

          <p><strong>Ingreso.</strong> Fecha de ingreso y desde dónde llegó el paciente a la UCI. Como diagnóstico principal, anota el que motivó el ingreso; los demás van como secundarios.</p>

          <p><strong>Soporte e intervenciones.</strong> Todo lo que se hizo para sostener al paciente. Está dividido en: reanimación cardiopulmonar, hemodinámico, respiratorio, circulación extracorpórea, sedación, renal, hemofiltración de alto volumen, transfusión y otros. En algunos se solicitará la fecha de inicio. Recibir soporte para un órgano no significa que ese órgano haya fallado (eso se registra aparte, en Falla orgánica).</p>

          <p><strong>Falla orgánica.</strong> Qué órganos dejaron de funcionar bien durante la UCI. Distingue lo agudo de lo crónico: una falla renal <em>aguda</em> no es lo mismo que un paciente que ya venía con el riñón dañado y estable. Un puntaje tipo SOFA o APACHE solo se marca si el texto lo nombra. El delirium va aquí solo si fue grave; si fue leve, va en Complicaciones.</p>

          <p><strong>Infecciones.</strong> Se anota en cascada: primero si hubo infección, luego si fue sepsis, después dónde estaba (el foco), con qué germen y con qué tratamiento. No marques infección solo por fiebre, exámenes alterados o un cultivo suelto: hace falta un diagnóstico. Algunos cultivos suelen ser contaminación, no infección.</p>

          <p><strong>Complicaciones.</strong> Problemas que aparecen por la propia estadía en la UCI: delirium, debilidad muscular, escaras, desnutrición, etc. El delirium leve va aquí; el grave va en Falla orgánica (neurológica). La traqueostomía no va aquí, va en el soporte respiratorio.</p>

          <p><strong>Egreso.</strong> Cómo terminó la estadía en la UCI. Primero indicas si el paciente salió vivo o falleció; si salió vivo, se abre a dónde fue, junto con el diagnóstico de egreso.</p>

          <p><strong>Reingreso.</strong> Si el paciente tuvo que volver a la UCI en la misma hospitalización. Por ahora solo registramos la primera estadía para simplificar la extracción. En comentarios puedes mencionar si hay información relevante en otra de las estadías.</p>

          <p><strong>Calidad de la epicrisis.</strong> Al cierre das tu impresión de qué tan completa y confiable venía la epicrisis: confiable, parcial o deficiente. Es tu juicio como anotador, enfocado en la calidad de la información que se pudo extraer. Al final puedes escribir un comentario final, útil para describir con más detalle la calidad de la epicrisis o del proceso de anotación.</p>
        </div>
      </GuiaSection>

      <!-- 4. Ejemplos interactivos -->
      <GuiaSection anchor="ejemplos" :num="4" title="Ejemplos interactivos">
        <p>
          Antes de anotar casos reales, <strong>practica con los ejemplos interactivos</strong>. En cada ejemplo:
          lee el <strong>documento</strong>, marca la respuesta y selecciona la evidencia; luego pulsa
          <strong>"Ver respuesta correcta"</strong> para comparar. Hay varios escenarios para que explores las
          situaciones posibles.
        </p>
        <div class="not-prose">
          <GuiaEjemplosTabs :ejemplos="GUIA_EJEMPLOS" />
        </div>
      </GuiaSection>

      <!-- 5. Recomendaciones de rellenado -->
      <GuiaSection anchor="recomendaciones" :num="5" title="Recomendaciones de rellenado">
        <p>
          <strong>No se anota por bloques aislados ni en un orden rígido.</strong> Lo central es ir leyendo las
          macrosecciones a la par del documento de la epicrisis, y decidir cada campo según la
          <strong>claridad de la evidencia</strong>.
        </p>

        <h3 class="text-sm font-semibold text-slate-800 pt-2">¿Cómo abordar las tres opciones de respuesta?</h3>
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

      </GuiaSection>

    </div>
  </div>
</template>
