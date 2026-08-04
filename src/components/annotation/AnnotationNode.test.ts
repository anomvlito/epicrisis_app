import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AnnotationNode from './AnnotationNode.vue'
import { useAnnotationStore } from '@/stores/annotation'
import { FORM_SCHEMA } from '@/constants/formSchema'
import type { FormNode } from '@/constants/formSchema'

function block(id: string): FormNode {
  const node = FORM_SCHEMA.find((n) => n.id === id)
  if (!node) throw new Error(`No existe el bloque ${id}`)
  return node
}

function mountBlock(id: string, isReadOnly = false) {
  const store = useAnnotationStore()
  store.initForEpicrisis(1, null)
  const wrapper = mount(AnnotationNode, {
    props: { node: block(id), isReadOnly, depth: 0 },
    // Sin stub, la <Transition> de la caja de evidencia nunca termina su salida en
    // jsdom y el display:none del v-show no llega a aplicarse.
    global: { stubs: { transition: true } },
  })
  return { wrapper, store }
}

// El toggle de cabecera de la madre es el primer par [Sí]/[No] del componente.
// Los hijos leaf tienen su propio toggle, así que contamos por texto exacto.
function toggleButtons(wrapper: any) {
  return wrapper.findAll('button').filter((b: any) => b.text() === 'Sí' || b.text() === 'No')
}

function headerToggle(wrapper: any) {
  const header = wrapper.find('.cursor-pointer')
  return header.findAll('button').filter((b: any) => b.text() === 'Sí' || b.text() === 'No')
}

describe('HU-042 — bloques sin toggle Sí|No de cabecera', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

  it('Bloque 1 (solo fechas) no muestra el toggle de cabecera', () => {
    const { wrapper } = mountBlock('1')
    expect(headerToggle(wrapper)).toHaveLength(0)
    // ...y tampoco lo tiene ningún hijo: el bloque queda sin ningún Sí|No
    expect(toggleButtons(wrapper)).toHaveLength(0)
  })

  it('Bloque 9 (calidad global) no muestra el toggle de cabecera', () => {
    const { wrapper } = mountBlock('9')
    expect(headerToggle(wrapper)).toHaveLength(0)
    expect(toggleButtons(wrapper)).toHaveLength(0)
  })

  it('Bloque 8 (Egreso) pierde el toggle de cabecera pero conserva el de 8.5 Reingreso', () => {
    const { wrapper } = mountBlock('8')
    expect(headerToggle(wrapper)).toHaveLength(0)
    // 8.5 es un leaf: mantiene su toggle de 3 estados
    const reingreso = wrapper.find('[data-criterion="egreso.reingreso_upc"]')
    expect(reingreso.exists()).toBe(true)
    const propios = reingreso.findAll('button').filter((b: any) => b.text() === 'Sí' || b.text() === 'No')
    expect(propios).toHaveLength(2)
  })

  it('Bloque 2 (Antecedentes) conserva su toggle de cabecera', () => {
    const { wrapper } = mountBlock('2')
    expect(headerToggle(wrapper)).toHaveLength(2)
  })

  it('el contenido del Bloque 8 sigue visible sin el toggle', () => {
    const { wrapper } = mountBlock('8')
    expect(wrapper.text()).toContain('Fecha de egreso de UPC')
    expect(wrapper.text()).toContain('Diagnóstico de egreso de UPC')
  })
})

describe('HU-043 — un "No" no pide evidencia', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

  const DELIRIUM = 'complicaciones.delirium'

  // `isVisible()` de VTU no ve el display:none que aplica v-show cuando el nodo
  // cuelga del stub de <Transition>; leemos el estilo inline, que es lo que v-show escribe.
  function evidenceVisible(wrapper: any, key: string): boolean {
    const box = wrapper.find(`[data-criterion="${key}"]`).find('[data-testid="evidence-box"]')
    if (!box.exists()) return false
    return !(box.attributes('style') ?? '').includes('display: none')
  }

  function pressIn(wrapper: any, key: string, label: string) {
    const row = wrapper.find(`[data-criterion="${key}"]`)
    return row.findAll('button').find((b: any) => b.text() === label)!
  }

  it('marcar No oculta la caja de evidencia', async () => {
    const { wrapper } = mountBlock('7')
    await pressIn(wrapper, DELIRIUM, 'No').trigger('click')
    expect(evidenceVisible(wrapper, DELIRIUM)).toBe(false)
  })

  it('marcar Sí sí muestra la caja de evidencia', async () => {
    const { wrapper } = mountBlock('7')
    await pressIn(wrapper, DELIRIUM, 'Sí').trigger('click')
    expect(evidenceVisible(wrapper, DELIRIUM)).toBe(true)
  })

  it('marcar ? sí muestra la caja de evidencia', async () => {
    const { wrapper } = mountBlock('7')
    await pressIn(wrapper, DELIRIUM, '?').trigger('click')
    expect(evidenceVisible(wrapper, DELIRIUM)).toBe(true)
  })

  it('pasar de Sí con evidencia a No oculta la caja', async () => {
    const { wrapper, store } = mountBlock('7')
    await pressIn(wrapper, DELIRIUM, 'Sí').trigger('click')
    store.criteria.find((c) => c.criterionName === DELIRIUM)!.evidenceText = 'CAM-ICU positivo'
    await wrapper.vm.$nextTick()
    expect(evidenceVisible(wrapper, DELIRIUM)).toBe(true)

    await pressIn(wrapper, DELIRIUM, 'No').trigger('click')

    expect(evidenceVisible(wrapper, DELIRIUM)).toBe(false)
  })

})

