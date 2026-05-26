# Mejoras de Anotación y Correcciones de Consistencia — Semana 7

**Fecha:** 2026-05-26  
**Rama:** `main`  
**Repo frontend:** `epicrisis_app` · **Repo backend:** `epicrisis_backend`

---

## Resumen ejecutivo

Esta semana se implementaron cuatro grupos de mejoras sobre la plataforma de anotación de epicrisis:

1. **Nuevos campos clínicos**: fechas de VMI y botones "No sé" en booleanos
2. **Sistema de validación de fechas**: notificaciones reactivas que bloquean el guardado ante inconsistencias
3. **Sistema de dificultad (semáforo)**: rating 🟢🟡🔴 por criterio y por sección clínica, consistente en DB, backend y admin
4. **Auditoría y corrección de consistencia**: 6 bugs críticos/medios encontrados y corregidos afectando multi-anotador, κ de Cohen, matrix de admin y seguridad de roles

---

## 1. Nuevos campos clínicos y botón "No sé"

### 1.1 Fechas de VMI

Se agregaron dos campos de texto en la sección de Soporte Ventilatorio:

- **Inicio VMI** (`vmiInicio`) — fecha de inicio de ventilación mecánica invasiva
- **Fin VMI** (`vmiFin`) — fecha de fin

**Archivos modificados:**
- `epicrisis_backend/db/schema.ts` → `vmiInicio: text('vmi_inicio')`, `vmiFin: text('vmi_fin')` en `epicrisisClinicalData`
- `src/types/clinical.ts` → `vmiInicio: string`, `vmiFin: string` en la interfaz `ClinicalData`
- `src/components/annotation/ClinicalDataPanel.vue` → campos de texto activables con captura de evidencia

### 1.2 Botón "No sé" y sistema de cuatro estados

Todos los campos booleanos del panel de anotación (criterios y datos clínicos) pasan de 3 a 4 estados:

| Estado | Valor interno | Significado |
|--------|--------------|-------------|
| `null` | `null` | Sin responder (estado por defecto) |
| `true` | `true` | Sí — presente |
| `false` | `false` | No — ausente |
| `'unknown'` | `'unknown'` | No se puede determinar a partir de la epicrisis |

**Comportamiento UI:**
- Los botones Sí/No/? son **desactivables** — presionar el botón activo lo deja en `null`
- El botón `?` se muestra seleccionado (bg oscuro) cuando está activo
- El estado por defecto es `null` (ningún botón activo), no `?`

**Consistencia DB:**
- Tabla `annotations`: columna `is_unknown boolean NOT NULL DEFAULT false` — distingue `null` por no responder de `null` por incertidumbre explícita
- Tabla `epicrisis_clinical_data`: columna `unknown_fields json DEFAULT '[]'` — array de keys de campos booleanos marcados como desconocidos

**Mapeo frontend ↔ backend:**
```typescript
// Frontend → Backend (POST /annotations)
isPresent === 'unknown'  →  { isPresent: null, isUnknown: true }
isPresent === true       →  { isPresent: true,  isUnknown: false }
isPresent === false      →  { isPresent: false, isUnknown: false }
isPresent === null       →  { isPresent: null,  isUnknown: false }

// Backend → Frontend (GET /annotations)
{ isPresent: null, isUnknown: true }  →  'unknown'
{ isPresent: boolean | null, isUnknown: false }  →  isPresent
```

**Archivos modificados:**
- `epicrisis_backend/db/schema.ts` → columna `is_unknown`
- `epicrisis_backend/api/annotations.ts` → mapeo en GET y POST
- `src/stores/annotation.ts` → tipo `boolean | null | 'unknown'` en `CriterionState.isPresent`
- `src/components/annotation/CriterionRow.vue` → botón `?` con estilos de selección
- `src/components/annotation/ClinicalToggle.vue` → misma lógica para booleanos clínicos
- `src/types/difficulty.ts` → tipo `DifficultyLevel` (ver sección 3)

---

## 2. Sistema de validación de fechas con notificaciones

### 2.1 Composable `useAnnotationValidation`

