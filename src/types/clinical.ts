export interface ClinicalData {
  // ── ANTECEDENTES ──
  cirugiaPrevias: boolean | null
  cirugiasPreviasCantidad: number | null
  farmacos: string

  // ── SOPORTE VENTILATORIO ──
  vmi: boolean | null
  vmiEvidencia: string
  vmiMotivo: string
  vmiUrgente: boolean | null   // true = urgente/inmediata, false = planificada
  vmiProno: boolean | null

  // ── REANIMACIÓN ──
  maniobrasReanimacion: string
  ciclosParo: number | null
  cantidadParos: number | null

  // ── TRANSFUSIÓN ──
  transfusion: boolean | null
  transfusionEvidencia: string
  transfusionUnidades: number | null

  // ── DROGAS VASOACTIVAS ──
  drogasVasoactivas: boolean | null
  drogasVasoactivasEvidencia: string
  drogasVasoactivasMultiples: boolean | null

  // ── CIRUGÍAS DURANTE HOSPITALIZACIÓN ──
  cirugiasHosp: number | null
  cirugiasHospDescripcion: string

  // ── INFECCIONES POR FOCO ──
  infeccionUrinario: boolean | null
  infeccionRespiratorio: boolean | null
  infeccionVascular: boolean | null
  infeccionSangre: boolean | null
  infeccionCerebral: boolean | null
  infeccionCardiaco: boolean | null
  infeccionQuirurgico: boolean | null
  infeccionGastrointestinal: boolean | null
  infeccionPielTejidos: boolean | null

  // ── TERAPIA DE REEMPLAZO RENAL ──
  trr: boolean | null

  // ── FALLA ORGÁNICA ──
  fallaRenal: boolean | null
  fallaNervioso: boolean | null
  fallaVascular: boolean | null
  fallaCardiaco: boolean | null
  fallaPulmonar: boolean | null
  fallaHepatico: boolean | null
  fallaOtra: boolean | null

  // ── DIAGNÓSTICOS Y EGRESO ──
  diagnosticoIngreso: string
  diagnosticoEgreso: string
  farmacosHosp: string
  mortalidad: boolean | null
  hfav: boolean | null
}

export function defaultClinicalData(): ClinicalData {
  return {
    cirugiaPrevias: null,
    cirugiasPreviasCantidad: null,
    farmacos: '',
    vmi: null,
    vmiEvidencia: '',
    vmiMotivo: '',
    vmiUrgente: null,
    vmiProno: null,
    maniobrasReanimacion: '',
    ciclosParo: null,
    cantidadParos: null,
    transfusion: null,
    transfusionEvidencia: '',
    transfusionUnidades: null,
    drogasVasoactivas: null,
    drogasVasoactivasEvidencia: '',
    drogasVasoactivasMultiples: null,
    cirugiasHosp: null,
    cirugiasHospDescripcion: '',
    infeccionUrinario: null,
    infeccionRespiratorio: null,
    infeccionVascular: null,
    infeccionSangre: null,
    infeccionCerebral: null,
    infeccionCardiaco: null,
    infeccionQuirurgico: null,
    infeccionGastrointestinal: null,
    infeccionPielTejidos: null,
    trr: null,
    fallaRenal: null,
    fallaNervioso: null,
    fallaVascular: null,
    fallaCardiaco: null,
    fallaPulmonar: null,
    fallaHepatico: null,
    fallaOtra: null,
    diagnosticoIngreso: '',
    diagnosticoEgreso: '',
    farmacosHosp: '',
    mortalidad: null,
    hfav: null,
  }
}
