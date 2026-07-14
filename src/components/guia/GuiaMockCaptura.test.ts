import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import GuiaMockCaptura from './GuiaMockCaptura.vue'

const addBtn = (w: any) => w.findAll('button').find((b: any) => b.attributes('title') === 'Agregar otro fragmento')!
const lockBtns = (w: any) => w.findAll('button').filter((b: any) => (b.attributes('title') || '').toLowerCase().includes('casilla'))
const removeBtns = (w: any) => w.findAll('button').filter((b: any) => b.attributes('title') === 'Eliminar este fragmento')
const capturarBtn = (w: any) => w.findAll('button').find((b: any) => b.text() === 'Capturar')!

describe('GuiaMockCaptura (guía 2.3 — múltiples evidencias)', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('captura el fragmento seleccionado en la casilla activa', async () => {
    const wrapper = mount(GuiaMockCaptura)
    // seleccionar un fragmento del documento
    const frag = wrapper.findAll('button').find((b) => b.text().includes('hipertensión arterial'))!
    await frag.trigger('click')
    await capturarBtn(wrapper).trigger('click')
    expect(wrapper.text()).toContain('hipertensión arterial en tratamiento con losartán')
  })

  it('la casilla principal no tiene botón eliminar; [+] agrega una secundaria que sí', async () => {
    const wrapper = mount(GuiaMockCaptura)
    expect(removeBtns(wrapper)).toHaveLength(0)
    await addBtn(wrapper).trigger('click')
    expect(removeBtns(wrapper)).toHaveLength(1)
    await removeBtns(wrapper)[0].trigger('click')
    expect(removeBtns(wrapper)).toHaveLength(0)
  })

  it('una casilla cerrada (candado) no recibe la captura', async () => {
    const wrapper = mount(GuiaMockCaptura)
    // capturar en la principal y cerrarla
    const frag = wrapper.findAll('button').find((b) => b.text().includes('hipertensión arterial'))!
    await frag.trigger('click')
    await capturarBtn(wrapper).trigger('click')
    await lockBtns(wrapper)[0].trigger('click')
    // seleccionar otro fragmento e intentar capturar: el botón queda deshabilitado
    const frag2 = wrapper.findAll('button').find((b) => b.text().includes('diabetes mellitus'))!
    await frag2.trigger('click')
    expect(capturarBtn(wrapper).attributes('disabled')).toBeDefined()
  })
})
