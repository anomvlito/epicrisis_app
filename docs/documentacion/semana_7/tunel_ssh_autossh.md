# Túnel SSH Reverso Persistente con autossh y LaunchAgent

## Contexto

El backend de Epicrisis corre **localmente** en el Mac Studio (puerto 3001). Para que el frontend desplegado en Vercel pueda alcanzarlo, se usa un **túnel SSH reverso** hacia el VPS de Hostinger, que actúa como pasarela HTTPS pública.

```
Vercel (HTTPS) → VPS 2.24.69.49 (Nginx + certbot) → túnel SSH → localhost:3001
```

**Dominio público:** `https://epicrisis.2.24.69.49.nip.io`

---

## El problema del túnel manual

Anteriormente el túnel se iniciaba a mano con:

```bash
ssh -fN -R 3001:localhost:3001 root@2.24.69.49
```

Esto tiene dos problemas críticos:
1. **No sobrevive reinicios** del Mac — al apagar/reiniciar, el túnel muere y el backend queda inaccesible.
2. **No se reconecta** si la conexión SSH cae por inactividad o pérdida de red.

---

## Solución: autossh + LaunchAgent de macOS

### Por qué autossh

`autossh` monitorea la conexión SSH y la reinicia automáticamente si cae. Con `-M 0` delega el keepalive a los parámetros nativos de SSH (`ServerAliveInterval`), que es más confiable.

### Por qué LaunchAgent

Los **LaunchAgents** de macOS son servicios de usuario que:
- Se inician automáticamente al hacer **login**
- Se reinician solos si el proceso termina inesperadamente (`KeepAlive: true`)
- Son gestionados por el sistema operativo, sin dependencia de terminales abiertas

---

## Archivos creados

### 1. LaunchAgent Plist

**Ruta:** `~/Library/LaunchAgents/com.epicrisis.tunnel.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.epicrisis.tunnel</string>

    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/autossh</string>
        <string>-M</string>
        <string>0</string>
        <string>-N</string>
        <string>-o</string>
        <string>ServerAliveInterval=30</string>
        <string>-o</string>
        <string>ServerAliveCountMax=3</string>
        <string>-o</string>
        <string>ExitOnForwardFailure=yes</string>
        <string>-o</string>
        <string>StrictHostKeyChecking=no</string>
        <string>-i</string>
        <string>/Users/fabianortega/.ssh/id_ed25519</string>
        <string>-R</string>
        <string>3001:localhost:3001</string>
        <string>root@2.24.69.49</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/tmp/epicrisis-tunnel.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/epicrisis-tunnel.error.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>AUTOSSH_GATETIME</key>
        <string>0</string>
    </dict>
</dict>
</plist>
```

**Parámetros clave:**
| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `-M 0` | — | Desactiva el puerto de monitoreo de autossh, usa SSH nativo |
| `ServerAliveInterval=30` | 30s | Envía keepalive cada 30 segundos |
| `ServerAliveCountMax=3` | 3 intentos | Si falla 3 veces seguidas, cierra y autossh reinicia |
| `ExitOnForwardFailure=yes` | — | Si el port forwarding falla, sale (para que autossh reinicie limpio) |
| `AUTOSSH_GATETIME=0` | — | No espera tiempo mínimo antes de reconectar |

---

## Comandos de gestión

### Verificar estado

```bash
launchctl list | grep epicrisis
# Columnas: PID | EXIT_CODE | LABEL
# PID > 0 = corriendo. Exit code 0 = normal.
```

### Ver logs

```bash
# Logs normales (generalmente vacíos si todo va bien)
cat /tmp/epicrisis-tunnel.log

# Errores (útil para diagnosticar reconexiones)
cat /tmp/epicrisis-tunnel.error.log
```

### Verificar túnel en VPS

```bash
ssh root@2.24.69.49 "ss -tlnp | grep 3001"
# Debe mostrar sshd-session escuchando en 127.0.0.1:3001
```

### Verificar endpoint HTTPS completo

```bash
curl -sk https://epicrisis.2.24.69.49.nip.io/api/epicrisis
# Debe responder: {"error":"No autenticado"}
```

### Reiniciar el servicio

```bash
launchctl stop com.epicrisis.tunnel
launchctl start com.epicrisis.tunnel
```

### Cargar por primera vez (ya hecho, solo si se reinstala)

```bash
launchctl load ~/Library/LaunchAgents/com.epicrisis.tunnel.plist
```

### Desactivar permanentemente

```bash
launchctl unload ~/Library/LaunchAgents/com.epicrisis.tunnel.plist
```

---

## Arquitectura completa del acceso

```
┌─────────────────────────────────────┐
│           Mac Studio (local)        │
│                                     │
│  Express :3001  ←─ autossh ──────SSH tunnel──┐
│  PostgreSQL :5432                   │         │
└─────────────────────────────────────┘         │
                                                │
┌──────────────────────────────────────────┐    │
│         VPS Hostinger 2.24.69.49         │    │
│                                          │    │
│  Nginx (443 HTTPS + certbot)             │    │
│    ↓ proxy_pass http://127.0.0.1:3001   │    │
│  localhost:3001 ←────────────────────────────┘
│                                          │
└──────────────────────────────────────────┘
                    ↑
        HTTPS seguro (nip.io + certbot)
                    ↑
┌──────────────────────────────────────────┐
│         Vercel (frontend)                │
│  VITE_API_URL = https://epicrisis.       │
│                2.24.69.49.nip.io         │
└──────────────────────────────────────────┘
                    ↑
              Anotadores (navegador)
```

---

## Notas de mantenimiento

- El LaunchAgent **no arranca si el Mac está apagado** — es un servicio de usuario (login), no de sistema. Si se necesita que el túnel esté activo incluso sin sesión abierta, habría que moverlo a `/Library/LaunchDaemons/` con ajuste de permisos.
- **Certbot** en el VPS renueva automáticamente el certificado SSL de `nip.io` — no requiere acción manual.
- Si el VPS se reinicia, el túnel en el VPS cae pero **autossh lo detecta y reconecta automáticamente** en ~90 segundos.
- Si el Mac se reinicia, el LaunchAgent levanta autossh **al iniciar sesión**.
