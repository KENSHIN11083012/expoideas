---
paths:
  - "expoideas-api/**"
---

# Mapa del backend

Paquete base `co.edu.unisimon.expoideas`. Todas las rutas cuelgan de `/api/v1`. Las convenciones
están en AGENTS.md; esto es solo el mapa para ubicarse.

| Paquete | Controladores y rutas | Tablas | Contratos con otros módulos |
|---|---|---|---|
| `auth` | `AuthController`: `/auth/login`, `/auth/register`, `/auth/email-verification` (+ `/resend`), `/auth/password-recovery`, `/auth/password-reset` (públicas) | — | — |
| `security` | — | — | `JwtAuthenticationFilter`, `OnboardingFilter` (403 con los pasos de primer ingreso pendientes), `SecurityConfig` |
| `users` | `UserController` `/users/me` · `UserAdminController` `/admin/users` · `TeacherController` `/teachers` · `RosterController` `/admin/roster` | `users`, `roster_entries`, `account_tokens` | Define `AccountDeletionRule`. Publica `AccountCreatedEvent` |
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
| `audit` | `AuditController`: `GET /admin/audit` (solo `ADMIN`; filtros `action`, `from`, `to`; paginada) | `audit_events` | `AuditListener` guarda cada `AuditableAction` en la misma transacción que la acción |
| `common` | — | — | Excepciones, `GlobalExceptionHandler`, `ExpoideasProperties`, `TimeConfig` (el `Clock`), `ValidationPatterns`, `AuditableAction` (el evento del rastro) |

## Quién puede qué

Se decide en dos sitios, y hay que mirar los dos antes de añadir una ruta:

- **Por ruta y método**, en `SecurityConfig`: `/admin/**` es de la gestión (borrar cuentas y leer
  el rastro de auditoría, solo `ADMIN`); sedes, facultades y programas los escribe `ADMIN`; sectores, keywords y tipos de
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
- Para lo que solo falla si dos peticiones llegan a la vez, `IntegrationTest.atTheSameTime(...)` las
  lanza juntas; se repite unas vueltas, porque una carrera no sale siempre.

## Contar y luego guardar

Una regla del tipo «cabe uno más» (cupo del equipo, archivos de un entregable) no se sostiene solo
con comprobar y después insertar: dos peticiones a la vez cuentan lo mismo. Hay dos defensas, y
se usa la que aplique:

- **Una restricción en la base**, cuando la regla se puede escribir como unicidad. Es el caso de
  «un equipo aceptado por persona y edición» (`V15`); el servicio guarda con `saveAndFlush` y
  traduce el rechazo con `ProjectPolicy.onTeamSave`.
- **`ProjectPolicy.lock(projectId)` como primera lectura de la transacción**, cuando hay que contar.
  Tiene que ir antes que cualquier otra consulta: MySQL fija lo que la transacción ve en su primera
  lectura normal.

## El rastro de auditoría

Lo que después hay que poder explicar (cambio de rol, contraseña restablecida, cuenta suspendida o
eliminada, notas publicadas u ocultadas, evaluación corregida, jurado quitado, proyecto o
entregable eliminado) se publica como `AuditableAction` desde el servicio donde ocurre:

```java
events.publishEvent(new AuditableAction(Action.JUROR_REMOVED, projectId, project.getTitle(), "Jurado: …"));
```

- Se publica **dentro de la transacción** de la acción (el listener exige una abierta) y antes de
  borrar aquello de lo que se habla. Quién actuó lo pone el listener: es la cuenta de la sesión.
- `targetLabel` y `detail` son texto para leer cuando la cuenta o el proyecto ya no existan.
- Una acción nueva se añade a `AuditableAction.Action`; no hace falta migración.

## Al añadir una tabla

Migración `V{siguiente}__descripcion.sql`, entidad con `@Table(name = ...)` que cuadre columna a
columna (Hibernate va en `validate`), y si otro módulo guarda referencias a cuentas o proyectos,
su `AccountDeletionRule` o su escucha de `ProjectDeletedEvent`.
