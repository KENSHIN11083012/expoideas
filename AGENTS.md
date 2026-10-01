# AGENTS.md

Reglas para trabajar en este repositorio. Están escritas para agentes de IA (Claude Code, Copilot,
Cursor y compañía), pero sirven igual para una persona que llega nueva.

El **[README](README.md)** dice qué es el proyecto y cómo levantarlo; este archivo dice cómo
cambiarlo sin romper lo acordado. Si los dos se contradicen, manda el README en lo técnico y este
archivo en lo de proceso; y si algo no está en ninguno, se pregunta antes de inventarlo.

## Lo mínimo que hay que saber

Idearium (antes Expoideas; el repositorio y los paquetes conservan ese nombre) es la plataforma de
la Cátedra INNPRENDE de la Universidad Simón Bolívar, con MacondoLab:
inscripción de proyectos, entregables y —cuando MacondoLab defina las rúbricas— evaluación por
jurados. Son dos aplicaciones en un mismo repositorio:

- `expoideas-api`: Spring Boot 4 · Java 25 · MySQL 8.4 · Flyway.
- `expoideas-app`: React 19 · Vite · Tailwind 4 · TanStack Query.

Para instalar y arrancar, sigue el [README](README.md#puesta-en-marcha-en-otro-equipo). No empieces
a cambiar código sin haber levantado el proyecto al menos una vez: casi todas las equivocaciones
caras vienen de suponer cómo se comporta algo.

## Reglas que no se negocian

**1. El idioma tiene sitio fijo.** El código en inglés: clases, métodos, variables, campos JSON,
rutas de la API (`/api/v1/projects`) y columnas de la base de datos. En español: comentarios,
documentación, mensajes al usuario y URLs del navegador (`/iniciar-sesion`, `/mis-proyectos`,
`/admin/ediciones`). Mezclar los dos en el mismo sitio es el error más común.

**2. Una migración aplicada no se toca.** Las de Flyway viven en
`expoideas-api/src/main/resources/db/migration/` y son historia: si el esquema cambia, se añade
`V{siguiente}__descripcion.sql`. Editar una ya aplicada rompe el arranque con un error de checksum.
Hibernate va en `ddl-auto=validate`: no crea ni modifica nada, solo comprueba que el mapeo cuadre
con lo que dejó Flyway, y si no cuadra la API no arranca.

**3. El formato lo deciden las herramientas, no el gusto.** Spotless con palantir-java-format en la
API, Prettier en la app. Se ejecutan antes de cada commit; el CI los verifica y falla si no pasan.

**4. Secretos y datos nunca entran al repositorio.** Ni `.env`, ni
`expoideas-api/config/application-local.properties`, ni dumps de base de datos, ni la carpeta
`uploads/`, ni capturas con datos reales de estudiantes. El `.gitignore` cubre lo habitual, pero la
responsabilidad es de quien hace el commit.

**5. Cinco megas por archivo.** Es una restricción de TI, no una decisión de diseño: está en la API
(`spring.servlet.multipart.max-file-size`), en la validación y en la interfaz. No se sube sin que TI
lo autorice.

**6. Lo que no está definido, no se inventa.** Rúbricas, pesos de evaluación, criterios de premios,
si habrá jurados externos: todo eso lo debe MacondoLab y está listado en el apartado **Qué falta**
del [README](README.md#qué-falta). Ante una duda de dominio se pregunta; no se rellena con datos de
ejemplo que luego alguien confunde con lo acordado.

## Cómo se trabaja

- **Por fases pequeñas.** Un cambio grande se parte en fases; cada una se construye, se prueba y se
  revisa con el usuario antes de pasar a la siguiente.
- **Rama por fase**, fusionada a `main` cuando está revisada. Los arreglos menores pueden ir directos
  a `main` si el usuario lo pide así.
- **Commits en [Conventional Commits](https://www.conventionalcommits.org/)**: `feat`, `fix`,
  `refactor`, `test`, `chore`, `docs`, `style`. El cuerpo explica *por qué*, no repite el diff. El
  historial es la referencia real del orden en que avanzó el proyecto.
- **Quien escribe el cambio, lo prueba.** No se le pide al usuario que compruebe a mano lo que se
  puede comprobar con una prueba automática o levantando la aplicación.
- **Se reporta lo que pasó de verdad.** Si una prueba falla, se dice, con su salida. Si algo quedó
  fuera, se dice qué y por qué.

### Lo que necesita permiso explícito

- `git push` a GitHub. Cada vez, aunque la vez anterior se haya autorizado.
- `git push --force` y reescribir historia publicada: **nunca**.
- Fusionar o cerrar pull requests, incluidos los de Dependabot.
- Borrar bases de datos, volúmenes de Docker, archivos subidos o ramas remotas.
- Tocar la base de datos de desarrollo de otra persona. Para probar se copia a una base desechable y
  se borra al terminar.

## Convenciones del backend

- **Un paquete por área** (`auth`, `users`, `catalogs`, `editions`, `projects`, `deliverables`,
  `reports`, `files`, `security`, `common`), no por capa técnica. Cada paquete agrupa su entidad,
  repositorio, servicio, controlador y DTOs.
- **Los módulos no se meten en las entidades de otro.** Cuando uno necesita algo de otro, se hace por
  un contrato pequeño: una interfaz de regla que el otro módulo implementa
  (`PrivateFileAccessRule`, `AccountDeletionRule`, `DeliverableAccessRule`) o un evento de Spring
  (`ProjectDeletedEvent`). Así `files` no sabe qué es un proyecto y `users` no sabe qué es un equipo.
- **Los controladores nunca devuelven entidades.** Se usan `record`s `XxxRequest` y `XxxResponse`; la
  validación va con anotaciones de Jakarta en el request.
- **Los errores siguen Problem Details (RFC 9457).** Se lanzan las excepciones de `common`
  (`ConflictException`, `ForbiddenActionException`, `InvalidFieldsException`) y las traduce
  `GlobalExceptionHandler`. El mensaje para el usuario va en `detail`, y los de validación, campo a
  campo, en `fields`.
- **Las fechas límite se comparan con el `Clock` inyectado**, no con `LocalDate.now()` suelto: está
  fijado a `America/Bogota` en `TimeConfig` y es lo que permite probar los plazos.
- **Pruebas**: unitarias con JUnit 5, Mockito y AssertJ para la lógica; `*IT` con Testcontainers
  (MySQL 8.4 real) para los recorridos completos. Un cambio de comportamiento sin prueba que falle
  si se revierte no está terminado.

## Convenciones del frontend

- **Un módulo por área** en `src/features/`, con sus páginas y sus `api.js`, `queries.js` y
  `schemas.js`. Lo compartido vive en `src/components/` (`ui/`, `layout/`, `forms/`) y `src/lib/`.
- **Las rutas están centralizadas** en `src/lib/routes.js`, en español. No se escriben URLs a mano en
  los componentes.
- **Los datos del servidor pasan por TanStack Query**; los formularios, por react-hook-form con zod.
  Los errores de campo de la API (`fields`) se pintan en el campo que corresponde.
- **Las validaciones son espejo de las de la API** (`lib/validation.js` frente a
  `ValidationPatterns.java`). Si cambia una, cambia la otra.
- **Las pruebas consultan por rol y por texto**, como lo haría quien usa la aplicación, no por
  clases de CSS ni por estructura interna. Lo responsive se verifica en un navegador real, porque
  jsdom no calcula diseño.

## Antes de dar algo por terminado

```bash
# Desde la raíz del repositorio. Los paréntesis evitan quedarse dentro de cada carpeta.
(cd expoideas-api && ./mvnw spotless:apply && ./mvnw verify)
(cd expoideas-app && npm run lint && npm run format:check && npm test && npm run build)
```

Es exactamente lo que corre el CI (`.github/workflows/ci.yml`). Las `*IT` necesitan Docker
encendido. Si algo de esto falla, el cambio no está listo, aunque «funcione».

## Dónde mirar

| Para | Archivo |
|---|---|
| Qué hace la plataforma y cómo levantarla | [README.md](README.md) |
| Instalar y operar en el servidor | [docs/despliegue.md](docs/despliegue.md) |
| Lo pendiente con TI (servidor, red, copias) | [docs/preguntas-ti.md](docs/preguntas-ti.md) |
| Lo pendiente con MacondoLab (rúbricas, premios) | «Qué falta», en el [README](README.md#qué-falta) |
| Lo acordado en la reunión de septiembre de 2026 | [docs/reunion-2026-09.md](docs/reunion-2026-09.md) |
| Las rúbricas de evaluación y cómo se calcula la nota | [docs/rubricas.md](docs/rubricas.md) |
| El formato del listado de la cátedra | [docs/listado.md](docs/listado.md) |
| Cómo se llega al estado actual | El historial de commits, en orden |
