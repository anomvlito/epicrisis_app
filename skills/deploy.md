# Skill: Deploy

Guía de referencia para deployar cambios en la plataforma epicrisis.

---

## Arquitectura de deploy

```
Frontend (epicrisis_app)
  git push origin main  →  Vercel auto-deploy  →  app en producción

Backend (epicrisis_backend)
  pm2 restart epicrisis-api  →  en producción inmediatamente (corre local)
  git push origin backend    →  backup/versión en GitHub (no activa deploy)
```

El backend NO corre en Vercel — corre localmente en la máquina de Fabian vía pm2, expuesto al exterior por ngrok + SSH reverse proxy. Push al repo del backend es solo control de versión.

---

## Deploy frontend → Vercel

```bash
cd /Users/fabianortega/src/epicrisis_app

# 1. Verificar build limpio antes de pushear
npm run build

# 2. Stagear archivos relevantes (nunca `git add .` — puede incluir dist/ u otros)
git add src/ skills/

# 3. Commit
git commit -m "feat|fix|chore(scope): descripción corta

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# 4. Push → dispara Vercel automáticamente
git push origin main
```

Vercel detecta el push a `main` y hace build + deploy en ~1-2 minutos.

---

## Deploy backend (local → pm2)

```bash
cd /Users/fabianortega/src/epicrisis_backend

# 1. Si hay migraciones de DB pendientes, correrlas primero
export $(grep -v '^#' .env | xargs) && npx tsx db/migrate_vX.ts

# 2. Reiniciar proceso (el código ya está en el filesystem local)
pm2 restart epicrisis-api

# 3. Verificar que quedó online
pm2 status

# 4. Opcional: push a GitHub para versionar
git add api/ db/
git commit -m "fix|feat(scope): descripción"
git push origin backend
```

---

## Checklist pre-deploy

Antes de cualquier push a main verificar:

```bash
# Frontend build limpio
cd /Users/fabianortega/src/epicrisis_app && npm run build

# No hay secrets en los archivos a commitear
git diff --staged | grep -i "password\|secret\|key\|token" | grep -v "node_modules"

# Criterios cuentan bien
grep "name:" src/constants/criteria.ts | wc -l
```

---

## Qué va en cada repo

| Archivo/carpeta | Repo | Rama |
|----------------|------|------|
| `src/` | epicrisis_app | main |
| `skills/` | epicrisis_app | main |
| `public/` | epicrisis_app | main |
| `api/` | epicrisis_backend | backend |
| `db/` | epicrisis_backend | backend |

**Nunca commitear:** `dist/`, `node_modules/`, `.env`, archivos de migración temporales (a menos que sean parte del historial).

---

## Estado actual del deploy (referencia)

- Frontend: Vercel, rama `main`
- Backend: pm2 proceso `epicrisis-api` en local, expuesto vía ngrok
- DB: PostgreSQL local

Para ver estado del backend:
```bash
pm2 status
pm2 logs epicrisis-api --lines 30
```
