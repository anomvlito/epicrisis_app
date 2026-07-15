import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GlosarioTree from './GlosarioTree.vue'

const nodes = [
  {
    id: '2', key: 'antecedentes', label: 'Antecedentes', type: 'mother' as const,
    children: [
      {
        id: '2.1', key: 'antecedentes.hta', label: 'Hipertensión arterial', type: 'leaf' as const,
        definitionMarkdown: 'Presión alta', definitionHtml: '<p>Presión arterial elevada</p>',
      },
    ],
  },
]

describe('GlosarioTree', () => {
  it('renderiza la jerarquía y las definiciones', () => {
    const wrapper = mount(GlosarioTree, { props: { nodes } })
    expect(wrapper.text()).toContain('Antecedentes')
    expect(wrapper.text()).toContain('Hipertensión arterial')
    expect(wrapper.text()).toContain('Presión arterial elevada')
  })

  it('sin collapsible no hay chevron y los hijos están siempre visibles', () => {
    const wrapper = mount(GlosarioTree, { props: { nodes } })
    expect(wrapper.find('svg').exists()).toBe(false) // no hay chevron
    expect(wrapper.text()).toContain('Presión arterial elevada')
  })

  it('con collapsible, al hacer clic en la cabecera colapsa/expande los hijos', async () => {
    const wrapper = mount(GlosarioTree, { props: { nodes, collapsible: true } })
    // visible por defecto
    expect(wrapper.text()).toContain('Presión arterial elevada')
    // clic en la cabecera "Antecedentes" (el botón colapsable)
    const header = wrapper.findAll('button').find((b) => b.text().includes('Antecedentes'))!
    await header.trigger('click')
    expect(wrapper.text()).not.toContain('Presión arterial elevada')
    // clic de nuevo → vuelve a expandir
    await header.trigger('click')
    expect(wrapper.text()).toContain('Presión arterial elevada')
  })
})
