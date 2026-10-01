# Idearium · guía de entrada para Claude Code

Este archivo no repite reglas: dice dónde está cada cosa y añade lo que no está escrito en otro
sitio. Las reglas del repositorio están en [AGENTS.md](../AGENTS.md) y se importan aquí abajo:
habiendo un `CLAUDE.md`, Claude Code ya no carga `AGENTS.md` por su cuenta.

@../AGENTS.md

## Qué leer y cuándo

| Antes de | Leer |
|---|---|
| Cualquier cambio | [AGENTS.md](../AGENTS.md): idioma, migraciones, formato, permisos |
| Tocar reglas de negocio | [rules/dominio.md](rules/dominio.md) y el doc del tema en `docs/` |
| Tocar `expoideas-api/` | [rules/backend.md](rules/backend.md): paquete → rutas → tablas → contratos |
| Tocar `expoideas-app/` | [rules/frontend.md](rules/frontend.md): URL → página → roles |
| Levantar o desplegar | [README.md](../README.md) y [docs/despliegue.md](../docs/despliegue.md) |
| Decidir algo de dominio sin definir | «Qué falta» del README y [docs/reunion-2026-09.md](../docs/reunion-2026-09.md): se pregunta, no se inventa |

## Cómo se levanta

- **Entera, con Docker** (`docker compose up -d --build`): http://localhost:8080/expoideas/. Solo la
  app publica puerto; la API y MySQL quedan en la red interna.
- **Para programar**: API en `:8080` (necesita `expoideas-api/config/application-local.properties`)
  y app en http://localhost:5173/expoideas/. Las dos formas chocan en el 8080: o se apaga Docker o
  se cambia `server.port` y `VITE_API_URL`.
- `launch.json` trae las tres para la vista previa: `docker`, `app` y `api` (esta última con
  `mvnw.cmd`, o sea Windows).

## Verificación en Windows

El bloque de AGENTS.md está escrito para Bash. En PowerShell:

```powershell
cd expoideas-api; .\mvnw.cmd spotless:apply; .\mvnw.cmd verify
cd ..\expoideas-app; npm run lint; npm run format:check; npm test; npm run build
```

`verify` incluye las `*IT`: necesitan Docker encendido y tardan varios minutos.

## Trampas conocidas

- **Dos nombres.** La plataforma es Idearium; el repositorio, los paquetes Java, la base de datos y
  la ruta `/expoideas/` siguen llamándose `expoideas`. No se renombran.
- **«Profesor», no «docente»**, en todo texto que ve el usuario. En el código el rol es `TEACHER`.
- **La siguiente migración es `V18__`.** Antes de crearla, mirar la última en `db/migration/`.
- **Espejos API ↔ app.** `Role.java` ↔ `lib/roles.js`, `Track.java` ↔ `lib/tracks.js`,
  `ValidationPatterns.java` ↔ `lib/validation.js`. Se cambian los dos lados en el mismo commit.
- **Secretos locales.** `.env`, `application-local.properties`, `uploads/` y, si existe, la carpeta
  local `qa/` (sin versionar, con credenciales de prueba) no se leen ni se suben.
  `settings.json` niega su lectura.
