import { test, expect } from '@playwright/test'

async function mockBaseRoutes(page: any, overrides: { annotations?: any[]; clinicalData?: any } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock-token')
  })

  await page.route('**/api/auth', async (route: any) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { user: { id: 1, email: 'tester@epicrisis.cl', role: 'annotator', termsAcceptedAt: '2026-05-01T00:00:00Z' } } })
    } else route.continue()
  })

  await page.route('**/api/epicrisis?id=1', async (route: any) => {
    await route.fulfill({
      json: {
        epicrisis: {
          id: 1,
          patientId: 'TEST001',
          pdfPath: null,
          status: 'in_review',
          assigneeId: 1,
          clinicalData: overrides.clinicalData ?? null,
          llmPredictions: null,
          sections: [{
            sectionName: 'resumen_clinico',
            label: 'Resumen Clínico',
            content: 'Infección: urinaria confirmada por cultivo de orina positivo.\nHipertensión: Arterial severa documentada.',
            position: 1,
          }],
        },
      },
    })
  })

  await page.route('**/api/annotations?epicrisisId=1', async (route: any) => {
    await route.fulfill({ json: { annotations: overrides.annotations ?? [] } })
  })
}

test.describe('Persistencia de evidencia', () => {

  test('limpiar evidencia de criterio y guardar → no reaparece al recargar', async ({ page }) => {
    let lastSavedBody: any = null

    // Capturar el cuerpo del POST de guardado
    await page.route('**/api/annotations', async (route: any) => {
      if (route.request().method() === 'POST') {
        lastSavedBody = route.request().postDataJSON()
        await route.fulfill({ json: { ok: true, status: 'in_review' } })
      } else route.continue()
    })

    await mockBaseRoutes(page)
    await page.goto('/annotate/1')
    await expect(page.getByText('Infección: urinaria')).toBeVisible()

    // Marcar Sí en el criterio de Hipertensión Arterial
    await page.getByText('Antecedentes médicos').first().click()
    await page.getByText('Cardiovascular').first().click()
    const htaNode = page.locator('[data-criterion="antecedentes.cardiovascular.hipertension_arterial"]')
    await htaNode.getByRole('button', { name: 'Sí' }).click()

    // Seleccionar texto y capturarlo como evidencia
    await page.locator('strong').nth(1).dblclick()
    await page.getByRole('button', { name: /Capturar evidencia/i }).click()

    // Verificar que la evidencia aparece (caja de texto)
    const evidenceBox = page.locator('textarea').first()
    await expect(evidenceBox).toHaveValue(/Hipertensión/)

    // Limpiar la evidencia
    await page.getByTitle('Limpiar esta casilla').first().click()

    // La evidencia ya no debe estar
    await expect(evidenceBox).toHaveValue('')

    // Guardar
    await page.getByRole('button', { name: /Guardar borrador/i }).click()

    // Verificar que el cuerpo guardado NO tiene evidenceText para ese criterio
    await page.waitForTimeout(500)
    expect(lastSavedBody).not.toBeNull()
    const hypertensionEntry = lastSavedBody.criteria?.find((c: any) => c.criterionName === 'hipertension_arterial')
    expect(hypertensionEntry?.evidenceText).toBeFalsy()
  })

  test('limpiar evidencia de foco clínico → botón limpiar disponible', async ({ page }) => {
    let lastSavedBody: any = null

    await page.route('**/api/annotations', async (route: any) => {
      if (route.request().method() === 'POST') {
        lastSavedBody = route.request().postDataJSON()
        await route.fulfill({ json: { ok: true, status: 'in_review' } })
      } else route.continue()
    })

    await mockBaseRoutes(page)
    await page.goto('/annotate/1')
    await expect(page.getByText('Infección: urinaria')).toBeVisible()

    // 1. Marcar Sí en "Infección/es durante la estadía en UPC"
    const upcInfeccionNode = page.locator('[data-criterion="infecciones.estadia_upc"]')
    await upcInfeccionNode.getByRole('button', { name: 'Sí' }).click()

    // 2. Expandir "Focos infecciosos"
    await page.getByText('Focos infecciosos').click()

    // 3. Marcar Sí en foco Urinario
    const urinarioNode = page.locator('[data-criterion="infecciones.focos.urinario"]')
    await urinarioNode.getByRole('button', { name: 'Sí' }).click()

    // Seleccionar y capturar texto de evidencia
    await page.locator('strong').first().dblclick()
    await page.getByRole('button', { name: /Capturar evidencia/i }).click()

    // Verificar que la evidencia aparece en el textarea
    const evidenceBox = urinarioNode.locator('textarea').first()
    await expect(evidenceBox).toHaveValue(/infección/i)

    // Verificar que el botón limpiar existe para el foco (bug 1 fix)
    const limpiarBtn = urinarioNode.getByTitle('Limpiar esta casilla').first()
    await expect(limpiarBtn).toBeVisible()

    // Limpiar
    await limpiarBtn.click()
    await expect(evidenceBox).toHaveValue('')

    // Guardar y verificar que clinicalData no tiene la evidencia
    await page.getByRole('button', { name: /Guardar borrador/i }).click()
    await page.waitForTimeout(500)
    expect(lastSavedBody?.epicrisisMetadata?.clinicalData?.infeccionUrinarioEvidencia).toBeFalsy()
  })

  test('deseleccionar texto fuera del panel no mantiene estado fantasma', async ({ page }) => {
    await page.route('**/api/annotations', async (route: any) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { ok: true, status: 'in_review' } })
      } else route.continue()
    })

    await mockBaseRoutes(page)
    await page.goto('/annotate/1')
    await expect(page.getByText('Infección: urinaria')).toBeVisible()

    // Seleccionar texto en el documento
    await page.locator('strong').nth(1).dblclick()

    // Verificar que el botón "Capturar" está activo (pulsa)
    const captureBtn = page.getByRole('button', { name: /Capturar evidencia/i })
    await expect(captureBtn).not.toBeDisabled()

    // Hacer clic fuera de la selección pero DENTRO del documento (para deseleccionar)
    await page.getByText('Resumen Clínico').first().click()
    await page.waitForTimeout(100)

    // Después del clic fuera, el botón Capturar debe estar inactivo (no hay selección)
    await expect(captureBtn).toBeDisabled()
  })

  test('clinicalData del servidor sobreescribe localStorage al recargar (bug datesFromStorage)', async ({ page }) => {
    // Simular que el servidor ya tiene la evidencia borrada
    const serverClinicalData = {
      infeccionUrinario: true,
      infeccionUrinarioEvidencia: '', // vacío en servidor (fue limpiado y guardado)
    }

    await page.route('**/api/annotations', async (route: any) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { ok: true, status: 'in_review' } })
      } else route.continue()
    })

    // Inyectar localStorage con evidencia "vieja" y una fecha (reproduce el bug datesFromStorage)
    await page.addInitScript(() => {
      localStorage.setItem('annotation_draft_1', JSON.stringify({
        criteria: [],
        fechaIngresoHosp: '15/01/2024', // fecha presente → datesFromStorage = true
        fechaEgresoHosp: '',
        fechaIngresoUci: '',
        fechaEgresoUci: '',
        comentarioFinal: '',
        clinicalData: {
          infeccionUrinario: true,
          infeccionUrinarioEvidencia: 'texto viejo que fue borrado y guardado al servidor', // stale
        },
      }))
    })

    await mockBaseRoutes(page, { clinicalData: serverClinicalData })
    await page.goto('/annotate/1')
    await expect(page.getByText('Infección: urinaria')).toBeVisible()

    // Esperar a que se carguen los datos del servidor
    await page.waitForTimeout(800)

    // La evidencia vieja del localStorage NO debe aparecer (server gana)
    await expect(page.locator('.bg-yellow-50')).not.toBeVisible()
  })
})
