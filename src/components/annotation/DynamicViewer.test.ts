import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DynamicViewer from './DynamicViewer.vue'

// jsdom no implementa scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = () => {}
})

const LAYOUT = {
  pages: [
    {
      html: `
        <span class="pdf-span">Paciente con Disnea de reposo</span>
        <span class="pdf-span">Ingresa por DISNEA progresiva</span>
        <span class="pdf-span">Sin dolor toracico</span>
        <span class="pdf-span">Evolución favorable</span>
      `,
    },
  ],
}

function mountViewer(searchQuery = '') {
  return mount(DynamicViewer, {
    props: { layoutData: LAYOUT, searchQuery },
    attachTo: document.body,
  })
}

function highlighted(wrapper: any) {
  return wrapper.findAll('.search-highlight')
}

describe('HU-046 — búsqueda en DynamicViewer', () => {
  it('cuenta y resalta las coincidencias', async () => {
    const wrapper = mountViewer()
    await wrapper.setProps({ searchQuery: 'disnea' })

    expect(wrapper.vm.matchCount).toBe(2)
    expect(highlighted(wrapper)).toHaveLength(2)
  })

  it('ignora mayúsculas y tildes', async () => {
    const wrapper = mountViewer()
    await wrapper.setProps({ searchQuery: 'EVOLUCION' })

    expect(wrapper.vm.matchCount).toBe(1)
  })

  it('un término inexistente no da coincidencias', async () => {
    const wrapper = mountViewer()
    await wrapper.setProps({ searchQuery: 'neumotorax' })

    expect(wrapper.vm.matchCount).toBe(0)
    expect(highlighted(wrapper)).toHaveLength(0)
  })

  it('menos de 2 caracteres no busca', async () => {
    const wrapper = mountViewer()
    await wrapper.setProps({ searchQuery: 'd' })

    expect(wrapper.vm.matchCount).toBe(0)
  })

  it('limpiar la consulta quita los resaltados', async () => {
    const wrapper = mountViewer()
    await wrapper.setProps({ searchQuery: 'disnea' })
    expect(highlighted(wrapper)).toHaveLength(2)

    await wrapper.setProps({ searchQuery: '' })

    expect(wrapper.vm.matchCount).toBe(0)
    expect(highlighted(wrapper)).toHaveLength(0)
  })

  it('scrollToMatch marca cuál es la coincidencia activa', async () => {
    const wrapper = mountViewer()
    await wrapper.setProps({ searchQuery: 'disnea' })

    wrapper.vm.scrollToMatch(1)
    await wrapper.vm.$nextTick()

    const activas = wrapper.findAll('.search-highlight-active')
    expect(activas).toHaveLength(1)
    expect(activas[0]!.text()).toContain('DISNEA')
  })

  it('el naranjo de la activa NO sobrevive a un cambio de búsqueda', async () => {
    const wrapper = mountViewer()
    await wrapper.setProps({ searchQuery: 'disnea' })
    wrapper.vm.scrollToMatch(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.search-highlight-active')).toHaveLength(1)

    // otra consulta, que no toca los mismos spans
    await wrapper.setProps({ searchQuery: 'toracico' })

    const activas = wrapper.findAll('.search-highlight-active')
    expect(activas).toHaveLength(0)
  })

  it('el naranjo de la activa NO sobrevive a limpiar la búsqueda', async () => {
    const wrapper = mountViewer()
    await wrapper.setProps({ searchQuery: 'disnea' })
    wrapper.vm.scrollToMatch(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.search-highlight-active')).toHaveLength(1)

    await wrapper.setProps({ searchQuery: '' })

    expect(wrapper.findAll('.search-highlight-active')).toHaveLength(0)
    expect(wrapper.findAll('.search-highlight')).toHaveLength(0)
  })

  it('expone la misma interfaz que PdfViewer', () => {
    const wrapper = mountViewer()
    expect(wrapper.vm.matchCount).toBeDefined()
    expect(typeof wrapper.vm.scrollToMatch).toBe('function')
    expect(wrapper.vm.containerRef).toBeTruthy()
  })
})
