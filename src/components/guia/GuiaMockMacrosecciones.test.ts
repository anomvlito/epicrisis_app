import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuiaMockMacrosecciones from './GuiaMockMacrosecciones.vue'
import { FORM_SCHEMA } from '@/constants/formSchema'

describe('GuiaMockMacrosecciones (guía 2.1)', () => {
  it('lista todas las macrosecciones derivadas del formSchema', () => {
    const wrapper = mount(GuiaMockMacrosecciones)
    const text = wrapper.text()
    for (const bloque of FORM_SCHEMA) {
      expect(text).toContain(bloque.label)
    }
  })

  it('no contiene emojis ni glifos', () => {
    const wrapper = mount(GuiaMockMacrosecciones)
    // rango de emojis/flechas/checks — la guía debe estar libre de glifos
    expect(wrapper.text()).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/u)
  })
})
