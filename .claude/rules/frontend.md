---
paths:
  - "expoideas-app/**"
---

# Mapa del frontend

Todo bajo `expoideas-app/src`. El alias `@` apunta a `src`. La app se sirve en `/expoideas/`
(`VITE_BASE_PATH`), y `App.jsx` reutiliza ese valor como `basename` del router.

## URL → página → quién entra

Las URLs salen de `lib/routes.js` y las rutas se declaran en `App.jsx`, con carga diferida.

| URL | Página | Quién |
|---|---|---|
| `/` | `home/HomePage` | Pública |
| `/iniciar-sesion`, `/registro` | `auth/LoginPage`, `auth/RegisterPage` | Sin sesión (`GuestRoute`) |
| `/primer-ingreso` | `auth/OnboardingPage` | Cuenta con pasos pendientes |
| `/verificar-correo`, `/restablecer-contrasena` | `auth/VerifyEmailPage`, `auth/ResetPasswordPage` | Quien abre el enlace del correo, con sesión o sin ella. El token va en el fragmento (`#token=`) |
| `/recuperar-contrasena` | `auth/RecoverPasswordPage` | Sin sesión (`GuestRoute`) |
| `/mis-proyectos` | `projects/MyProjectsPage` | `STUDENT` |
| `/proyectos` | `projects/ProjectsPage` | Gestión y `TEACHER` |
| `/proyectos/:id` | `projects/ProjectPage` | Con sesión; quién lo ve lo decide la API |
| `/perfil`, `/seguridad` | `profile/ProfilePage`, `profile/SecurityPage` | Con sesión |
| `/jurado/proyectos` | `jury/JuryProjectsPage` | Gestión, `TEACHER` y `JUDGE` |
| `/jurado/proyectos/:id/calificar` | `evaluations/EvaluationPage` | Gestión, `TEACHER` y `JUDGE` |
| `/admin/usuarios` | `users/UserAdminPage` (con `RosterPanel`) | Gestión |
| `/admin/catalogos` | `catalogs/CatalogsPage` | Gestión |
| `/admin/ediciones` | `editions/EditionsPage` | Gestión |
| `/admin/sustentaciones` | `presentations/PresentationsPage` | Gestión |
| `/no-autorizado`, cualquier otra | `errors/` | — |

`ProtectedRoute` solo evita ofrecer lo que la API rechazaría: el permiso real está en la API.

## Piezas que viven dentro de otra página

- La ficha del proyecto (`ProjectPage`) monta `deliverables/ProjectDeliverables`,
  `jury/JurorsPanel`, `evaluations/ProjectEvaluations`, `evaluations/MyGrade` y la sustentación.
- `EditionsPage` abre `deliverables/DeliverableTypesDialog` y publica las notas por cátedra.
- `evaluations/RubricBoard` es el tablero del jurado (arrastrar con `@dnd-kit` o tocar). Lo marcado
  y sin guardar queda como borrador en localStorage, por jurado y proyecto (`evaluations/draft.js`);
  se borra al guardar y no al cerrar la sesión.
- El menú está en `components/layout/SiteHeader.jsx`: una página nueva se añade en `routes.js`,
  en `App.jsx` y ahí.

## Lo compartido

- `lib/apiClient.js`: único cliente HTTP. Un 401 a una petición que llevaba el token dispara
  `expoideas:unauthorized` y cierra la sesión (el inicio de sesión lo explica con `sessionExpired`);
  un 403 por primer ingreso dispara `expoideas:onboarding-required`.
- La sesión vive en localStorage y es de todas las pestañas: `AuthProvider` escucha `storage` y, si
  en otra pestaña entra otra cuenta, vuelve a montar lo que hay en pantalla.
- `lib/queryState.js` (`blockingError`): una página con formulario solo se reemplaza por el error si
  no hay datos o si la API responde 4xx. Un fallo pasajero al volver a consultar no la quita.
- `components/layout/ErrorBoundary.jsx`: uno alrededor de toda la app (`main.jsx`) y otro alrededor
  de la página (`AppShell`). Si falta un archivo de la versión anterior, recarga sola una vez
  (`lib/staleChunk.js`).
- `lib/roles.js`, `lib/tracks.js` y `lib/validation.js` son espejo de `Role.java`, `Track.java` y
  `ValidationPatterns.java`.
- `components/ui/` son los primitivos (Radix más Tailwind), `components/forms/` lo que comparten
  los formularios (`FormDialog`, campos de contraseña, consentimiento) y `components/layout/` el
  armazón.

## Pruebas

Vitest con jsdom. `src/test/setup.js` prepara el entorno, `src/test/utils.jsx` trae el render con
los proveedores y `src/test/fixtures.js` los datos de ejemplo. Cada `*.test.jsx` va junto a lo que
prueba.

## Formato

Prettier con cuatro espacios (`.prettierrc.json`). `npm run format` lo aplica; el CI corre
`format:check`.