**Ruta:** `src/composables/useAnnotationValidation.ts`

Sistema declarativo de reglas de validación. Cada regla tiene:

```typescript
interface ValidationRule {
  id: string
  message: string
  severity: 'error' | 'warning'
  check: () => boolean  // true = violación activa
}
```

**Reglas implementadas:**

| ID | Severidad | Condición que dispara |
|----|-----------|----------------------|
| `hosp_order` | error | Egreso hospital < Ingreso hospital |
| `uci_order` | error | Egreso UCI < Ingreso UCI |
| `vmi_order` | error | Fin VMI < Inicio VMI |
| `vmi_before_hosp` | warning | Inicio VMI < Ingreso hospital |
| `vmi_after_discharge` | warning | Fin VMI > Egreso hospital |
| `uci_before_hosp` | warning | Ingreso UCI < Ingreso hospital |
| `uci_after_discharge` | warning | Egreso UCI > Egreso hospital |
| `future_dates` | warning | Cualquier fecha posterior al día actual |
| `transfusion_unidades_positive` | error | Unidades de transfusión ≤ 0 o no entero |

**API del composable:**
```typescript
const validation = useAnnotationValidation()

validation.attachWatchers()          // activa watchers reactivos sobre el store
validation.hasErrors()               // boolean — hay alguna violación de severidad 'error'
validation.getViolations()           // devuelve todas las violaciones activas
```

### 2.2 Composable `useToast`

**Ruta:** `src/composables/useToast.ts`

| Tipo | Auto-dismiss | Color |
|------|-------------|-------|
| `success` | 3 segundos | Verde |
| `warning` | 5 segundos | Amarillo |
| `error` | **Nunca** | Rojo — requiere acción |

Deduplicación: no muestra el mismo mensaje dos veces simultáneamente.

### 2.3 Integración en `AnnotationView.vue`

```typescript
// Guardar borrador: bloquea si hay errores
async function handleSaveProgress() {
  if (validation.hasErrors()) {
    showToast('Hay errores en las fechas. Corrígelos antes de guardar.', 'error')
    return
  }
  await annotationStore.saveProgress()
}

// Envío final: muestra warnings pero permite si no hay errores
async function handleSubmitFinal() {
  const violations = validation.getViolations()
  if (violations.length > 0) {
    violations.forEach(v => showToast(v.message, v.severity))
    if (violations.some(v => v.severity === 'error')) return  // bloquea
  }
  await annotationStore.submitFinal()
}
```

---

## 3. Sistema de dificultad (semáforo) 🟢🟡🔴

### 3.1 Tipo `DifficultyLevel`

**Ruta:** `src/types/difficulty.ts`

```typescript
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | null

export const DIFFICULTY_LEVELS = [
  { value: 'easy',   label: 'Normal',  description: 'Extracción directa del documento',                    dot: 'bg-green-400',  ... },
  { value: 'medium', label: 'Mediana', description: 'Requirió atención o interpretación extra',             dot: 'bg-yellow-400', ... },
  { value: 'hard',   label: 'Difícil', description: 'Ambiguo, ausente o muy difícil de determinar',        dot: 'bg-red-400',    ... },
] as const
```

### 3.2 Componente `DifficultyBadge.vue`

**Ruta:** `src/components/annotation/DifficultyBadge.vue`

Props: `modelValue: DifficultyLevel`, `notes: string`, `isReadOnly?: boolean`  
Emits: `update:modelValue`, `update:notes`

- Tres puntos de colores — activo: `scale-125` + `ring-2`; inactivo: `opacity-25`
- Input de notas (borde inferior solo, sin box, `w-28`)
- Tooltip dark `bg-gray-900` anclado `bottom-full right-0` con flecha, activado con `group-hover`

### 3.3 Dificultad por criterio de anotación

**Ruta:** `src/components/annotation/CriterionRow.vue`

- Estado **inactivo**: punto de 8×8px coloreado en el header (top-right), visible si hay valor
- Estado **activo**: `DifficultyBadge` completo visible en la fila activa
- Guardado en `CriterionState.difficulty` y `CriterionState.difficultyNotes`

