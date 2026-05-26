# Skill: Auditoría de Consistencia

Checklist obligatorio antes de implementar cualquier feature que toque datos, cálculos o UI compartida entre múltiples usuarios.

---

## Cuándo usar esta skill

Ejecutar este checklist cuando el usuario pida:
- Agregar una columna/campo nuevo
- Cambiar cómo se calcula un valor (conteo, promedio, progreso, estado)
- Mostrar datos en una tabla o dashboard
- Modificar permisos o acceso por rol
- Cambiar lógica de asignación o anotación

---

## Checklist de auditoría

### 1. Valores hardcodeados

Buscar en frontend y backend por valores literales que deberían venir de una fuente de verdad.

```bash
# Criterios
grep -rn "/15\|/ 15\|/16\|/ 16" src/ --include="*.vue" --include="*.ts"

# Estados hardcodeados
grep -rn "'pending'\|'in_review'\|'reviewed'" src/ --include="*.vue" | grep -v "statusConfig\|enum\|type\|interface"

# IDs hardcodeados
grep -rn "userId.*=.*[0-9]\|assigneeId.*=.*[0-9]" src/ --include="*.ts" | grep -v "test\|mock"
```

**Preguntas a responder:**
- ¿El denominador viene de `COMORBIDITIES.length` o está hardcodeado?
- ¿Los estados de status están definidos como constante/enum o repetidos como string?
- ¿Los IDs de usuarios están hardcodeados en algún lugar?

---

### 2. Mezcla de datos multi-anotador

Buscar agregaciones que mezclan todos los usuarios cuando deberían ser por usuario.

```bash
# Aggregates sospechosos en backend
grep -n "count.*distinct\|sum.*annotations\|count.*annotations" epicrisis_backend/api/*.ts

# JOINs con annotations sin filtro de userId
grep -n "leftJoin.*annotations\|join.*annotations" epicrisis_backend/api/*.ts
```

**Preguntas a responder:**
- ¿El conteo de anotaciones está agrupado por `(epicrisis_id, user_id)` o solo por `epicrisis_id`?
- ¿El DELETE en `annotations.ts` filtra por `userId` o borra todo el epicrisis?
- ¿La query de lista de epicrisis filtra por `epicrisis_assignments` (junction) o por `assignee_id` (columna simple)?

**Señal de alerta:**
```sql
-- MALO: mezcla anotadores
count(distinct annotations.id)

-- BUENO: separado por usuario
count(*) GROUP BY epicrisis_id, user_id
```

---

### 3. Contratos de tipo frontend ↔ backend

Verificar que el tipo TypeScript del frontend coincide con lo que el backend realmente devuelve.

```bash
# Ver interfaces del servicio
grep -A 15 "export interface Admin" src/services/admin.service.ts

# Ver qué campos devuelve el endpoint
grep -A 30 "resource === 'epicrisis'" epicrisis_backend/api/admin.ts | grep "return\|json\|select"
```

**Preguntas a responder:**
- ¿El campo existe en la interfaz TS pero no lo devuelve el backend? → muerto/huérfano
- ¿El backend devuelve un campo pero el tipo TS lo tiene como opcional sin `?`?
- ¿Un `string | null` en TS corresponde a `TEXT` nullable en DB?

**Patrón de riesgo:** campos que se agregaron al backend pero nunca se actualizó la interfaz, o viceversa.

---

### 4. Datos por usuario vs. datos compartidos

Para cada campo que un anotador puede editar, preguntar: ¿debería ser por usuario?

| Tabla | Campo | ¿Por usuario? | Verificar |
|-------|-------|---------------|-----------|
| `annotations` | `is_present`, `evidence_text` | Sí (PK per user) | `annotations.userId` en todas las queries |
| `epicrisis` | `status` | No (shared) | Solo se actualiza a través de `completedAt` de assignments |
| `epicrisis_clinical_data` | fechas, comentario | Sí | Columna `user_id` en la tabla |
| `epicrisis` | `locked_by` | Temporal | Se limpia al desbloquear |

```bash
# Verificar que campos de fechas no se guardan en epicrisis directamente
grep -n "epicrisis.*update.*fecha\|update.*epicrisis.*fecha" epicrisis_backend/api/annotations.ts
```

---

### 5. Reversibilidad de estados

Los estados `status` deben poder retroceder si una condición cambia.

**Flujo correcto:**
```
pending → in_review (cuando se asigna y alguien empieza)
in_review → reviewed (cuando TODOS los asignados completan)
reviewed → in_review (si se reasigna o se quita un completado)
```

