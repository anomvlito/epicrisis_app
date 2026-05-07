<script setup lang="ts">
import { useAnnotationStore } from '@/stores/annotation'
import type { ClinicalData } from '@/types/clinical'

defineProps<{ isReadOnly?: boolean }>()

const store = useAnnotationStore()

const FOCOS = [
  { key: 'infeccionUrinario' as const,         label: 'Urinario' },
  { key: 'infeccionRespiratorio' as const,     label: 'Respiratorio' },
  { key: 'infeccionVascular' as const,         label: 'Vascular' },
  { key: 'infeccionSangre' as const,           label: 'Sangre' },
  { key: 'infeccionCerebral' as const,         label: 'Cerebral' },
  { key: 'infeccionCardiaco' as const,         label: 'Cardíaco' },
  { key: 'infeccionQuirurgico' as const,       label: 'Quirúrgico' },
  { key: 'infeccionGastrointestinal' as const, label: 'Gastrointestinal' },
  { key: 'infeccionPielTejidos' as const,      label: 'Piel y tejidos blandos' },
]

const ORGANOS = [
  { key: 'fallaRenal' as const,    label: 'Renal' },
  { key: 'fallaNervioso' as const, label: 'Nervioso' },
  { key: 'fallaVascular' as const, label: 'Vascular' },
  { key: 'fallaCardiaco' as const, label: 'Cardíaco' },
  { key: 'fallaPulmonar' as const, label: 'Pulmonar' },
  { key: 'fallaHepatico' as const, label: 'Hepático' },
  { key: 'fallaOtra' as const,     label: 'Otra' },
]

function btnClass(current: boolean | null, value: boolean) {
  const active = current === value
  return [
    'px-2 py-0.5 rounded text-[11px] font-semibold transition-colors',
    active && value  ? 'bg-green-500 text-white' : '',
    active && !value ? 'bg-red-500 text-white'   : '',
    !active          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : '',
  ]
}

function set<K extends keyof ClinicalData>(key: K, value: ClinicalData[K]) {
  store.setClinical(key, value)
}

function toggle(key: keyof ClinicalData, value: boolean) {
  const current = store.clinicalData[key]
  set(key, current === value ? null : value)
}

function numInput(key: keyof ClinicalData, raw: string) {
  const n = raw === '' ? null : Number(raw)
  set(key, isNaN(n as number) ? null : n as any)
}
</script>