**DB:** columnas `difficulty text` y `difficulty_notes text` en la tabla `annotations`

### 3.4 Dificultad por sección clínica

**Ruta:** `src/components/annotation/ClinicalDataPanel.vue`

Cada uno de los 9 encabezados de sección tiene un `DifficultyBadge` a la derecha:
`ventilatorio`, `reanimacion`, `transfusion`, `vasoactivas`, `cirugias`, `trr`, `infecciones`, `falla_organica`, `diagnosticos`

**DB:** tabla separada `annotation_clinical_difficulty`

```sql
CREATE TABLE annotation_clinical_difficulty (
  id              SERIAL PRIMARY KEY,
  epicrisis_id    INTEGER NOT NULL REFERENCES epicrisis(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_name    TEXT NOT NULL,
  difficulty      TEXT,
  difficulty_notes TEXT,
  UNIQUE (epicrisis_id, user_id, section_name)
);
```

**API:**
- `GET /api/annotations?epicrisisId=X` → incluye `clinicalDifficulty: Record<string, { difficulty, notes }>`
- `POST /api/annotations` → upsert en `annotation_clinical_difficulty` por sección

### 3.5 Dificultad en el panel Admin (Matrix)

**Ruta:** `src/components/admin/AdminMatrix.vue`

La tabla de estadísticas incluye una columna **Dificultad** que muestra la distribución de ratings para cada criterio:

```
🟢 12  🟡 5  🔴 3
```

Los conteos acumulan ratings de **todos** los anotadores (no solo el primario).

---

## 4. Correcciones de consistencia (auditoría interna)

Realizada una auditoría completa de consistencia DB ↔ backend ↔ frontend. Se detectaron y corrigieron 6 problemas.

### 4.1 🔴 Status se pisaba entre anotadores solapados

**Problema:** El campo `epicrisis.status` es compartido. Si el anotador A hacía submit final (`status = 'reviewed'`) y luego el anotador B guardaba progreso (`status = 'in_review'`), el estado de A se revertía.

**Solución — Migration v3:**
```sql
ALTER TABLE epicrisis_assignments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
```

**Nueva lógica en `api/annotations.ts`:**
- Al hacer submit final: `epicrisis_assignments.completed_at = NOW()` para el usuario actual
- Al guardar borrador: `completed_at = NULL`
- `epicrisis.status = 'reviewed'` **solo cuando todos los asignados tienen `completed_at != NULL`**
- Si la epicrisis no tiene filas en `epicrisis_assignments` (legado): comportamiento anterior

```typescript
// Contar cuántos completaron (incluye la actualización recién hecha)
const [{ total, completed }] = await db
  .select({
    total:     sql<number>`COUNT(*)`.mapWith(Number),
    completed: sql<number>`COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)`.mapWith(Number),
  })
  .from(epicrisisAssignments)
  .where(eq(epicrisisAssignments.epicrisisId, epicrisisIdNum))

newStatus = (completed === total && total > 0) ? 'reviewed' : 'in_review'
```

### 4.2 🔴 Fechas clínicas compartidas entre anotadores

**Problema:** `fechaIngresoHosp`, `fechaEgresoHosp`, `fechaIngresoUci`, `fechaEgresoUci`, `comentarioFinal` estaban en la tabla `epicrisis` (compartida). El anotador B sobreescribía las fechas del anotador A en cada guardado.

**Solución — Migration v3:**
```sql
ALTER TABLE epicrisis_clinical_data
ADD COLUMN IF NOT EXISTS fecha_ingreso_hosp TEXT,
ADD COLUMN IF NOT EXISTS fecha_egreso_hosp  TEXT,
ADD COLUMN IF NOT EXISTS fecha_ingreso_uci  TEXT,
ADD COLUMN IF NOT EXISTS fecha_egreso_uci   TEXT,
ADD COLUMN IF NOT EXISTS comentario_final   TEXT;
```

