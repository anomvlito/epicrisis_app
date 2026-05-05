import { test, expect } from '@playwright/test';

test.describe('Anotación de Comorbilidades', () => {
  test('permite anotar comorbilidades y capturar evidencia', async ({ page }) => {


    // 1. Mocking: Simular que el usuario ya inició sesión
    await page.route('**/api/auth', async route => {
      if (route.request().method() === 'GET') {
        const json = { user: { id: 1, email: 'tester@epicrisis.cl', role: 'annotator', termsAcceptedAt: '2026-05-05T00:00:00Z' } };
        await route.fulfill({ json });
      } else {
        route.continue();
      }
    });

    // 2. Mocking: Simular la epicrisis a anotar
    await page.route('**/api/admin?resource=epicrisis', async route => {
      // Evitar que falle si intenta cargar el dashboard
      await route.fulfill({ json: { epicrises: [], stats: {} } });
    });

    await page.route('**/api/epicrisis?id=999', async route => {
      const json = {
        epicrisis: {
          id: 999,
          contentMarkdown: 'Paciente masculino de 65 años con diagnóstico previo de **Hipertensión Arterial** severa.',
          status: 'pending',
          assigneeId: 1
        }
      };
      await route.fulfill({ json });
    });

    await page.route('**/api/lock', async route => {
      await route.fulfill({ json: { ok: true } });
    });

    // 3. Mocking: Simular que no hay anotaciones previas
    await page.route('**/api/annotations?epicrisisId=999', async route => {
      await route.fulfill({ json: { annotations: [] } });
    });

    // 4. Ir a la vista de anotación directamente
    await page.goto('/annotate/999');

    // Comprobar que cargó la UI
    await expect(page.getByText('Paciente masculino de 65 años')).toBeVisible();

    // 5. Interactuar: Marcar como "Sí" el primer criterio
    await page.getByRole('button', { name: 'Sí' }).first().click();

    // Comprobar avance en el progreso (1/15)
    await expect(page.getByText('1/15').first()).toBeVisible();

    // 6. Interactuar: Simular selección de texto
    // Seleccionamos el texto "Hipertensión" haciendo doble clic nativo en el elemento <strong>
    await page.locator('strong').first().dblclick();

    // 7. Hacer clic en "Capturar evidencia"
    await page.getByRole('button', { name: /Capturar evidencia/i }).click();

    // 8. Verificar que la evidencia se guardó (verificamos que el texto aparece en la página dentro de un div con las clases correspondientes)
    await expect(page.locator('.bg-yellow-50').first()).toContainText('Hipertensión');
  });
});
