import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuiaMockPantalla from './GuiaMockPantalla.vue'

describe('GuiaMockPantalla (guía 2.1)', () => {
  it('muestra los campos anidados por defecto', () => {
    const wrapper = mount(GuiaMockPantalla)
    const arbol = wrapper.get('[data-arbol]').text()
    expect(arbol).toContain('Antecedentes')
    expect(arbol).toContain('Hipertensión arterial')
    expect(arbol).toContain('Diabetes mellitus')
  })

  it('filtra los campos al buscar (ignorando tildes/mayúsculas)', async () => {
    const wrapper = mount(GuiaMockPantalla)
    await wrapper.find('input').setValue('diabetes')
    // acotado al árbol de campos (el documento de ejemplo también menciona HTA)
    const arbol = wrapper.get('[data-arbol]').text()
    expect(arbol).toContain('Diabetes mellitus')
    expect(arbol).not.toContain('Hipertensión arterial')
  })

  it('muestra un mensaje cuando no hay resultados', async () => {
    const wrapper = mount(GuiaMockPantalla)
    await wrapper.find('input').setValue('zzzz')
    expect(wrapper.text()).toMatch(/sin resultados/i)
  })

  it('no contiene emojis ni glifos', () => {
    const wrapper = mount(GuiaMockPantalla)
    expect(wrapper.text()).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/u)
  })
})