describe('HU-044 — candado, reset y auto-candado', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

  const HTA = 'antecedentes.cardiovascular.hipertension_arterial'

  const resetBtn = (w: any) => w.find('[data-testid="reset-button"]')
  const lockBtn = (w: any) => w.find('[data-testid="lock-button"]')

  function pressIn(wrapper: any, key: string, label: string) {
    return wrapper.find(`[data-criterion="${key}"]`).findAll('button')
      .find((b: any) => b.text() === label)!
  }

  it('los nodos con hijos muestran reset y candado en la cabecera', () => {
    const { wrapper } = mountBlock('7')
    const header = wrapper.find('.cursor-pointer')
    expect(header.find('[data-testid="reset-button"]').exists()).toBe(true)
    expect(header.find('[data-testid="lock-button"]').exists()).toBe(true)
  })

  it('las hojas no tienen candado propio ni reset', () => {
    const { wrapper } = mountBlock('7')
    const fila = wrapper.find('[data-criterion="complicaciones.delirium"]')
    expect(fila.find('[data-testid="lock-button"]').exists()).toBe(false)
    expect(fila.find('[data-testid="reset-button"]').exists()).toBe(false)
  })

  it('ninguno de los dos aparece en modo solo lectura', () => {
    const { wrapper } = mountBlock('7', true)
    expect(resetBtn(wrapper).exists()).toBe(false)
    expect(lockBtn(wrapper).exists()).toBe(false)
  })

  it('el candado alterna el estado en el store', async () => {
    const { wrapper, store } = mountBlock('7')
    expect(store.isLocked('complicaciones')).toBe(false)

    await lockBtn(wrapper).trigger('click')
    expect(store.isLocked('complicaciones')).toBe(true)

    await lockBtn(wrapper).trigger('click')
    expect(store.isLocked('complicaciones')).toBe(false)
  })

  it('el reset deja en blanco lo de abajo', async () => {
    const { wrapper, store } = mountBlock('7')
    await pressIn(wrapper, 'complicaciones.delirium', 'Sí').trigger('click')
    expect(store.criteria.find((c) => c.criterionName === 'complicaciones.delirium')!.isPresent).toBe(true)

    await resetBtn(wrapper).trigger('click')

    expect(store.criteria.find((c) => c.criterionName === 'complicaciones.delirium')!.isPresent).toBeNull()
  })

  it('el auto-candado se muestra en una hoja en Sí y desaparece al pasar a No', async () => {
    const { wrapper } = mountBlock('2')
    const fila = () => wrapper.find(`[data-criterion="${HTA}"]`)
    expect(fila().find('[data-testid="auto-lock-badge"]').exists()).toBe(false)

    await pressIn(wrapper, HTA, 'Sí').trigger('click')
    expect(fila().find('[data-testid="auto-lock-badge"]').exists()).toBe(true)

    await pressIn(wrapper, HTA, 'No').trigger('click')
    expect(fila().find('[data-testid="auto-lock-badge"]').exists()).toBe(false)
  })

  it('el auto-candado también aparece con ?', async () => {
    const { wrapper } = mountBlock('2')
    await pressIn(wrapper, HTA, '?').trigger('click')
    expect(wrapper.find(`[data-criterion="${HTA}"]`).find('[data-testid="auto-lock-badge"]').exists()).toBe(true)
  })

  it('reset y candado no mueven el acordeón', async () => {
    const { wrapper } = mountBlock('7')
    const kids = () => wrapper.find('[data-testid="mother-children"]')
    expect(kids().attributes('style')).not.toContain('display: none')

    resetBtn(wrapper).element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(kids().attributes('style')).not.toContain('display: none')

    lockBtn(wrapper).element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(kids().attributes('style')).not.toContain('display: none')
  })

  it('el invariante promueve la sección al marcar una hoja en Sí', async () => {
    const { wrapper, store } = mountBlock('2')
    await pressIn(wrapper, HTA, 'Sí').trigger('click')

    expect(store.criteria.find((c) => c.criterionName === 'antecedentes.cardiovascular')!.isPresent).toBe(true)
    expect(store.criteria.find((c) => c.criterionName === 'antecedentes')!.isPresent).toBe(true)
  })
})
