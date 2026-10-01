# Reunión con MacondoLab: revisión de la plataforma (septiembre de 2026)

Demostración del flujo completo (registro, roles, proyectos, invitaciones, entregables y jurados)
ante la Cátedra INNPRENDE. Este resumen sale de una transcripción automática de mala calidad: lo
marcado con **(?)** no quedó claro y hay que confirmarlo antes de construirlo.

Los documentos de apoyo (rúbricas, formularios de registro y evaluación, nombres e identidad
visual) están en la carpeta **DOCUMENTOS DE APOYO** del SharePoint del proyecto. Todavía no están
en el repositorio.

## Decisiones y pedidos

| # | Tema | Qué se pidió | Estado |
|---|---|---|---|
| 1 | Registro | Solo correo institucional y contraseña. Vínculo, facultad y campus salen del registro: van al perfil o los asigna el administrador | **Hecho (F1):** el primer ingreso tiene el paso obligatorio «Completa tu perfil» |
| 2 | Roles | Todos entran como estudiante y el administrador cambia el rol. Una persona puede tener **varios roles** (un profesor puede ser jurado de proyectos de otros profesores) | **Hecho (F4):** ser jurado es una asignación por proyecto, no un rol; un profesor puede ser jurado de proyectos de otros, nunca del suyo |
| 3 | Rol en vivo | Al cambiar el rol de alguien, esa persona tuvo que cerrar sesión para verlo | **Hecho (F1):** la app consulta el rol cada minuto y al volver a la pestaña |
| 4 | Textos | En la interfaz, «docente» pasa a ser «profesor» | **Hecho (F1)** |
| 5 | Vista del profesor | No encontraba cómo entrar al proyecto. Se pidió un botón más visible | **Hecho (F1):** botón «Ver proyecto» en el listado, en tabla y en móvil |
| 6 | Externos | Los jurados externos entran por invitación del administrador, sin correo institucional | **Hecho (F5):** la gestión crea la cuenta y la persona recibe por correo su usuario y su contraseña temporal |
| 7 | Entregables | Plantilla del póster para descargar, diligenciar y subir. Entregable nuevo: **fotos de la sustentación** como evidencia (trazabilidad) | **Hecho (F2):** cada entregable puede llevar plantilla (PDF, DOCX o PPTX), ser un enlace y tener su propio cierre. Las fotos de la sustentación se configuran como un entregable de imágenes con cierre propio |
| 8 | INNPRENDE II | Enlace externo (video en YouTube o prototipo), fotos y pitch. Lista de **tipo de prototipo** (digital, físico, etc.) y, según el tipo, qué evidencia y qué formato se piden | **Mecanismo hecho (F6):** enlaces y fotos ya se piden como entregables (F2); el catálogo de tipos nace vacío y cada entregable puede pedirse solo a un tipo. Faltan los tipos (con la profesora) |
| 9 | Prerrequisito | No se puede cursar INNPRENDE I y II a la vez. Para inscribirse en II hay que haber aprobado I | **Hecho (F3):** el profesor o la gestión registran el resultado tras el cierre de entregas; la gestión también aprueba a mano a quien cursó I antes de la plataforma |
| 10 | Precarga | Cargar el listado de estudiantes y profesores de la cátedra para asignar el rol al registrarse. Quien no esté queda como estudiante | **Hecho (F9):** la gestión carga un CSV en «Usuarios → Listado de la cátedra» ([formato](listado.md)); quien está se registra con su rol y su nombre. Falta el listado real de MacondoLab |
| 11 | Sustentaciones | El administrador asigna fecha y hora a cada equipo, y se avisa al correo institucional | **Hecho (F5):** agenda en «Sustentaciones»; el equipo y el profesor reciben el aviso, también al cambiarla |
| 12 | Evaluación | Rúbrica que se llena con clics, criterio por criterio. La nota final se calcula sola con los pesos. Observaciones opcionales (quizá obligatorias con nota baja). Recordatorio por correo al jurado con calificaciones pendientes. **WhatsApp se descartó** porque exige una sesión de WhatsApp Business siempre abierta | **Hecho (F8):** las dos [rúbricas](rubricas.md) están cargadas y cada jurado asignado califica en un tablero como el de la rúbrica en papel: arrastra la ficha de cada criterio a su nivel, o lo toca. La nota sale en vivo (promedio simple), la observación es obligatoria por debajo de 3.0 y hay botón de «no asistió». El profesor del grupo y la gestión ven la nota del proyecto en la ficha, el listado y el CSV, y la gestión recuerda por correo a los jurados con pendientes desde «Sustentaciones» |
| 13 | Marca | La plataforma pasa a llamarse **«Idearium»** (en la reunión se entendió «Ideario»). Expoideas 1 pasa a llamarse **«Despegue»** y Expoideas 2, **«Aterrizaje»**. La vitrina aún no tiene nombre. Se usarán los colores de la identidad rediseñada de la cátedra | **Nombres hechos (F7a):** MacondoLab los confirmó el 30 de septiembre. Faltan logos y paleta |
| 14 | Fuera del piloto | Ranking, parte social y vista pública sin cuenta (para directivos: se habló, no se decidió) | Aplazado |

