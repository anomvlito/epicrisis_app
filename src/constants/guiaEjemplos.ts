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
      'Un diurético aislado no basta para afirmar insuficiencia cardíaca. Se marca ? y, en "Sospecha clínica", se elige Bajo, dejando un comentario.',
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
]
