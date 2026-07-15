import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useEpicrisisAlias, getEpicrisisAlias } from './useEpicrisisAlias'

describe('useEpicrisisAlias (HU-040)', () => {
  beforeEach(() => localStorage.clear())

  it('sin alias devuelve cadena vacía', () => {
    expect(getEpicrisisAlias(7)).toBe('')
  })

  it('escribir el alias lo persiste en localStorage', async () => {
    const { alias } = useEpicrisisAlias(7)
    alias.value = 'Caso complejo sepsis'
    await nextTick()
    expect(localStorage.getItem('epicrisis_alias_7')).toBe('Caso complejo sepsis')
    expect(getEpicrisisAlias(7)).toBe('Caso complejo sepsis')
  })

  it('carga el alias existente y al vaciarlo lo elimina', async () => {
    localStorage.setItem('epicrisis_alias_7', 'algo')
    const { alias } = useEpicrisisAlias(7)
    expect(alias.value).toBe('algo')
    alias.value = '   '
    await nextTick()
    expect(localStorage.getItem('epicrisis_alias_7')).toBeNull()
  })

  it('es independiente por id de epicrisis', async () => {
    const a = useEpicrisisAlias(1)
    const b = useEpicrisisAlias(2)
    a.alias.value = 'uno'
    b.alias.value = 'dos'
    await nextTick()
    expect(getEpicrisisAlias(1)).toBe('uno')
    expect(getEpicrisisAlias(2)).toBe('dos')
  })
})
