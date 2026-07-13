import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuiaMockCaptura from './GuiaMockCaptura.vue'

describe('GuiaMockCaptura (guía 2.3)', () => {
  it('captura la evidencia al seleccionar el fragmento y presionar Capturar', async () => {
    const wrapper = mount(GuiaMockCaptura)
    const fragmento = 'hipertensión arterial en tratamiento con losartán'

    // sin seleccionar, Capturar está deshabilitado
    const capturar = wrapper.findAll('button').find((b) => b.text() === 'Capturar')!
    expect(capturar.attributes('disabled')).toBeDefined()

    // clic en el fragmento del documento
    const target = wrapper.findAll('button').find((b) => b.text() === fragmento)!
    await target.trigger('click')

    // ahora se puede capturar
    const capturar2 = wrapper.findAll('button').find((b) => b.text() === 'Capturar')!
    expect(capturar2.attributes('disabled')).toBeUndefined()
    await capturar2.trigger('click')

    // la evidencia queda registrada
    expect(wrapper.text()).toContain(fragmento)
    expect(wrapper.text()).not.toContain('Selecciona texto en el documento')
  })

  it('permite limpiar la evidencia capturada', async () => {
    const wrapper = mount(GuiaMockCaptura)
    const fragmento = 'hipertensión arterial en tratamiento con losartán'
    await wrapper.findAll('button').find((b) => b.text() === fragmento)!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'Capturar')!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'limpiar')!.trigger('click')
    expect(wrapper.text()).toContain('Selecciona texto en el documento')
  })
})