La tabla `epicrisis_clinical_data` ya tenía PK compuesto `(epicrisis_id, user_id)` → cada anotador tiene su propia fila.

**Regla de merge en `api/epicrisis.ts` (GET individual):**
```typescript
// Prioridad: valor capturado por el anotador > semilla auto-extraída
const fullDoc = {
  ...row.epicrisis,
  fechaIngresoHosp: cd?.fechaIngresoHosp ?? row.epicrisis.fechaIngresoHosp,
  fechaEgresoHosp:  cd?.fechaEgresoHosp  ?? row.epicrisis.fechaEgresoHosp,
  fechaIngresoUci:  cd?.fechaIngresoUci  ?? row.epicrisis.fechaIngresoUci,
  fechaEgresoUci:   cd?.fechaEgresoUci   ?? row.epicrisis.fechaEgresoUci,
  comentarioFinal:  cd?.comentarioFinal  ?? row.epicrisis.comentarioFinal,
  clinicalData: cd || null,
  sections,
}
```

La tabla `epicrisis` queda como **semilla de solo lectura** (valores auto-extraídos del LLM/parser). El frontend no requirió ningún cambio — recibe los datos ya mergeados.

### 4.3 🔴 Fórmula de Cohen's κ incorrecta

**Problema:** El Pe (acuerdo esperado por azar) estaba hardcodeado en `0.5`, lo que asume distribución 50/50 siempre. Para criterios muy prevalentes o muy raros, esto produce κ inflado o deflado, inválido para publicación.

**Fórmula correcta implementada:**

```typescript
// Pe real de Cohen: usa frecuencias marginales de cada anotador
const r1_yes = pairs.filter(([v1]) => v1 === true).length / total
const r2_yes = pairs.filter(([, v2]) => v2 === true).length / total
const pe = r1_yes * r2_yes + (1 - r1_yes) * (1 - r2_yes)
const kappa = pe < 1 ? (po - pe) / (1 - pe) : 1
```

**Ejemplo del error previo:**  
Criterio con prevalencia real del 5% → Pe real ≈ 0.905 → κ correcto ≈ 0.48  
Con `pe = 0.5` → κ reportado ≈ 0.90 (¡el doble!)

**Correcciones adicionales en el cálculo IRR:**
- Antes: solo tomaba el primer par de anotadores por epicrisis
- Ahora: genera todos los pares posibles (`i,j` con `j > i`) para manejar 3+ anotadores correctamente
- Los votos con `isUnknown = true` se excluyen del cálculo (no se puede forzar acuerdo/desacuerdo cuando el anotador declara incertidumbre)

### 4.4 🟡 Admin Matrix mostraba solo el anotador primario

**Problema:** La query SQL del matrix hacía `LEFT JOIN annotations ON epicrisis.assignee_id = annotations.user_id`, ignorando las anotaciones del segundo anotador en epicrisis solapadas.

**Solución:** Dos queries separadas + merge en JS:

```typescript
// Query 1: metadatos de cada epicrisis
const epicrisisRows = await db.select({ id, patientId, status, assigneeEmail, llmPredictions })
  .from(epicrisis).leftJoin(users, ...).orderBy(epicrisis.id)

// Query 2: TODAS las anotaciones con email del anotador
const annotationRows = await db.select({
  epicrisisId, userId, userEmail, criterionName, isPresent, isUnknown, evidenceText, difficulty
}).from(annotations).leftJoin(users, ...)

// Merge: Record<epicrisisId, Record<criterionName, AnnotatorEntry[]>>
```

**Nuevo tipo en frontend:**
```typescript
// admin.service.ts
interface MatrixAnnotatorEntry {
  userId: number
  email: string | null
  isPresent: boolean | null
  isUnknown: boolean
  evidenceText: string | null
  difficulty: string | null
}

// Antes: Record<string, { isPresent, evidenceText, difficulty }>
// Ahora: Record<string, MatrixAnnotatorEntry[]>
```

**Nuevos estados visuales en la tabla matricial:**

