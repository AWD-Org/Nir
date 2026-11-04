# Nir

AMOXTLI Nir: una tarjeta NFC con QR de respaldo en cada mesa abre la página del negocio, tipo Linktree, con **Carta**, **Déjanos tu reseña**, **Redes sociales** y **Wi-Fi**. El dueño la administra desde `/admin` y el equipo de AMOXTLI® opera cuentas, pagos y tarjetas desde `/console`.

- Producto y reglas: [`PRODUCT.md`](PRODUCT.md)
- Dirección visual: [`DESIGN.md`](DESIGN.md)
- Alcance completo: PRD interno v1.3 y documento "Tecnologías e infraestructura"

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Firebase Authentication (correo y Google) · Cloud Firestore (plan Spark, sin Storage: las fotos se guardan como `Bytes`) · Netlify · GitHub Actions.

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Landing con demo interactiva |
| `/registro`, `/entrar`, `/recuperar` | Cuentas |
| `/admin` | App del dueño: inicio, carta, página, estadísticas, cuenta |
| `/admin/bienvenida` | Asistente inicial (nombre, slug, logo, portada) |
| `/admin/vista-previa` | Vista previa privada (RF20) |
| `/console` | Consola AMOXTLI®: negocios, por vencer, auditoría |
| `/{slug}` | Página pública (ISR, se revalida al publicar) |
| `/{slug}/{mesa}-{sufijo}` | Toque de tarjeta (`?s=qr` en el QR): valida, cuenta y redirige |
| `/img/{id}/{thumb\|full}` | Fotos desde Firestore con caché permanente |
| `/api/track` | Visitas por enlace y clics (solo contadores) |
| `/api/cron/statuses`, `/api/cron/purge` | Tareas programadas (requieren `CRON_SECRET`) |

## Estructura

```
app/            rutas (landing, auth, admin, console, página pública, api)
components/     UI (admin, console, public, landing, ui)
lib/domain/     tipos, esquemas Zod, estados, cobro, slugs, precios, publicación
lib/server/     sesión, acceso a Firestore, publicación, auditoría, estadísticas
lib/firebase/   cliente (solo Auth) y Admin SDK
lib/themes/     plantillas Noche, Mercado y Claro con control de contraste
lib/cards/      sufijos, PDF para imprenta, grabado Web NFC
lib/media/      compresión a WebP en el navegador
scripts/        roles, datos de prueba, respaldo
tests/          unitarias, reglas (emulador) y flujo completo (Playwright)
```

Decisión de implementación: el navegador solo usa Firebase Auth. Toda lectura y escritura de datos pasa por Server Actions con el Admin SDK, que validan la sesión y el `tenantId` antes de escribir. Las reglas de Firestore se mantienen como segunda barrera (y se prueban en CI). Cada cambio del dueño se publica al instante en `public/page` y revalida `/{slug}`, así que no hay botón de "Publicar".

## Desarrollo local

Requisitos: Node 22 y Java 21 (para Firebase Emulator Suite).

```bash
npm install
cp .env.example .env.local     # deja NEXT_PUBLIC_USE_EMULATORS=true y descomenta los *_EMULATOR_HOST
npm run emulators              # terminal 1: Auth + Firestore + UI en :4000
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run seed
npm run dev                    # terminal 2: http://localhost:3000
```

El seed crea `superadmin@nir.test`, `vendedor@nir.test` y `dueno@nir.test` (contraseña `nir-prueba-2026`) y el negocio ficticio **Bar de Prueba** en `/bar-de-prueba` con 6 tarjetas.

### Pruebas

```bash
npm run typecheck
npm test            # unitarias: estados, cobro, slugs, precios, plantillas, publicación
npm run test:rules  # reglas de Firestore en el emulador (aislamiento entre negocios, un negocio por cuenta)
npx playwright test # flujo completo; necesita emuladores + seed + next start (ver .github/workflows/ci.yml)
```

## Puesta en marcha

1. **Firebase** (`nir-dev` y `nir-prod`, plan Spark): activar Authentication con correo/contraseña y Google; dejar "una cuenta por dirección de correo"; agregar `nir.amoxtli.tech` como dominio autorizado; crear Firestore; crear la app web y una cuenta de servicio.
2. **Reglas e índices**: `npx firebase deploy --only firestore:rules,firestore:indexes --project prod` (o el workflow *Reglas e índices de Firestore*).
3. **Netlify** (equipo exclusivo para Nir): conectar el repo, rama de producción `main`, variables de `.env.example`, dominio `nir.amoxtli.tech` por CNAME.
4. **Roles del equipo**: cada persona crea su cuenta en `/registro` y después `FIREBASE_SERVICE_ACCOUNT_BASE64=... npm run set-role -- correo@amoxtli.tech superadmin` (o `seller`).
5. **GitHub Actions**: secretos `NIR_URL`, `CRON_SECRET`, `FIREBASE_SERVICE_ACCOUNT_BASE64` y `BACKUP_PASSPHRASE` para estados diarios, limpieza semanal y respaldo cifrado de 30 días.

## Flujo de ramas

`dev` para el trabajo diario y Deploy Previews; `main` solo con aprobación y una publicación por semana para cuidar los créditos de Netlify.

---

Desarrollado por AMOXTLI®
