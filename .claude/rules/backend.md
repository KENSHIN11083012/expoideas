---
paths:
  - "expoideas-api/**"
---

# Mapa del backend

Paquete base `co.edu.unisimon.expoideas`. Todas las rutas cuelgan de `/api/v1`. Las convenciones
están en AGENTS.md; esto es solo el mapa para ubicarse.

| Paquete | Controladores y rutas | Tablas | Contratos con otros módulos |
|---|---|---|---|
| `auth` | `AuthController`: `/auth/login`, `/auth/register` (públicas) | — | — |
| `security` | — | — | `JwtAuthenticationFilter`, `OnboardingFilter` (403 con los pasos de primer ingreso pendientes), `SecurityConfig` |
| `users` | `UserController` `/users/me` · `UserAdminController` `/admin/users` · `TeacherController` `/teachers` · `RosterController` `/admin/roster` | `users`, `roster_entries` | Define `AccountDeletionRule`. Publica `AccountCreatedEvent` |
| `catalogs` | `CatalogController`: `/campuses`, `/faculties`, `/academic-programs`, `/sectors`, `/keywords`, `/prototype-types` | las seis homónimas | — |
| `editions` | `EditionController` `/editions`, y `/editions/{id}/tracks/{track}/grades-publication` | `editions`, `edition_tracks` | Dueño de `Track` |
| `projects` | `ProjectController` `/projects/mine`, `/projects/{id}` (+ `/result`, `/invitations`, `/members/{userId}`) · `InvitationController` `/invitations` · `TrackApprovalController` `/admin/track-approvals` | `projects`, `project_members`, `track_approvals` | Define `ProjectVisibilityRule`. Implementa `AccountDeletionRule`. Publica `ProjectDeletedEvent` y `TeamInvitationEvent`. Permisos en `ProjectPolicy` |
| `deliverables` | `DeliverableTypeController` `/deliverable-types` (+ `/{id}/template`) · `DeliverableController` `/projects/{projectId}/deliverables` (+ `/links`) | `deliverable_types`, `deliverables` | Implementa `PrivateFileAccessRule` (entregables y plantillas) y `AccountDeletionRule`. Escucha `ProjectDeletedEvent` |
| `presentations` | `PresentationController` `/projects/{projectId}/presentation`, `/presentations` | `presentations` | Publica `PresentationScheduledEvent` |
| `jury` | `JuryController` `/projects/{projectId}/jurors`, `/jury/projects` | `jury_assignments` | Implementa `ProjectVisibilityRule` y `EvaluatorRule` |
| `evaluations` | `RubricController` `/rubrics/{track}` · `EvaluationController` `/projects/{projectId}/evaluations` (+ `/mine`), `/projects/{projectId}/grade`, `/evaluations/mine`, `/evaluations/reminders` | `rubrics`, `rubric_criteria`, `rubric_levels`, `evaluations`, `evaluation_scores` | Define `EvaluatorRule`. Implementa `AccountDeletionRule`. Publica `EvaluationReminderEvent` |
| `notifications` | — | — | `NotificationListener` envía los correos tras el commit (`AFTER_COMMIT`). Aquí viven los `record` de los eventos de correo |
| `reports` | `ProjectDirectoryController`: `GET /projects`, `GET /projects/export` (CSV) | — | Solo lectura sobre lo de los demás |
| `files` | `FileController` `/files/{id}` | `files` | Define `PrivateFileAccessRule`; no sabe qué es un proyecto |
| `common` | — | — | Excepciones, `GlobalExceptionHandler`, `ExpoideasProperties`, `TimeConfig` (el `Clock`), `ValidationPatterns` |

## Quién puede qué

Se decide en dos sitios, y hay que mirar los dos antes de añadir una ruta:

- **Por ruta y método**, en `SecurityConfig`: `/admin/**` es de la gestión (borrar cuentas, solo
  `ADMIN`); sedes, facultades y programas los escribe `ADMIN`; sectores, keywords y tipos de
  prototipo, la gestión; también ediciones, tipos de entregable, jurados, agenda y recordatorios.
  Una ruta nueva que no se declare ahí queda solo como «con sesión».
- **Por dato**, en el servicio: quién ve un proyecto (`ProjectPolicy` más las `ProjectVisibilityRule`),
  quién descarga un archivo privado (`PrivateFileAccessRule`), quién califica (`EvaluatorRule`).

## Pruebas

- `src/test/.../integration/*IT.java` heredan de `IntegrationTest`: la API completa contra un MySQL
  8.4 de Testcontainers, con un solo contenedor y un solo contexto para todas. Cada prueba crea sus
  cuentas con correos únicos; no dependen del orden.
- `@SecuredWebMvcTest` (en `support/`): controladores con la `SecurityConfig` real y sin base de
  datos. Es donde se prueba que una ruta rechaza al rol que no toca.
- `support/TestData`: datos y secreto de prueba compartidos.

## Al añadir una tabla

Migración `V{siguiente}__descripcion.sql`, entidad con `@Table(name = ...)` que cuadre columna a
columna (Hibernate va en `validate`), y si otro módulo guarda referencias a cuentas o proyectos,
su `AccountDeletionRule` o su escucha de `ProjectDeletedEvent`.
