# Skill: Ship Feature

Esta skill automatiza la validación, confirmación y envío de cambios a GitHub después de completar una funcionalidad.

## Pasos de Ejecución

1. **Validación (Linting)**:
   - Ejecutar `npm run lint`.
   - Si falla, detenerse y corregir.

2. **Verificación (Build)**:
   - Ejecutar `npm run build`.
   - Si falla, detenerse y corregir.

3. **Git Workflow**:
   - `git add .`
   - `git commit -m "[tipo]: [descripción descriptiva]"`
   - `git push`

---
Uso: "Aplica la skill ship para subir estos cambios"
