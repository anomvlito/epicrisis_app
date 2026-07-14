import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuiaMockFecha from './GuiaMockFecha.vue'

describe('GuiaMockFecha (guía 2.4)', () => {
  it('muestra el campo "Fecha de ingreso al hospital"', () => {
    const wrapper = mount(GuiaMockFecha)
    expect(wrapper.text()).toContain('Fecha de ingreso al hospital')
    expect(wrapper.find('input').attributes('placeholder')).toBe('DD/MM/AAAA')
  })

  it('rellena el campo al hacer clic en la fecha del documento', async () => {
    const wrapper = mount(GuiaMockFecha)
    const input = wrapper.find('input').element as HTMLInputElement
    expect(input.value).toBe('')
    const fechaBtn = wrapper.findAll('button').find((b) => b.text().includes('12/03/2026'))!
    await fechaBtn.trigger('click')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('12/03/2026')
  })
})