| Estado | Color | Ícono | Condición |
|--------|-------|-------|-----------|
| `present` | Verde | ✓ | Todos los anotadores con respuesta dicen Sí |
| `absent` | Rojo | ✗ | Todos dicen No |
| `conflict` | Naranja | ≠ | Anotadores en desacuerdo |
| `unknown` | Gris | ? | Alguno dijo "No sé" (sin opuesto) |
| `nr` | Gris claro | — | Sin anotaciones |

Badge numérico en la esquina de la celda cuando hay más de 1 anotador.  
Tooltip muestra todos los anotadores: `"nombre: Sí — evidencia..."`

### 4.5 🟡 Rol en JWT no se invalidaba al cambiar rol

**Problema:** El JWT tiene vigencia de 7 días. Si un admin cambiaba el rol de un usuario (annotator → admin), el usuario antiguo seguía actuando con el rol anterior hasta expirar el token.

**Solución:** Verificación de rol directamente en DB al inicio de cada request al endpoint `/api/admin`:

```typescript
// En admin.ts — ANTES de procesar cualquier acción:
const [freshUser] = await db
  .select({ role: users.role })
  .from(users)
  .where(eq(users.id, Number(authUser.sub)))
  .limit(1)

if (!freshUser || freshUser.role !== 'admin') {
  return res.status(403).json({ error: 'Solo administradores' })
}
```

El cambio de rol es efectivo **inmediatamente** sin necesidad de logout. La latencia es mínima (1 query de PK).

### 4.6 🟡 `isUnknown` ignorado en cálculo IRR

**Problema:** La query del IRR solo seleccionaba `isPresent`. Un voto "No sé" (`isPresent = null, isUnknown = true`) era indistinguible de "sin responder" (`isPresent = null, isUnknown = false`), distorsionando el cálculo de acuerdo.

**Solución:** La query selecciona `isUnknown` y los pares donde alguno dijo "No sé" se **excluyen** del cálculo:

```typescript
// Generar pares, saltando los que incluyen votos 'unknown'
if (v1.isUnknown || v2.isUnknown) continue
pairsByCriterion[criterion].push([v1.isPresent, v2.isPresent])
```

Esto es metodológicamente correcto: si un anotador declara explícitamente que no puede determinar el valor, ese caso no debe contar ni a favor ni en contra del acuerdo.

---

## 5. Schema de migración — resumen de cambios DB

### Migration v3 (aplicada 2026-05-26)

```sql
-- 1. Tracking de completitud por anotador
ALTER TABLE epicrisis_assignments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 2. Fechas per-user en datos clínicos
ALTER TABLE epicrisis_clinical_data
ADD COLUMN IF NOT EXISTS fecha_ingreso_hosp TEXT,
ADD COLUMN IF NOT EXISTS fecha_egreso_hosp  TEXT,
ADD COLUMN IF NOT EXISTS fecha_ingreso_uci  TEXT,
ADD COLUMN IF NOT EXISTS fecha_egreso_uci   TEXT,
ADD COLUMN IF NOT EXISTS comentario_final   TEXT;

-- 3. Constraint de unicidad en anotaciones (safety net)
ALTER TABLE annotations
ADD CONSTRAINT annotations_epicrisis_user_criterion_uniq
UNIQUE (epicrisis_id, user_id, criterion_name);
```

### Schema acumulado — tablas relevantes post semana 7

```
annotations
  ├─ id, epicrisis_id, user_id, criterion_name
  ├─ is_present boolean | NULL
  ├─ is_unknown boolean NOT NULL DEFAULT false     ← nuevo semana 7
  ├─ difficulty text                               ← nuevo semana 7
  ├─ difficulty_notes text                         ← nuevo semana 7
  ├─ evidence_text, comments
  └─ UNIQUE(epicrisis_id, user_id, criterion_name) ← nuevo semana 7

epicrisis_assignments
  ├─ id, epicrisis_id, user_id, assigned_at
  └─ completed_at timestamp                        ← nuevo semana 7

epicrisis_clinical_data (PK: epicrisis_id, user_id)
  ├─ ... (todos los campos clínicos)
  ├─ vmi_inicio, vmi_fin                           ← nuevo semana 7 (parte 1)
  ├─ unknown_fields json DEFAULT '[]'              ← nuevo semana 7 (parte 1)
  ├─ fecha_ingreso_hosp, fecha_egreso_hosp         ← nuevo semana 7
  ├─ fecha_ingreso_uci, fecha_egreso_uci           ← nuevo semana 7
  └─ comentario_final                              ← nuevo semana 7

annotation_clinical_difficulty (nueva semana 7)
  ├─ id, epicrisis_id, user_id
  ├─ section_name text
  ├─ difficulty text, difficulty_notes text
  └─ UNIQUE(epicrisis_id, user_id, section_name)
```

