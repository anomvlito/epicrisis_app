import { ref, watch } from 'vue'

// HU-040: nombre privado (alias) del anotador para reconocer una epicrisis.
// Vive solo en localStorage (por-dispositivo), nunca se envía al backend.
const aliasKey = (id: number) => `epicrisis_alias_${id}`

/** Lectura puntual del alias (para mostrar en tarjetas del dashboard). */
export function getEpicrisisAlias(id: number): string {
  try {
    return localStorage.getItem(aliasKey(id)) || ''
  } catch {
    return ''
  }
}

/** Alias reactivo y editable (para el encabezado de la vista de anotación). */
export function useEpicrisisAlias(id: number) {
  const alias = ref(getEpicrisisAlias(id))
  watch(alias, (v) => {
    const k = aliasKey(id)
    const t = (v || '').trim()
    try {
      if (t) localStorage.setItem(k, t)
      else localStorage.removeItem(k)
    } catch {
      // localStorage no disponible (p. ej. modo restringido): se ignora en silencio.
    }
  })
  return { alias }
}
