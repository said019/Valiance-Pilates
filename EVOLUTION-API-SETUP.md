# Evolution API — Setup Valiance Pilates

Guía paso a paso para conectar el WhatsApp del estudio (`+52 55 2317 3402`) al backend usando Evolution API en un proyecto **NUEVO** en Railway.

---

## Resumen

| | |
|---|---|
| **Proveedor** | Evolution API (Baileys, gratis) |
| **Número WhatsApp** | `525523173402` (configurado en `system_settings.studio_info.whatsapp`) |
| **Instancia** | `valiance-pilates` |
| **Backend que llama Evolution** | `https://valiancepilates.com.mx` |

---

## Paso 1 · Crear nuevo proyecto Railway para Evolution API

1. Entra a [railway.app](https://railway.app) → **New Project**
2. Elige **Empty Project**
3. Nómbralo: `valiance-evolution-api`

### 1.1 Agregar PostgreSQL (Evolution lo requiere)

- Dentro del proyecto: **+ Create** → **Database** → **Add PostgreSQL**
- Railway crea la variable `DATABASE_URL` automáticamente

### 1.2 Desplegar Evolution API

**Opción A — desde GitHub oficial (recomendado):**

1. Fork del repo: https://github.com/EvolutionAPI/evolution-api
2. En Railway → **+ Create** → **GitHub Repo** → selecciona tu fork
3. Railway lo construye con el `Dockerfile` del repo

**Opción B — Docker image directo:**

1. **+ Create** → **Empty Service** → **Settings** → **Source** → **Docker Image**
2. Image: `atendai/evolution-api:v2.2.3`

### 1.3 Variables de entorno del servicio Evolution

En el servicio Evolution → **Variables**, pega esto:

```env
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=${{RAILWAY_PUBLIC_DOMAIN}}

DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}?sslmode=require
DATABASE_CONNECTION_CLIENT_NAME=valiance_evolution

AUTHENTICATION_API_KEY=46add0ce8ccbd62bbcfd411bab827875
AUTHENTICATION_TYPE=apikey

WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://valiancepilates.com.mx/api/webhook/evolution
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
WEBHOOK_EVENTS_QRCODE_UPDATED=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=false
WEBHOOK_EVENTS_SEND_MESSAGE=false

QRCODE_LIMIT=30

CACHE_REDIS_ENABLED=false
RABBITMQ_ENABLED=false
SQS_ENABLED=false
WEBSOCKET_ENABLED=false

LOG_LEVEL=ERROR,WARN,INFO
LOG_COLOR=false
DEL_INSTANCE=false
```

> **API key generada para Valiance:** `46add0ce8ccbd62bbcfd411bab827875` — guárdala, la necesitas en el paso 2.

### 1.4 Generar dominio público

- Servicio Evolution → **Settings** → **Networking** → **Generate Domain**
- Anota la URL, ej: `https://valiance-evolution-api-production.up.railway.app`

---

## Paso 2 · Configurar el backend de Valiance

En el proyecto **principal de Valiance** en Railway → servicio backend → **Variables**, agrega:

```env
EVOLUTION_API_URL=https://valiance-evolution-api-production.up.railway.app
EVOLUTION_API_KEY=46add0ce8ccbd62bbcfd411bab827875
EVOLUTION_INSTANCE_NAME=valiance-pilates
```

Reemplaza `EVOLUTION_API_URL` con la URL real que generó Railway en el paso 1.4.

Railway redespliega automáticamente al guardar las variables.

---

## Paso 3 · Conectar el WhatsApp del estudio

1. Inicia sesión como admin en https://valiancepilates.com.mx/auth/login
2. Ve a **Configuración** → pestaña **WhatsApp**
3. La interfaz debe mostrar:
   - Estado: **Desconectado**
   - Botón **"Conectar WhatsApp"**
4. Toca el botón → aparece un **QR code**
5. En el celular del estudio (que tiene el número `+52 55 2317 3402`):
   - WhatsApp → ⋮ → **Dispositivos vinculados** → **Vincular un dispositivo**
   - Escanea el QR
6. La página debe cambiar a **Conectado** automáticamente

---

## Paso 4 · Probar mensajes

Desde **Configuración** → **WhatsApp** → **Probar templates**:

| Template | Cuándo se envía |
|---|---|
| Membresía activada | Al aprobar una orden |
| Reserva confirmada | Al reservar clase |
| Reserva cancelada | Al cancelar reserva |
| ~~Recordatorio 2h antes~~ | **Apagado** (config Valiance) |
| Recordatorio semanal | Cron semanal |
| Renovación próxima | 3 y 1 día antes de vencer |
| Renovación última clase | Cuando queda 1 clase |

El admin puede tocar cualquier botón **"Enviar prueba"** para validar que llegue al número que registres.

---

## Troubleshooting

### El backend dice `Evolution API not configured`
→ Faltan `EVOLUTION_API_URL` o `EVOLUTION_API_KEY` en Railway. Revisa el paso 2.

### El QR no aparece
→ Revisa que el servicio Evolution esté corriendo (Railway → Logs). Si el dominio público no responde, regenera el dominio en Networking.

### El QR aparece pero no se vincula
→ El QR expira en ~30 segundos. Si tu sesión de WhatsApp está rota, cierra todo, espera 1 min y vuelve a intentar.

### Mensajes salen pero no llegan
→ El número del estudio fue desvinculado. Vuelve al paso 3.

### Quiero apagar TODOS los WhatsApp temporalmente
→ Admin → Configuración → desactiva el toggle global, o setea en DB:
```sql
UPDATE system_settings
SET value = jsonb_set(value, '{whatsapp_reminders}', 'false')
WHERE key = 'notification_settings';
```

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│  RAILWAY · valiance-pilates (proyecto actual)            │
│                                                           │
│  ┌────────────┐      ┌──────────────────────────────┐   │
│  │ Web/API    │ ──► sendWhatsAppNow(number, text)   │   │
│  │ Express    │      → evolutionApi.post(/sendText) │   │
│  └────────────┘                                       │   │
│        │                                              │   │
│  ┌─────▼──────┐                                      │   │
│  │ PostgreSQL │ ← system_settings, bookings, etc.    │   │
│  └────────────┘                                      │   │
└──────────────────────────────────────────────────────┼───┘
                                                       │ HTTP REST
                                                       │ x-api-key header
┌──────────────────────────────────────────────────────▼───┐
│  RAILWAY · valiance-evolution-api (proyecto NUEVO)       │
│                                                           │
│  ┌─────────────────┐    ┌──────────────────────────┐     │
│  │ Evolution API   │ ←► │ Baileys (sesión WA)      │     │
│  │ Express :8080   │    │ instance: valiance-pilates│     │
│  └─────────────────┘    └──────────────────────────┘     │
│        │                                                  │
│  ┌─────▼──────────┐                                      │
│  │ PostgreSQL     │ ← persistencia de sesión Baileys     │
│  └────────────────┘                                      │
└───────────────────────────────────────────────────────────┘
```

El backend sólo necesita 3 variables (`URL`, `KEY`, `INSTANCE_NAME`) y todo lo demás se hace en el panel admin.
