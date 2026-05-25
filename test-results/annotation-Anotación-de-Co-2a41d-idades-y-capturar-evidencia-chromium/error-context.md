# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: annotation.spec.ts >> Anotación de Comorbilidades >> permite anotar comorbilidades y capturar evidencia
- Location: tests/annotation.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Paciente masculino de 65 años')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Paciente masculino de 65 años')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img "Clinical Research" [ref=e6]
    - generic [ref=e8]:
      - generic [ref=e9]:
        - img [ref=e11]
        - generic [ref=e13]: EPICRISIS AI
      - generic [ref=e14]:
        - heading "Estandarización inteligente de datos clínicos." [level=2] [ref=e15]
        - paragraph [ref=e16]: Plataforma avanzada para la validación de comorbilidades y generación de evidencia médica mediante inteligencia artificial.
  - generic [ref=e18]:
    - generic [ref=e19]:
      - heading "Bienvenido" [level=2] [ref=e20]
      - paragraph [ref=e21]: Ingresa tus credenciales institucionales para continuar.
    - generic [ref=e22]:
      - generic [ref=e23]:
        - text: Correo Institucional
        - generic [ref=e24]:
          - img [ref=e26]
          - textbox "Correo Institucional" [ref=e28]:
            - /placeholder: usuario@institucion.cl
      - generic [ref=e29]:
        - text: Contraseña
        - generic [ref=e30]:
          - img [ref=e32]
          - textbox "Contraseña" [ref=e34]:
            - /placeholder: ••••••••
      - button "ENTRAR AL PANEL" [ref=e35] [cursor=pointer]
    - paragraph [ref=e36]:
      - text: Plataforma restringida para fines de investigación clínica.
      - generic [ref=e37]: iHealth — 2026
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Anotación de Comorbilidades', () => {
  4  |   test('permite anotar comorbilidades y capturar evidencia', async ({ page }) => {
  5  | 
  6  |     // 1. Mocking: Simular que el usuario ya inició sesión
  7  |     await page.route('**/api/auth', async route => {
  8  |       if (route.request().method() === 'GET') {
  9  |         const json = { user: { id: 1, email: 'tester@epicrisis.cl', role: 'annotator', termsAcceptedAt: '2026-05-05T00:00:00Z' } };
  10 |         await route.fulfill({ json });
  11 |       } else {
  12 |         route.continue();
  13 |       }
  14 |     });
  15 | 
  16 |     // 2. Mocking: Simular la epicrisis a anotar
  17 |     // Nota: el API retorna `sections` (no `contentMarkdown`, eliminado en c37fbce)
  18 |     await page.route('**/api/epicrisis?id=999', async route => {
  19 |       const json = {
  20 |         epicrisis: {
  21 |           id: 999,
  22 |           patientId: 'TEST999',
  23 |           pdfPath: null,
  24 |           status: 'pending',
  25 |           assigneeId: 1,
  26 |           clinicalData: null,
  27 |           llmPredictions: null,
  28 |           sections: [
  29 |             {
  30 |               sectionName: 'resumen_clinico',
  31 |               label: 'Resumen Clínico',
  32 |               // SectionedViewer convierte "Label: valor" en <strong>Label:</strong> valor
  33 |               content: 'Paciente masculino de 65 años con diagnóstico previo de Hipertensión Arterial severa.\n\nHipertensión: Arterial severa. Diagnóstico confirmado por laboratorio.',
  34 |               position: 1,
  35 |             },
  36 |           ],
  37 |         },
  38 |       };
  39 |       await route.fulfill({ json });
  40 |     });
  41 | 
  42 |     await page.route('**/api/lock', async route => {
  43 |       await route.fulfill({ json: { ok: true } });
  44 |     });
  45 | 
  46 |     // 3. Mocking: Simular que no hay anotaciones previas
  47 |     await page.route('**/api/annotations?epicrisisId=999', async route => {
  48 |       await route.fulfill({ json: { annotations: [] } });
  49 |     });
  50 | 
  51 |     // 4. Ir a la vista de anotación directamente
  52 |     await page.goto('/annotate/999');
  53 | 
  54 |     // Comprobar que cargó la UI con el texto de la sección
> 55 |     await expect(page.getByText('Paciente masculino de 65 años')).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  56 | 
  57 |     // 5. Interactuar: Marcar como "Sí" el primer criterio
  58 |     await page.getByRole('button', { name: 'Sí' }).first().click();
  59 | 
  60 |     // Comprobar avance en el progreso — total incluye criterios + datos clínicos + fechas
  61 |     // Usamos regex en vez de texto exacto para no acoplarnos al total concreto
  62 |     await expect(page.getByText(/^1\/\d+/).first()).toBeVisible();
  63 | 
  64 |     // 6. Interactuar: Simular selección de texto en el panel del documento
  65 |     // SectionedViewer renderiza "Hipertensión: ..." como <strong>Hipertensión:</strong>
  66 |     await page.locator('strong').first().dblclick();
  67 | 
  68 |     // 7. Verificar Selección Persistente (Virtual Highlighting)
  69 |     // Hacemos clic "afuera" (en el contenedor derecho) para intentar borrar la selección nativa
  70 |     await page.locator('.rounded-lg.border').first().click();
  71 | 
  72 |     // Verificamos que la API de CSS Highlights mantenga nuestro texto resaltado
  73 |     const hasHighlight = await page.evaluate(() => {
  74 |       // @ts-ignore
  75 |       return CSS.highlights && CSS.highlights.has('epicrisis-selection');
  76 |     });
  77 |     expect(hasHighlight).toBeTruthy();
  78 | 
  79 |     // 8. Hacer clic en "Capturar evidencia"
  80 |     await page.getByRole('button', { name: /Capturar evidencia/i }).click();
  81 | 
  82 |     // 9. Verificar que el Virtual Highlight se limpió después de capturar
  83 |     const isHighlightCleared = await page.evaluate(() => {
  84 |       // @ts-ignore
  85 |       return CSS.highlights && !CSS.highlights.has('epicrisis-selection');
  86 |     });
  87 |     expect(isHighlightCleared).toBeTruthy();
  88 | 
  89 |     // 10. Verificar que la evidencia se guardó en la caja amarilla del criterio activo
  90 |     await expect(page.locator('.bg-yellow-50').first()).toContainText('Hipertensión');
  91 |   });
  92 | });
  93 | 
```