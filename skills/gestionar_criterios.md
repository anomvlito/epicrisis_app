# Skill: Gestionar Criterios de Antecedentes

Guía de referencia para agregar, eliminar o renombrar criterios en la sección **Antecedentes** de la plataforma de anotación de epicrisis, sin romper la base de datos, el backend ni las anotaciones existentes.

---

## Arquitectura rápida

Los criterios de antecedentes fluyen así:

```
src/constants/criteria.ts           ← fuente de verdad (COMORBIDITIES[])
        ↓ (array)
stores/annotation.ts                ← buildInitial() y loadFromServer() leen COMORBIDITIES
        ↓
components/annotation/CriterionRow.vue   ← renderiza cada ítem
components/admin/AdminMatrix.vue         ← columnas de la matriz
api/admin.ts (IRR)                       ← calcula kappa por criterio

DB: tabla `annotations`
  criterion_name TEXT  ←  igual al campo `name` de cada objeto en COMORBIDITIES
```

**Regla de oro**: el campo `name` de `COMORBIDITIES` = `criterion_name` en la tabla `annotations`.  
Cambiar el `name` sin migrar la DB deja huérfanas las anotaciones existentes.

---

## Tipos de operación

### ✅ SEGURO — Sin riesgo de pérdida de datos

| Operación | Qué tocar |
|-----------|-----------|
| Agregar criterio nuevo | Solo `criteria.ts` |
| Cambiar `label` (nombre visible) | Solo `criteria.ts` |
| Cambiar `icd10Hint` | Solo `criteria.ts` |
| Reordenar criterios | Solo `criteria.ts` |

### ⚠️ REQUIERE MIGRACIÓN DB

| Operación | Riesgo |
|-----------|--------|
| Cambiar el campo `name` de un criterio | Huerfana anotaciones existentes |
| Eliminar un criterio con anotaciones | Datos en DB no se muestran en UI |

---

## Operación 1: Agregar un criterio nuevo

**Único archivo a editar:** `src/constants/criteria.ts`

### Pasos

1. Abrir `src/constants/criteria.ts`
2. Agregar un objeto al array `COMORBIDITIES` con esta estructura:

```typescript
{ name: 'nombre_snake_case', label: 'Nombre Legible', icd10Hint: 'X00' }
```

**Reglas para el campo `name`:**
- Snake_case, todo minúsculas, sin tildes, sin espacios
- Único en el array — si ya existe, habrá duplicados en la UI
- No modificar jamás después de que existan anotaciones guardadas en producción

**Reglas para `icd10Hint`:**
- Código ICD-10 de referencia (aparece como tag en la UI y en el encabezado de la matriz)
- Puede omitirse si no aplica: simplemente no incluir la clave `icd10Hint`

3. Verificar el build:
```bash
cd /Users/fabianortega/src/epicrisis_app && npm run build
```

4. Reiniciar backend (no necesario — el backend no conoce los criterios):
```bash
# No hace falta
```

5. Deploy:
```bash
git add src/constants/criteria.ts
git commit -m "feat(criteria): agregar criterio [nombre]"
git push origin main
```

**Qué pasa con epicrisis existentes:**  
Las epicrisis ya anotadas mostrarán el nuevo criterio como "sin responder" (null). Es el comportamiento correcto — el anotador puede volver y completarlo si el status lo permite.

**Qué pasa con el LLM:**  
Las predicciones LLM (`llmPredictions` en la tabla `epicrisis`) son un JSON libre. El nuevo criterio simplemente no tendrá predicción (`llm = null` en el store). La UI lo maneja correctamente mostrando el bloque LLM vacío.

---

## Operación 2: Cambiar el label o icd10Hint

Solo editar `criteria.ts`. No hay impacto en DB.

Las anotaciones existentes siguen siendo válidas — `criterion_name` en la DB es el `name`, no el `label`.

---

## Operación 3: Eliminar un criterio

### Sin anotaciones en producción → seguro

Simplemente eliminar el objeto de `COMORBIDITIES`. Los datos en DB (si los hubiera) quedan huérfanos pero no se borran — no hay pérdida, solo quedan invisibles.

### Con anotaciones en producción → requiere decidir

**Opción A — Soft delete (recomendado):**  
Dejar el criterio en `COMORBIDITIES` pero marcarlo como obsoleto en el label:

```typescript
{ name: 'criterio_viejo', label: '[OBSOLETO] Nombre', icd10Hint: 'X00' }
```

**Opción B — Hard delete + limpieza DB:**

```bash
# 1. Eliminar de criteria.ts
# 2. Limpiar datos en DB (reemplazar con nombre real):
DB_URL=$(grep DATABASE_URL /Users/fabianortega/src/epicrisis_backend/.env | cut -d'"' -f2)
psql "$DB_URL" -c "DELETE FROM annotations WHERE criterion_name = 'nombre_a_borrar';"
```

---

## Operación 4: Renombrar el campo `name` (PELIGROSO)

Esto implica cambiar la clave con la que se guardan las anotaciones en DB.

### Pasos obligatorios

1. **Editar `criteria.ts`**: cambiar el `name` en el objeto
2. **Migrar la DB** — todas las filas existentes deben actualizarse:

```bash
DB_URL=$(grep DATABASE_URL /Users/fabianortega/src/epicrisis_backend/.env | cut -d'"' -f2)

# Reemplazar 'nombre_viejo' y 'nombre_nuevo' con los valores reales
psql "$DB_URL" -c "
  UPDATE annotations
  SET criterion_name = 'nombre_nuevo'
  WHERE criterion_name = 'nombre_viejo';
"

# Verificar que no queden filas con el nombre viejo
psql "$DB_URL" -c "SELECT COUNT(*) FROM annotations WHERE criterion_name = 'nombre_viejo';"
# Debe devolver 0
```

3. Build + deploy
4. Verificar en admin matrix que el criterio sigue mostrando sus datos históricos

---

## Verificación post-cambio

Después de cualquier operación sobre criterios, verificar:

```bash
# 1. Build limpio
cd /Users/fabianortega/src/epicrisis_app && npm run build

# 2. Contar criterios en criteria.ts (debe coincidir con lo esperado)
grep "name:" src/constants/criteria.ts | wc -l

# 3. Ver datos en DB para el criterio nuevo/modificado
DB_URL=$(grep DATABASE_URL /Users/fabianortega/src/epicrisis_backend/.env | cut -d'"' -f2)
psql "$DB_URL" -c "
  SELECT criterion_name, COUNT(*) as n
  FROM annotations
  GROUP BY criterion_name
  ORDER BY criterion_name;
"
```

---

## Referencia: estructura de COMORBIDITIES

```typescript
// src/constants/criteria.ts
export interface Criterion {
  name: string       // clave interna — debe ser única y estable
  label: string      // texto visible en UI
  icd10Hint?: string // código ICD-10 (opcional)
}

export const COMORBIDITIES: Criterion[] = [
  { name: 'hipertension_arterial', label: 'Hipertensión Arterial', icd10Hint: 'I10' },
  // ... (ordenados por relevancia clínica)
]
```

El orden en el array determina el orden en la UI y en la matriz de admin.

---

## Uso

Cuando el usuario pida agregar, borrar o renombrar un criterio:

1. Leer esta skill
2. Identificar la operación (agregar / cambiar label / renombrar name / eliminar)
3. Seguir los pasos correspondientes
4. Ejecutar verificación post-cambio
5. Commitear solo `criteria.ts` (y el SQL de migración si aplica)
