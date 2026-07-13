import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuiaMockBusqueda from './GuiaMockBusqueda.vue'

describe('GuiaMockBusqueda (guía 2.2)', () => {
  it('muestra los campos anidados por defecto', () => {
    const wrapper = mount(GuiaMockBusqueda)
    const text = wrapper.text()
    expect(text).toContain('Antecedentes')
    expect(text).toContain('Hipertensión arterial')
    expect(text).toContain('Diabetes mellitus')
  })

  it('filtra los campos al buscar (ignorando tildes/mayúsculas)', async () => {
    const wrapper = mount(GuiaMockBusqueda)
    await wrapper.find('input').setValue('diabetes')
    const text = wrapper.text()
    expect(text).toContain('Diabetes mellitus')
    expect(text).not.toContain('Hipertensión arterial')
  })

  it('muestra un mensaje cuando no hay resultados', async () => {
    const wrapper = mount(GuiaMockBusqueda)
    await wrapper.find('input').setValue('zzzz')
    expect(wrapper.text()).toMatch(/sin resultados/i)
  })
})