**Verificar:**
```bash
# El status se recalcula en base a completedAt, no se fuerza hacia arriba
grep -n "newStatus\|status.*reviewed\|status.*in_review" epicrisis_backend/api/annotations.ts
```

**Señal de alerta:** cualquier `UPDATE status = 'reviewed'` que no verifique que TODOS los asignados completaron.

---

### 6. Seguridad por rol

Verificar que endpoints sensibles verifican el rol en DB (no solo en JWT).

```bash
# Backend: verificación de rol fresca desde DB
grep -n "freshUser\|role.*admin\|forbidden\|403" epicrisis_backend/api/admin.ts

# Frontend: rutas protegidas por rol
grep -n "role.*admin\|requiresAuth\|meta.*admin" src/router/index.ts
```

**Patrón obligatorio en admin.ts:**
```typescript
const [freshUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, Number(authUser.sub))).limit(1)
if (!freshUser || freshUser.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' })
```

---

### 7. Estado isUnknown en cálculos

`isUnknown = true` significa "no se puede determinar" — debe excluirse de porcentajes y κ.

```bash
# IRR: verificar exclusión de isUnknown
grep -n "isUnknown" epicrisis_backend/api/admin.ts

# Frontend: verificar que el badge "?" no cuenta como Sí/No
grep -n "isUnknown\|unknown" src/components/annotation/CriterionRow.vue
```

**Señal de alerta:** cualquier cálculo de acuerdo que no filtre `isUnknown === true` primero.

---

### 8. Denominadores y totales en la UI

Verificar que los denominadores en barras de progreso y porcentajes usan la fuente de verdad.

```bash
# Buscar denominadores hardcodeados en UI
grep -rn "/ [0-9]\+\|/[0-9]\+" src/views/AdminView.vue src/components/ | grep -v "px\|rem\|em\|%\|opacity\|z-\|gap\|col-span"

# Verificar uso de COMORBIDITIES.length
grep -n "COMORBIDITIES" src/views/AdminView.vue
```

**Fuente de verdad:**
- Número de criterios: `COMORBIDITIES.length` (importar de `@/constants/criteria`)
- Número de asignados: `row.assignees.length`
- Número de completados: derivar de `assignees[i].annotatedCount === COMORBIDITIES.length`

---

## Ejecución rápida

Antes de implementar un feature, correr este bloque completo:

```bash
cd /Users/fabianortega/src/epicrisis_app

echo "=== 1. Denominadores hardcodeados ==="
grep -rn "/ 15\|/15\b\|/ 16\|/16\b" src/ --include="*.vue" --include="*.ts" | grep -v "node_modules\|dist"

echo "=== 2. Aggregates sin filtro de usuario ==="
grep -n "count(distinct.*annotations\|count.*annotations" /Users/fabianortega/src/epicrisis_backend/api/*.ts

echo "=== 3. DELETE sin userId ==="
grep -n "delete.*annotations\|annotations.*delete" /Users/fabianortega/src/epicrisis_backend/api/annotations.ts

echo "=== 4. isUnknown en IRR ==="
grep -n "isUnknown" /Users/fabianortega/src/epicrisis_backend/api/admin.ts | grep -c "continue\|filter\|skip" || echo "REVISAR: puede que isUnknown no se filtre"

echo "=== 5. Verificación de rol en admin ==="
grep -c "freshUser\|role.*admin" /Users/fabianortega/src/epicrisis_backend/api/admin.ts
```

---

## Bugs encontrados y corregidos (historial)

| Bug | Síntoma | Fix |
|-----|---------|-----|
| `annotatedCount` mezclaba anotadores | `30/15 = 200%` en panel admin | Query separada GROUP BY (epicrisis_id, user_id) |
| DELETE sin userId en annotations | Anotador B borraba datos de A | `and(eq(...epicrisisId), eq(...userId))` |
| Permiso por `assigneeId` simple | Solo anotador primario podía anotar | Consulta a `epicrisis_assignments` junction table |
| Fechas compartidas entre anotadores | Anotador B sobreescribía fechas de A | Mover fechas a `epicrisis_clinical_data` (per-user) |
| Cohen's κ con `pe = 0.5` fijo | κ incorrecto para datos desbalanceados | Marginal real: `P1(yes)*P2(yes) + P1(no)*P2(no)` |
| `isUnknown` incluido en κ | Desacuerdo artificial en criterios dudosos | `if (v1.isUnknown \|\| v2.isUnknown) continue` |
| `status` solo avanzaba, nunca retrocedía | `reviewed` atascado aunque se reasignara | Recalcular desde `completedAt` de todos los asignados |
| JWT de rol desactualizado | Admin degradado seguía teniendo acceso | Leer `users.role` desde DB en cada request admin |
