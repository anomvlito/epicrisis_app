# Gestión del Backend con pm2

## Contexto

El backend Express de Epicrisis corre localmente en el Mac Studio. Para que sea **persistente, se reinicie automáticamente ante caídas y sobreviva reinicios del equipo**, está gestionado con **pm2** — un process manager para Node.js.

---

## Procesos pm2 activos

```
┌────┬──────────────────┬──────────┬─────────┬───────────┐
│ id │ name             │ mode     │ pid     │ status    │
├────┼──────────────────┼──────────┼─────────┼───────────┤
│  1 │ epicrisis-api    │ fork     │ (auto)  │ online    │
│  0 │ ngrok-tunnel     │ fork     │ (auto)  │ online    │
└────┴──────────────────┴──────────┴─────────┴───────────┘
```

- **epicrisis-api**: El servidor Express (`npm run dev` = `tsx watch server/index.ts`) en puerto 3001
- **ngrok-tunnel**: Túnel ngrok alternativo (dominio fijo gratuito) — convive con el túnel SSH reverso

---

## Archivos de configuración

### ecosystem.config.cjs

**Ruta:** `/Users/fabianortega/src/epicrisis_backend/ecosystem.config.cjs`

```js
module.exports = {
  apps: [
    {
      name: 'epicrisis-api',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/fabianortega/src/epicrisis_backend',
      watch: false,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: '/Users/fabianortega/.pm2/logs/epicrisis-api-out.log',
      error_file: '/Users/fabianortega/.pm2/logs/epicrisis-api-error.log',
      merge_logs: true,
    },
  ],
}
```

### LaunchAgent de pm2 (macOS)

**Ruta:** `~/Library/LaunchAgents/pm2.fabianortega.plist`

Llama a `pm2 resurrect` al iniciar sesión — restaura todos los procesos guardados con `pm2 save`.  
El binario apunta a: `/Users/fabianortega/.npm-global/bin/pm2`

---

## Comandos del día a día

### Ver estado de todos los procesos

```bash
pm2 list
```

### Ver logs en tiempo real

```bash
# Solo el backend (stdout + stderr entrelazados)
pm2 logs epicrisis-api

# Solo errores
pm2 logs epicrisis-api --err

# Últimas N líneas y sale (sin seguir)
pm2 logs epicrisis-api --lines 50 --nostream
```

### Archivos de log en disco

```bash
# Output normal (requests, arranque del servidor)
tail -f ~/.pm2/logs/epicrisis-api-out.log

# Errores (stack traces, DATABASE_URL, etc.)
tail -f ~/.pm2/logs/epicrisis-api-error.log
```

### Reiniciar el backend

```bash
pm2 restart epicrisis-api
```

### Detener / arrancar

```bash
pm2 stop epicrisis-api
pm2 start epicrisis-api
```

### Recargar sin downtime (cuando hay cambios de config)

```bash
pm2 reload epicrisis-api
```

### Guardar estado actual (para que sobreviva reinicios)

```bash
pm2 save
# Guarda en ~/.pm2/dump.pm2
# El LaunchAgent ejecuta `pm2 resurrect` al login, que lee este dump
```

### Monitoreo interactivo (tipo htop para procesos Node)

```bash
pm2 monit
```

---

## Flujo de inicio automático al reiniciar el Mac

```
1. Usuario inicia sesión en macOS
        ↓
2. LaunchAgent pm2.fabianortega.plist ejecuta:
   /Users/fabianortega/.npm-global/bin/pm2 resurrect
        ↓
3. pm2 lee ~/.pm2/dump.pm2 y restaura los procesos guardados:
   - epicrisis-api  → npm run dev  en epicrisis_backend/
   - ngrok-tunnel   → ngrok http ... 3001
        ↓
4. LaunchAgent com.epicrisis.tunnel.plist ejecuta:
   autossh -R 3001:localhost:3001 root@2.24.69.49
        ↓
5. Backend disponible en https://epicrisis.2.24.69.49.nip.io
```

---

## Ver logs desde el VPS

El backend corre en el Mac, no en el VPS. Desde el VPS solo puedes ver tráfico Nginx y probar que el túnel funciona:

```bash
# Conectarse al VPS
ssh root@2.24.69.49

# Logs de requests que llegan por Nginx
tail -f /var/log/nginx/access.log

# Verificar que el túnel está activo en el VPS
ss -tlnp | grep 3001

# Probar el backend desde el VPS (a través del túnel SSH)
curl http://localhost:3001/api/epicrisis
```

Para ver los logs del backend Express, usa los comandos pm2 en tu Mac (sección arriba).

---

## Notas

- `tsx watch` recarga el servidor automáticamente cuando editas archivos TypeScript — pm2 no entra en conflicto porque no tiene `watch: true`.
- Si ves `DATABASE_URL is not defined` en los error logs, es normal durante los primeros milisegundos de un hot-reload de tsx. Si persiste, verifica que el archivo `.env` existe en `epicrisis_backend/`.
- `pm2 save` hay que correrlo **cada vez que agregues o elimines un proceso** para que el dump esté actualizado.
