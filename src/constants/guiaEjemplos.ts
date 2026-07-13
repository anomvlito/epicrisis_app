// HU-034 — Datos de los ejemplos interactivos del manual.
//
// Cada ejemplo simula un fragmento de epicrisis ("documento") y la anotación
// correcta de UN campo, para enseñar el uso de Sí/No/?, la captura de evidencia
// y la sospecha clínica. El componente GuiaEjemploInteractivo.vue los renderiza.
//
// `evidenciaResaltada` DEBE ser un substring exacto de `textoDocumento` (se
// resalta y se "captura" desde ahí). El test guiaEjemplos.test.ts lo verifica.

export type ValorAnotacion = 'si' | 'no' | 'ns'
export type SospechaClinica = 'Alto' | 'Bajo' | 'Indeterminado'

export interface EjemploRespuesta {
  valor: ValorAnotacion
  /** Fragmento a capturar como evidencia (para 'si'; opcional en 'ns'). */
  evidencia?: string
  /** Solo cuando valor === 'ns' (botón ?). Refleja el desplegable real. */
  sospecha?: SospechaClinica
  comentario?: string
}

export interface EjemploAnotacion {
  id: string
  seccion: string
  campoLabel: string
  icd10?: string
  textoDocumento: string
  evidenciaResaltada: string
  respuesta: EjemploRespuesta
  explicacion: string
}

export const GUIA_EJEMPLOS: EjemploAnotacion[] = [
  {
    id: 'antecedentes-hta',
    seccion: 'Antecedentes',
    campoLabel: 'Hipertensión arterial',
    icd10: 'I10',
    textoDocumento:
      'ANTECEDENTES: Paciente de 68 años con hipertensión arterial en tratamiento con losartán. Sin otros antecedentes relevantes.',
    evidenciaResaltada: 'hipertensión arterial en tratamiento con losartán',
    respuesta: {
      valor: 'si',
      evidencia: 'hipertensión arterial en tratamiento con losartán',
    },
    explicacion:
      'La HTA aparece nombrada explícitamente y con tratamiento crónico. Se marca Sí y se captura el fragmento como evidencia.',
  },
  {
    id: 'antecedentes-diabetes-no',
    seccion: 'Antecedentes',
    campoLabel: 'Diabetes mellitus',
    icd10: 'E11',
    textoDocumento:
      'ANTECEDENTES: Hipertensión arterial. No presenta diabetes. Fármacos: enalapril.',
    evidenciaResaltada: 'No presenta diabetes',
    respuesta: { valor: 'no' },
    explicacion:
      'La condición se menciona en negación explícita ("No presenta diabetes"). Se marca No; no requiere evidencia.',
  },
  {
    id: 'antecedentes-ic-sospecha',
    seccion: 'Antecedentes',
    campoLabel: 'Insuficiencia cardíaca',
    icd10: 'I50',
    textoDocumento:
      'Fármacos habituales: metformina y furosemida 40 mg/día. No se menciona insuficiencia cardíaca en el documento.',
    evidenciaResaltada: 'furosemida 40 mg/día',
    respuesta: {
      valor: 'ns',
      sospecha: 'Bajo',
      comentario: 'Solo furosemida habitual, sin diagnóstico explícito de IC.',
    },
    explicacion:
      'Un diurético aislado no basta para afirmar insuficiencia cardíaca. Se marca ? y, en "Incertidumbre", se elige Bajo, dejando un comentario.',
  },
  {
    id: 'soporte-vmi',
    seccion: 'Soporte / intervenciones',
    campoLabel: 'Ventilación mecánica invasiva',
    textoDocumento:
      'EVOLUCIÓN UCI: ingresa intubado por compromiso de conciencia; se conecta a ventilación mecánica invasiva en modo VCV.',
    evidenciaResaltada: 'se conecta a ventilación mecánica invasiva',
    respuesta: {
      valor: 'si',
      evidencia: 'se conecta a ventilación mecánica invasiva',
    },
    explicacion:
      'Hay intubación con conexión a ventilador. Se marca Sí y se captura el fragmento que lo documenta.',
  },
  {
    id: 'infecciones-sepsis',
    seccion: 'Infecciones',
    campoLabel: 'Sepsis o shock séptico',
    textoDocumento:
      'MICROBIOLOGÍA: hemocultivos positivos para S. aureus; el cuadro se interpreta como sepsis y se trata con vancomicina.',
    evidenciaResaltada: 'el cuadro se interpreta como sepsis',
    respuesta: {
      valor: 'si',
      evidencia: 'el cuadro se interpreta como sepsis',
    },
    explicacion:
      'Hay diagnóstico explícito de sepsis con respaldo microbiológico. Se marca Sí y se captura la evidencia.',
  },
  {
    id: 'falla-renal-aguda',
    seccion: 'Falla orgánica',
    campoLabel: 'Falla renal aguda',
    textoDocumento:
      'EVOLUCIÓN: presenta oliguria progresiva y alza de creatinina hasta 3,2 mg/dL, en rango de injuria renal aguda (AKI), sin antecedente de enfermedad renal previa.',
    evidenciaResaltada: 'alza de creatinina hasta 3,2 mg/dL, en rango de injuria renal aguda (AKI)',
    respuesta: {
      valor: 'si',
      evidencia: 'alza de creatinina hasta 3,2 mg/dL, en rango de injuria renal aguda (AKI)',
    },
    explicacion:
      'Es una injuria renal aguda intrahospitalaria (distinta de la enfermedad renal crónica previa, que iría en Antecedentes). Se marca Sí y se captura la evidencia.',
  },
  {
    id: 'complicaciones-delirium',
    seccion: 'Complicaciones',
    campoLabel: 'Delirium',
    textoDocumento:
      'Al 5º día de UCI desarrolla agitación psicomotora fluctuante; CAM-ICU positivo, interpretado como delirium hiperactivo.',
    evidenciaResaltada: 'CAM-ICU positivo, interpretado como delirium hiperactivo',
    respuesta: {
      valor: 'si',
      evidencia: 'CAM-ICU positivo, interpretado como delirium hiperactivo',
    },
    explicacion:
      'Hay diagnóstico explícito de delirium (CAM-ICU positivo). Se marca Sí y se captura la evidencia.',
  },
  {
    id: 'egreso-reingreso',
    seccion: 'Egreso',
    campoLabel: 'Reingreso a UPC durante la hospitalización',
    textoDocumento:
      'Tras el alta a sala común, reingresa a UPC a las 48 horas por insuficiencia respiratoria aguda.',
    evidenciaResaltada: 'reingresa a UPC a las 48 horas',
    respuesta: {
      valor: 'si',
      evidencia: 'reingresa a UPC a las 48 horas',
    },
    explicacion:
      'El reingreso a la unidad durante la misma hospitalización está documentado. Se marca Sí y se captura la evidencia.',
  },
]
