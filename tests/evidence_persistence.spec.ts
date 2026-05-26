import { test, expect } from '@playwright/test'

// Mocks reutilizables
async function mockBaseRoutes(page: any, overrides: { annotations?: any[]; clinicalData?: any } = {}) {
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
            content: 'Paciente con infección urinaria confirmada por cultivo de orina positivo. Hipertensión Arterial severa documentada.',
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
    await expect(page.getByText('Paciente con infección')).toBeVisible()

    // Marcar Sí en el primer criterio (Hipertensión Arterial)
    await page.getByRole('button', { name: 'Sí' }).first().click()

    // Seleccionar texto y capturarlo como evidencia
    await page.locator('text=Hipertensión Arterial severa').dblclick()
    await page.getByRole('button', { name: /Capturar evidencia/i }).click()

    // Verificar que la evidencia aparece (caja amarilla)
    await expect(page.locator('.bg-yellow-50').first()).toBeVisible()

    // Limpiar la evidencia
    await page.getByTitle('Limpiar evidencia capturada').first().click()

    // La caja amarilla ya no debe existir para ese criterio
    const yellowBox = page.locator('.bg-yellow-50').first()
    await expect(yellowBox).not.toBeVisible()

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
    await expect(page.getByText('Paciente con infección')).toBeVisible()

    // Activar foco Urinario (hacer clic en el toggle "Sí")
    const urinarioSection = page.locator('text=Urinario').locator('..')
    await urinarioSection.getByRole('button', { name: 'Sí' }).click()

    // Activar el campo de evidencia del foco
    await urinarioSection.click()

    // Seleccionar y capturar texto de evidencia
    await page.locator('text=infección urinaria confirmada').dblclick()
    await page.getByRole('button', { name: /Capturar evidencia/i }).click()

    // Verificar que la evidencia aparece
    const evidenceBox = urinarioSection.locator('.bg-yellow-50')
    await expect(evidenceBox).toBeVisible()

    // Verificar que el botón limpiar existe para el foco (bug 1 fix)
    const limpiarBtn = urinarioSection.getByTitle('Limpiar evidencia capturada')
    await expect(limpiarBtn).toBeVisible()

    // Limpiar
    await limpiarBtn.click()
    await expect(evidenceBox).not.toBeVisible()

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
    await expect(page.getByText('Paciente con infección')).toBeVisible()

    // Seleccionar texto en el documento
    await page.locator('text=Hipertensión Arterial severa').dblclick()

    // Verificar que el botón "Capturar" está activo (pulsa)
    const captureBtn = page.getByRole('button', { name: /Capturar evidencia/i })
    await expect(captureBtn).not.toBeDisabled()

    // Hacer clic fuera del documento (en el panel derecho) sin seleccionar texto
    await page.locator('[data-criterion]').first().click()
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
    await expect(page.getByText('Paciente con infección')).toBeVisible()

    // Esperar a que se carguen los datos del servidor
    await page.waitForTimeout(800)

    // La evidencia vieja del localStorage NO debe aparecer (server gana)
    await expect(page.locator('.bg-yellow-50')).not.toBeVisible()
  })
})
