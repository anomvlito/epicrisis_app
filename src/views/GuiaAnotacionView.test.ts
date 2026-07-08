import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuiaAnotacionView from './GuiaAnotacionView.vue'
import GuiaValuePill from '@/components/guia/GuiaValuePill.vue'

// HU-034 — la vista es un manual de solo lectura. Estos tests ejercen que el
// contenido refleje el comportamiento ACTUAL de la app y que el índice navegable
// tenga anclas reales para cada sección.

const ANCHORS = ['objetivo', 'plataforma', 'protocolo', 'valores', 'dificiles', 'flujo', 'referencia']

describe('GuiaAnotacionView (HU-034)', () => {
  it('renderiza una sección con ancla por cada entrada del índice', () => {
    const wrapper = mount(GuiaAnotacionView)
    for (const anchor of ANCHORS) {
      expect(wrapper.find(`section#${anchor}`).exists()).toBe(true)
      // el TOC enlaza a esa ancla
      expect(wrapper.find(`a[href="#${anchor}"]`).exists()).toBe(true)
    }
  })

  it('documenta los tres valores actuales Sí / No / ?', () => {
    const wrapper = mount(GuiaAnotacionView)
    const pills = wrapper.findAllComponents(GuiaValuePill)
    const variants = new Set(pills.map((p) => p.props('variant')))
    expect(variants.has('si')).toBe(true)
    expect(variants.has('no')).toBe(true)
    expect(variants.has('ns')).toBe(true)
  })

  it('exige comentario obligatorio al marcar ?', () => {
    const wrapper = mount(GuiaAnotacionView)
    expect(wrapper.text()).toMatch(/comentario obligatorio/i)
  })

  it('NO menciona mecanismos deprecados (semáforo / dificultad / ¿qué costó?)', () => {
    const wrapper = mount(GuiaAnotacionView)
    const text = wrapper.text().toLowerCase()
    expect(text).not.toContain('semáforo')
    expect(text).not.toContain('dificultad')
    expect(text).not.toContain('¿qué costó')
  })
})
