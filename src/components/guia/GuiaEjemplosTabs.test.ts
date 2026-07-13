import { describe, it, expect, beforeAll, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import GuiaEjemplosTabs from './GuiaEjemplosTabs.vue'
import GuiaEjemploInteractivo from './GuiaEjemploInteractivo.vue'
import { GUIA_EJEMPLOS } from '@/constants/guiaEjemplos'

describe('GuiaEjemplosTabs (HU-034)', () => {
  beforeAll(() => {
    // jsdom no implementa scrollIntoView; lo mockeamos para verificar el auto-scroll.
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('muestra una pestaña por ejemplo y solo un ejemplo activo a la vez', () => {
    const wrapper = mount(GuiaEjemplosTabs, { props: { ejemplos: GUIA_EJEMPLOS } })
    expect(wrapper.findAll('[data-ejemplos-tabs] button').length).toBe(GUIA_EJEMPLOS.length)
    // solo hay un ejemplo interactivo renderizado (no todos apilados)
    expect(wrapper.findAllComponents(GuiaEjemploInteractivo).length).toBe(1)
    expect(wrapper.findComponent(GuiaEjemploInteractivo).props('ejemplo').id).toBe(GUIA_EJEMPLOS[0].id)
  })

  it('al hacer clic en una pestaña cambia el ejemplo mostrado', async () => {
    const wrapper = mount(GuiaEjemplosTabs, { props: { ejemplos: GUIA_EJEMPLOS } })
    const tabs = wrapper.findAll('[data-ejemplos-tabs] button')
    await tabs[2].trigger('click')
    expect(wrapper.findComponent(GuiaEjemploInteractivo).props('ejemplo').id).toBe(GUIA_EJEMPLOS[2].id)
    expect(wrapper.text()).toContain(`3 / ${GUIA_EJEMPLOS.length}`)
  })

  it('el botón Anterior se deshabilita en la primera pestaña', () => {
    const wrapper = mount(GuiaEjemplosTabs, { props: { ejemplos: GUIA_EJEMPLOS } })
    const anterior = wrapper.findAll('button').find((b) => b.text().includes('Anterior'))!
    expect(anterior.attributes('disabled')).toBeDefined()
  })

  it('desplaza la pestaña activa a la vista al navegar con Siguiente', async () => {
    const wrapper = mount(GuiaEjemplosTabs, { props: { ejemplos: GUIA_EJEMPLOS } })
    ;(Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mockClear()
    const siguiente = wrapper.findAll('button').find((b) => b.text().includes('Siguiente'))!
    await siguiente.trigger('click')
    await flushPromises()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })
})
