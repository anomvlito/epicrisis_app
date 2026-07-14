import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AnnotationEvidence from './AnnotationEvidence.vue'
import { useAnnotationStore } from '@/stores/annotation'

const KEY = 'antecedentes.cardiovascular.hipertension_arterial'

function mountFor() {
  const store = useAnnotationStore()
  store.initForEpicrisis(1, null)
  const wrapper = mount(AnnotationEvidence, { props: { nodeKey: KEY } })
  return { store, wrapper }
}

const removeBtns = (w: any) => w.findAll('button').filter((b: any) => b.attributes('title') === 'Eliminar este fragmento')
const addBtn = (w: any) => w.findAll('button').find((b: any) => b.attributes('title') === 'Agregar otro fragmento de evidencia')!
const lockBtns = (w: any) => w.findAll('button').filter((b: any) => (b.attributes('title') || '').includes('casilla') || (b.attributes('title') || '').includes('Casilla'))

describe('AnnotationEvidence (HU-029)', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

  it('muestra la casilla principal editable y sin botón de eliminar', () => {
    const { wrapper } = mountFor()
    expect(wrapper.findAll('textarea')).toHaveLength(1)
    expect(removeBtns(wrapper)).toHaveLength(0)
  })

  it('[+] agrega una casilla secundaria con su botón de eliminar', async () => {
    const { wrapper } = mountFor()
    await addBtn(wrapper).trigger('click')
    expect(wrapper.findAll('textarea')).toHaveLength(2)
    expect(removeBtns(wrapper)).toHaveLength(1) // solo la secundaria
  })

  it('[-] elimina la casilla secundaria', async () => {
    const { wrapper } = mountFor()
    await addBtn(wrapper).trigger('click')
    await removeBtns(wrapper)[0].trigger('click')
    expect(wrapper.findAll('textarea')).toHaveLength(1)
    expect(removeBtns(wrapper)).toHaveLength(0)
  })

  it('el candado cerrado pasa la casilla a solo lectura (sin textarea)', async () => {
    const { store, wrapper } = mountFor()
    store.setActiveEvidence(KEY, 0)
    store.injectEvidenceToActive('evidencia confirmada')
    await wrapper.vm.$nextTick()
    // cerrar el candado de la casilla principal
    await lockBtns(wrapper)[0].trigger('click')
    expect(wrapper.findAll('textarea')).toHaveLength(0)
    expect(wrapper.text()).toContain('evidencia confirmada')
  })
})
