# Dominio de Idearium

Glosario y reglas ya acordadas. El detalle y su origen están en `docs/`; aquí va lo mínimo para no
confundir términos. Lo que no aparece aquí ni en `docs/` no está decidido.

## Términos

| En la interfaz | En el código | Qué es |
|---|---|---|
| Cátedra | `Track`: `INNPRENDE_I`, `INNPRENDE_II` | Las dos asignaturas. I es investigación (póster); II es prototipado (prototipo y pitch) |
| Despegue / Aterrizaje | `Track#label()` | La muestra de INNPRENDE I y la de INNPRENDE II (antes Expoideas 1 y 2) |
| Edición | `Edition`, `EditionTrack` | Una vuelta de la Expo: apertura y cierre de inscripciones, cierre de entregas, y por cátedra el mínimo y máximo de integrantes |
| Proyecto | `Project`, `ProjectMember` | La inscripción de un equipo en una cátedra de una edición. Si el grupo vuelve, se inscribe otra vez: no es el mismo proyecto |
| Líder / integrante | `MemberRole`: `LEADER`, `MEMBER` | Líder es quien inscribe |
| Invitación | `MembershipStatus`: `INVITED`, `ACCEPTED` | Nadie entra a un equipo sin aceptar |
| Resultado | `ProjectResult`: `APPROVED`, `NOT_APPROVED` | Lo registra el profesor o la gestión tras el cierre de entregas |
| Aprobación manual | `TrackApproval` | La gestión da por aprobada INNPRENDE I a quien la cursó antes de la plataforma |
| Entregable | `DeliverableType` (lo que se pide) y `Deliverable` (lo subido) | Tipo `DOCUMENT`, `IMAGE`, `ANY` o `LINK`; puede llevar plantilla, cierre propio y pedirse solo a un tipo de prototipo |
| Tipo de prototipo | `PrototypeType` | Catálogo de INNPRENDE II. Nace vacío |
| Sustentación | `Presentation` | Fecha y hora por proyecto, con aviso por correo |
| Jurado | `JuryAssignment` | Una asignación por proyecto, no solo un rol |
| Evaluación | `Rubric` → `RubricCriterion` → `RubricLevel`; `Evaluation` → `EvaluationScore` | Una rúbrica por cátedra; cada jurado asignado califica criterio por criterio |
| Listado de la cátedra | `RosterEntry` | CSV que da el rol al registrarse |
| Gestión | `Role#isManagement()` | `ADMIN` y `MACONDOLAB` juntos |

## Roles

`STUDENT` (con el que nace toda cuenta), `TEACHER`, `JUDGE`, `MACONDOLAB` y `ADMIN`. En Spring
Security `ROLE_ADMIN` incluye a `ROLE_MACONDOLAB`. MacondoLab administra estudiantes, profesores y
jurados; las cuentas de gestión solo las toca un administrador. Solo estudiantes y profesores
declaran sede y facultad.

## Reglas que ya están construidas

- Las ediciones no se solapan y abren y cierran solas según las fechas (reloj en `America/Bogota`).
- Un estudiante está en un solo proyecto por cátedra en cada edición.
- No se cursan las dos cátedras a la vez, y para inscribirse en INNPRENDE II hay que haber aprobado I.
- Cinco megas por archivo. Lo que sube un equipo es JPG, PNG, WEBP o PDF; las plantillas de la
  gestión, PDF, DOCX o PPTX. El formato se valida por contenido, no por extensión (`FileFormat`).
- Un profesor puede ser jurado de proyectos de otros, nunca del suyo.
- Nota del jurado: promedio simple de sus criterios, con un decimal. Nota del proyecto: promedio de
  sus jurados. Observación obligatoria por debajo de 3.0. «No asistió» vale 0.0.
- Si la gestión quita a un jurado, su evaluación se conserva pero deja de contar.
- El equipo ve su nota y las observaciones, sin nombres, solo cuando la gestión publica las notas de
  la cátedra en «Ediciones». Publicar no congela nada.
- El listado de la cátedra solo actúa al registrarse; a una cuenta que ya existe no le cambia nada.
  Quien figura ahí como profesor nace estudiante con ese rol por confirmar (`User.pendingRole`): lo
  recibe al verificar su correo o, si la plataforma no envía correos, cuando la gestión lo confirma
  en «Usuarios».
- Con servidor de correo y `APP_URL`, quien se registra debe abrir el enlace que le llega antes de
  usar la cuenta (paso `VERIFY_EMAIL`), y «Olvidé mi contraseña» envía otro enlace. Los enlaces son
  de un solo uso y en la base solo queda su hash (`account_tokens`).
- Cambiar o restablecer la contraseña cierra las sesiones abiertas de la cuenta. Una cuenta
  suspendida no entra, pero conserva todo lo suyo. Cinco contraseñas equivocadas seguidas bloquean
  la cuenta cinco minutos.

Detalle: [docs/rubricas.md](../../docs/rubricas.md), [docs/listado.md](../../docs/listado.md).

## Sin definir: se pregunta, no se rellena

- Los tipos de prototipo de INNPRENDE II y qué evidencia pide cada uno.
- Logos y paleta de Idearium (el monograma y los colores de ahora son provisionales).
- Sectores definitivos (los cargados son provisionales).
- Ranking, premios por sector, criterios de desempate y vitrina pública: fuera del piloto.
- Si la invitación al equipo se sigue aceptando o queda automática: en la reunión se dijeron las dos.
- Rúbrica del póster: la tabla y el encabezado del documento no coinciden; se cargó la tabla.
- Envíos automáticos de recordatorio a jurados: no está definido cuándo.
