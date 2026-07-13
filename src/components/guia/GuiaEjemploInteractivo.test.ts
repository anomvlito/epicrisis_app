import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuiaEjemploInteractivo from './GuiaEjemploInteractivo.vue'
import { GUIA_EJEMPLOS } from '@/constants/guiaEjemplos'

const ejemploNs = GUIA_EJEMPLOS.find((e) => e.respuesta.valor === 'ns')!
const ejemploSi = GUIA_EJEMPLOS.find((e) => e.respuesta.valor === 'si')!

describe('guiaEjemplos (datos, HU-034)', () => {
  it('hay al menos un ejemplo y cubren Sí, No y ?', () => {
    const valores = new Set(GUIA_EJEMPLOS.map((e) => e.respuesta.valor))
    expect(GUIA_EJEMPLOS.length).toBeGreaterThan(0)
    expect(valores.has('si')).toBe(true)
    expect(valores.has('no')).toBe(true)
    expect(valores.has('ns')).toBe(true)
  })

  it('la evidencia resaltada es substring exacto del texto del documento', () => {
    for (const e of GUIA_EJEMPLOS) {
      expect(e.textoDocumento.includes(e.evidenciaResaltada)).toBe(true)
    }
  })

  it('todo ejemplo con valor ? define su sospecha clínica', () => {
    for (const e of GUIA_EJEMPLOS.filter((x) => x.respuesta.valor === 'ns')) {
      expect(e.respuesta.sospecha).toBeTruthy()
    }
  })
})

describe('GuiaEjemploInteractivo (HU-034)', () => {
  it('la respuesta correcta está oculta hasta pulsar "Ver respuesta correcta"', async () => {
    const wrapper = mount(GuiaEjemploInteractivo, { props: { ejemplo: ejemploSi } })
    expect(wrapper.find('[data-respuesta]').exists()).toBe(false)
    const revelar = wrapper.findAll('button').find((b) => b.text().includes('Ver respuesta correcta'))!
    await revelar.trigger('click')
    expect(wrapper.find('[data-respuesta]').exists()).toBe(true)
    expect(wrapper.text()).toContain(ejemploSi.explicacion)
  })

  it('marcar ? muestra el desplegable de Incertidumbre (como el form real)', async () => {
    const wrapper = mount(GuiaEjemploInteractivo, { props: { ejemplo: ejemploNs } })
    expect(wrapper.find('select').exists()).toBe(false)
    const btnNs = wrapper.findAll('button').find((b) => b.text() === '?')!
    await btnNs.trigger('click')
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.text()).toContain('Incertidumbre')
  })

  it('capturar copia la evidencia seleccionada al bloque de ground truth', async () => {
    const wrapper = mount(GuiaEjemploInteractivo, { props: { ejemplo: ejemploSi } })
    // marcar Sí para mostrar el bloque de evidencia
    await wrapper.findAll('button').find((b) => b.text() === 'Sí')!.trigger('click')
    // seleccionar el fragmento resaltado en el documento
    await wrapper.get('p.font-mono button').trigger('click')
    // capturar
    await wrapper.findAll('button').find((b) => b.text() === 'Capturar')!.trigger('click')
    expect(wrapper.text()).toContain(ejemploSi.evidenciaResaltada)
  })
})