<template>
  <div class="space-y-2">

    <!-- ── SOPORTE VENTILATORIO ── -->
    <section class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Soporte Ventilatorio</span>
      </div>
      <div class="px-3 py-2 space-y-2.5">
        <!-- VMI bool -->
        <div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-gray-700 font-medium">Ventilación mecánica invasiva (VMI)</span>
            <div class="flex gap-1 flex-shrink-0" @click.stop>
              <button :class="btnClass(store.clinicalData.vmi, true)" :disabled="isReadOnly" @click="toggle('vmi', true)">Sí</button>
              <button :class="btnClass(store.clinicalData.vmi, false)" :disabled="isReadOnly" @click="toggle('vmi', false)">No</button>
            </div>
          </div>
          <div v-if="store.clinicalData.vmi === true" class="mt-1.5 space-y-1.5">
            <textarea
              :value="store.clinicalData.vmiEvidencia"
              :readonly="isReadOnly"
              rows="2"
              placeholder="Fragmento de evidencia del documento…"
              class="field-textarea"
              @input="set('vmiEvidencia', ($event.target as HTMLTextAreaElement).value)"
            />
            <input
              :value="store.clinicalData.vmiMotivo"
              :readonly="isReadOnly"
              placeholder="Motivo de la VMI…"
              class="field-input"
              @input="set('vmiMotivo', ($event.target as HTMLInputElement).value)"
            />
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-gray-600">Urgencia</span>
              <div class="flex gap-1">
                <button :class="btnClass(store.clinicalData.vmiUrgente, true)" :disabled="isReadOnly" @click="toggle('vmiUrgente', true)">Inmediata</button>
                <button :class="btnClass(store.clinicalData.vmiUrgente, false)" :disabled="isReadOnly" @click="toggle('vmiUrgente', false)">Planificada</button>
              </div>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-gray-600">Posición prono</span>
              <div class="flex gap-1">
                <button :class="btnClass(store.clinicalData.vmiProno, true)" :disabled="isReadOnly" @click="toggle('vmiProno', true)">Sí</button>
                <button :class="btnClass(store.clinicalData.vmiProno, false)" :disabled="isReadOnly" @click="toggle('vmiProno', false)">No</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── REANIMACIÓN ── -->
    <section class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reanimación</span>
      </div>
      <div class="px-3 py-2 space-y-2">
        <div>
          <label class="field-label">Maniobras de reanimación</label>
          <textarea
            :value="store.clinicalData.maniobrasReanimacion"
            :readonly="isReadOnly"
            rows="2"
            placeholder="Descripción de maniobras realizadas…"
            class="field-textarea"
            @input="set('maniobrasReanimacion', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div class="grid grid-cols-2 gap-x-3">
          <div>
            <label class="field-label">Cantidad de paros</label>
            <input
              :value="store.clinicalData.cantidadParos ?? ''"
              :readonly="isReadOnly"
              type="number" min="0"
              placeholder="0"
              class="field-input"
              @input="numInput('cantidadParos', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div>
            <label class="field-label">Ciclos para sacar de paro</label>
            <input
              :value="store.clinicalData.ciclosParo ?? ''"
              :readonly="isReadOnly"
              type="number" min="0"
              placeholder="0"
              class="field-input"
              @input="numInput('ciclosParo', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ── TRANSFUSIÓN ── -->
    <section class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transfusión</span>
      </div>
      <div class="px-3 py-2 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs text-gray-700 font-medium">Hubo transfusión</span>
          <div class="flex gap-1">
            <button :class="btnClass(store.clinicalData.transfusion, true)" :disabled="isReadOnly" @click="toggle('transfusion', true)">Sí</button>
            <button :class="btnClass(store.clinicalData.transfusion, false)" :disabled="isReadOnly" @click="toggle('transfusion', false)">No</button>
          </div>
        </div>
        <template v-if="store.clinicalData.transfusion === true">
          <textarea
            :value="store.clinicalData.transfusionEvidencia"
            :readonly="isReadOnly"
            rows="2"
            placeholder="Fragmento de evidencia del documento…"
            class="field-textarea"
            @input="set('transfusionEvidencia', ($event.target as HTMLTextAreaElement).value)"
          />
          <div>
            <label class="field-label">Unidades transfundidas</label>
            <input
              :value="store.clinicalData.transfusionUnidades ?? ''"
              :readonly="isReadOnly"
              type="number" min="0"
              placeholder="0"
              class="field-input w-24"
              @input="numInput('transfusionUnidades', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </template>
      </div>
    </section>

    <!-- ── DROGAS VASOACTIVAS ── -->
    <section class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drogas Vasoactivas</span>
      </div>
      <div class="px-3 py-2 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs text-gray-700 font-medium">Uso de drogas vasoactivas</span>
          <div class="flex gap-1">
            <button :class="btnClass(store.clinicalData.drogasVasoactivas, true)" :disabled="isReadOnly" @click="toggle('drogasVasoactivas', true)">Sí</button>
            <button :class="btnClass(store.clinicalData.drogasVasoactivas, false)" :disabled="isReadOnly" @click="toggle('drogasVasoactivas', false)">No</button>
          </div>
        </div>
        <template v-if="store.clinicalData.drogasVasoactivas === true">
          <textarea
            :value="store.clinicalData.drogasVasoactivasEvidencia"
            :readonly="isReadOnly"
            rows="2"
            placeholder="Fragmento de evidencia del documento…"
            class="field-textarea"
            @input="set('drogasVasoactivasEvidencia', ($event.target as HTMLTextAreaElement).value)"
          />
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-gray-600">Más de 1 droga vasoactiva</span>
            <div class="flex gap-1">
              <button :class="btnClass(store.clinicalData.drogasVasoactivasMultiples, true)" :disabled="isReadOnly" @click="toggle('drogasVasoactivasMultiples', true)">Sí</button>
              <button :class="btnClass(store.clinicalData.drogasVasoactivasMultiples, false)" :disabled="isReadOnly" @click="toggle('drogasVasoactivasMultiples', false)">No</button>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- ── CIRUGÍAS (HOSPITALIZACIÓN) ── -->
    <section class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cirugías en Hospitalización</span>
      </div>
      <div class="px-3 py-2 space-y-2">
        <div>
          <label class="field-label">Cantidad de cirugías</label>
          <input
            :value="store.clinicalData.cirugiasHosp ?? ''"
            :readonly="isReadOnly"
            type="number" min="0"
            placeholder="0"
            class="field-input w-24"
            @input="numInput('cirugiasHosp', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div>
          <label class="field-label">Descripción (cuáles)</label>
          <textarea
            :value="store.clinicalData.cirugiasHospDescripcion"
            :readonly="isReadOnly"
            rows="2"
            placeholder="Ej: colecistectomía laparoscópica, apendicectomía…"
            class="field-textarea"
            @input="set('cirugiasHospDescripcion', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </section>

    <!-- ── TRR ── -->
    <section class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="px-3 py-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs text-gray-700 font-medium">Terapia de reemplazo renal (TRR)</span>
          <div class="flex gap-1">
            <button :class="btnClass(store.clinicalData.trr, true)" :disabled="isReadOnly" @click="toggle('trr', true)">Sí</button>
            <button :class="btnClass(store.clinicalData.trr, false)" :disabled="isReadOnly" @click="toggle('trr', false)">No</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── INFECCIONES POR FOCO ── -->
    <section class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Infecciones por Foco</span>
      </div>
      <div class="px-3 py-2 grid grid-cols-1 gap-y-1.5">
        <template v-for="foco in FOCOS" :key="foco.key">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-gray-600">{{ foco.label }}</span>
            <div class="flex gap-1">
              <button :class="btnClass(store.clinicalData[foco.key], true)" :disabled="isReadOnly" @click="toggle(foco.key, true)">Sí</button>
              <button :class="btnClass(store.clinicalData[foco.key], false)" :disabled="isReadOnly" @click="toggle(foco.key, false)">No</button>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- ── FALLA ORGÁNICA ── -->
    <section class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Falla Orgánica</span>
      </div>
      <div class="px-3 py-2 grid grid-cols-1 gap-y-1.5">
        <template v-for="organo in ORGANOS" :key="organo.key">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-gray-600">{{ organo.label }}</span>
            <div class="flex gap-1">
              <button :class="btnClass(store.clinicalData[organo.key], true)" :disabled="isReadOnly" @click="toggle(organo.key, true)">Sí</button>
              <button :class="btnClass(store.clinicalData[organo.key], false)" :disabled="isReadOnly" @click="toggle(organo.key, false)">No</button>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- ── DIAGNÓSTICOS Y EGRESO ── -->
    <section class="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div class="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diagnósticos y Egreso</span>
      </div>
      <div class="px-3 py-2 space-y-2">
        <div>
          <label class="field-label">Diagnóstico de ingreso</label>
          <textarea
            :value="store.clinicalData.diagnosticoIngreso"
            :readonly="isReadOnly"
            rows="2"
            placeholder="Diagnóstico principal al momento de ingresar…"
            class="field-textarea"
            @input="set('diagnosticoIngreso', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div>
          <label class="field-label">Diagnóstico de egreso</label>
          <textarea
            :value="store.clinicalData.diagnosticoEgreso"
            :readonly="isReadOnly"
            rows="2"
            placeholder="Diagnóstico principal al momento del alta…"
            class="field-textarea"
            @input="set('diagnosticoEgreso', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div>
          <label class="field-label">Fármacos suministrados durante hospitalización</label>
          <textarea
            :value="store.clinicalData.farmacosHosp"
            :readonly="isReadOnly"
            rows="3"
            placeholder="Lista de fármacos administrados…"
            class="field-textarea"
            @input="set('farmacosHosp', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs text-gray-700 font-medium">Mortalidad</span>
          <div class="flex gap-1">
            <button :class="btnClass(store.clinicalData.mortalidad, true)" :disabled="isReadOnly" @click="toggle('mortalidad', true)">Sí</button>
            <button :class="btnClass(store.clinicalData.mortalidad, false)" :disabled="isReadOnly" @click="toggle('mortalidad', false)">No</button>
          </div>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs text-gray-700 font-medium">Hemofiltración de alto volumen (HFAV)</span>
          <div class="flex gap-1">
            <button :class="btnClass(store.clinicalData.hfav, true)" :disabled="isReadOnly" @click="toggle('hfav', true)">Sí</button>
            <button :class="btnClass(store.clinicalData.hfav, false)" :disabled="isReadOnly" @click="toggle('hfav', false)">No</button>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>


<style scoped>
.field-label {
  @apply block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1;
}
.field-input {
  @apply w-full rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-brand-500 bg-white disabled:bg-gray-50;
}
.field-textarea {
  @apply w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-500 bg-white disabled:bg-gray-50;
}
</style>