---

## 6. Archivos modificados — índice completo

### Backend (`epicrisis_backend/`)

| Archivo | Cambio |
|---------|--------|
| `db/schema.ts` | `is_unknown`, `difficulty/*` en `annotations`; `vmi_inicio/fin` y `unknown_fields` y fechas/comentario en `epicrisis_clinical_data`; `completed_at` en `epicrisis_assignments`; nueva tabla `annotationClinicalDifficulty` |
| `db/migrate_v3.ts` | Script de migración — `completed_at`, columnas de fechas, unique constraint |
| `api/annotations.ts` | DELETE selectivo por usuario; status basado en `completed_at` de todos los asignados; fechas/comentario guardados en `epicrisis_clinical_data` (no en `epicrisis`); guarda `difficulty`/`difficultyNotes` por criterio; upsert de `annotation_clinical_difficulty` |
| `api/epicrisis.ts` | GET individual: merge de fechas per-user sobre semilla auto-extraída |
| `api/admin.ts` | Verificación de rol desde DB; matrix con todos los anotadores; Cohen's κ con Pe correcto; `isUnknown` excluido del IRR |

### Frontend (`epicrisis_app/src/`)

| Archivo | Cambio |
|---------|--------|
| `types/difficulty.ts` | **Nuevo** — `DifficultyLevel`, `DIFFICULTY_LEVELS` |
| `types/clinical.ts` | `vmiInicio`, `vmiFin`, `_unknowns: string[]` |
| `stores/annotation.ts` | `CriterionState.isPresent: boolean \| null \| 'unknown'`; `difficulty`/`difficultyNotes` por criterio; `clinicalDifficulty` record; `setClinicalDifficulty*`, `setDifficulty*`; persistencia local y carga desde servidor |
| `services/annotation.service.ts` | `getForEpicrisis` devuelve `clinicalDifficulty`; `CriterionPayload.isPresent` acepta `'unknown'` |
| `services/admin.service.ts` | `MatrixAnnotatorEntry` (nuevo); `AdminMatrixRow.annotations: Record<string, MatrixAnnotatorEntry[]>` |
| `composables/useAnnotationValidation.ts` | **Nuevo** — sistema de reglas declarativas con watchers reactivos |
| `composables/useToast.ts` | Tipo `error` sin auto-dismiss; deduplicación; `dismissByMessage()` |
| `components/ui/ToastContainer.vue` | Estilos para `error`; íconos emoji por tipo |
| `components/annotation/DifficultyBadge.vue` | **Nuevo** — semáforo reutilizable con notas y tooltip |
| `components/annotation/CriterionRow.vue` | Botón `?` deseleccionable; dot de dificultad en inactivo; `DifficultyBadge` en activo |
| `components/annotation/ClinicalToggle.vue` | Soporte `boolean \| null \| 'unknown'`; botón `?` |
| `components/annotation/ClinicalDataPanel.vue` | Campos `vmiInicio`/`vmiFin`; `setBool()` para cuatro estados; `DifficultyBadge` en 9 headers de sección |
| `components/admin/AdminMatrix.vue` | `cellState()` para multi-anotador; celda naranja `≠` para conflictos; tooltip multi-anotador; columna conflicto en stats |
| `views/AnnotationView.vue` | Importa `useAnnotationValidation`, `useToast`; bloquea guardado/submit con errores; carga `clinicalDifficulty` desde servidor al montar |