Otros puntos de la reunión:

- **Contraseñas.** La plataforma no puede usar la contraseña del correo institucional. Se puede
  recomendar a cada persona que use la misma, y el administrador puede forzar el restablecimiento.
- **5 MB por archivo.** Se confirmó el límite. La interfaz avisa y sugiere comprimir el archivo.
- **Categorías y sectores.** Los define MacondoLab. Los que hay ahora son provisionales.

## Próximos pasos

- **Piloto el martes siguiente:** 3–4 estudiantes reales se registran sin guía, desde el celular
  y desde el computador.
- **Próxima reunión:** el martes, a la misma hora.
- MacondoLab entrega los tipos de prototipo, el listado para la precarga, la identidad visual
  y los nombres definitivos.

## Plan de fases propuesto

1. **F1 · UX para el piloto:** puntos 1, 3, 4 y 5. **Hecha** (rama `feat/piloto-ux`).
2. **F2 · Entregables:** plantillas por tipo, enlaces y fotos de evidencia (punto 7). **Hecha** (rama `feat/entregables-plantillas`).
3. **F3 · Prerrequisito** de INNPRENDE I a II (punto 9). **Hecha** (en `main`).
4. **F4 · Jurados por asignación** (punto 2; la invitación de externos quedó en la F5). **Hecha** (en `main`).
5. **F5 · Agenda de sustentaciones** con aviso por correo (punto 11), más los correos de invitación y de cuenta creada (punto 6). **Hecha** (en `main`).
6. **F6 · Tipos de prototipo** en INNPRENDE II (punto 8). **Mecanismo hecho** (en `main`); los tipos los carga la gestión cuando estén definidos.
7. **F7 · Cambio de marca a Idearium** (punto 13). **Nombres hechos** (en `main`); logos y paleta, cuando lleguen los recursos.
8. **F8 · Evaluación con rúbrica** (punto 12). **Hecha** (en `main`): API y rúbricas (F8a), tablero del jurado (F8b), resultados y recordatorio (F8c).
9. **F9 · Precarga del listado** (punto 10). **Hecha** (en `main`). TI no entrega el listado por ahora: el panel queda disponible y los roles se asignan a mano.
10. **F10 · Publicación de notas** (acordada después de la reunión). **Hecha** (en `main`): la gestión publica por cátedra y el equipo ve su nota y las observaciones sin nombres.

## Por confirmar

- Rúbrica del póster: los valores de la tabla no coinciden con los que anuncia el encabezado del
  documento, ni los nombres de los niveles con la escala. Se cargó lo que dice la tabla (detalle en
  [rubricas.md](rubricas.md)).
- ~~Si los estudiantes ven su nota y las observaciones.~~ Resuelto (F10): las ven cuando la gestión publica las
  notas de la cátedra, sin nombres de jurados.

- Invitaciones al equipo: ¿la persona invitada sigue teniendo que aceptar, o queda asociada al
  proyecto automáticamente? En la reunión se dijeron las dos cosas.

Estas y las demás decisiones abiertas del programa se llevan desde octubre de 2026 en una sola
lista, con lo que la plataforma hace mientras tanto:
[decisiones-macondolab.md](decisiones-macondolab.md).
