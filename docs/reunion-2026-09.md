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
| 2 | Roles | Todos entran como estudiante y el administrador cambia el rol. Una persona puede tener **varios roles** (un profesor puede ser jurado de proyectos de otros profesores) | Revisar el modelo actual |
| 3 | Rol en vivo | Al cambiar el rol de alguien, esa persona tuvo que cerrar sesión para verlo | **Hecho (F1):** la app consulta el rol cada minuto y al volver a la pestaña |
| 4 | Textos | En la interfaz, «docente» pasa a ser «profesor» | **Hecho (F1)** |
| 5 | Vista del profesor | No encontraba cómo entrar al proyecto. Se pidió un botón más visible | **Hecho (F1):** botón «Ver proyecto» en el listado, en tabla y en móvil |
| 6 | Externos | Los jurados externos entran por invitación del administrador, sin correo institucional | Listo para construir |
| 7 | Entregables | Plantilla del póster para descargar, diligenciar y subir. Entregable nuevo: **fotos de la sustentación** como evidencia (trazabilidad) | **Hecho (F2):** cada entregable puede llevar plantilla (PDF, DOCX o PPTX), ser un enlace y tener su propio cierre. Las fotos de la sustentación se configuran como un entregable de imágenes con cierre propio |
| 8 | INNPRENDE II | Enlace externo (video en YouTube o prototipo), fotos y pitch. Lista de **tipo de prototipo** (digital, físico, etc.) y, según el tipo, qué evidencia y qué formato se piden | Faltan los tipos (con la profesora) |
| 9 | Prerrequisito | No se puede cursar INNPRENDE I y II a la vez. Para inscribirse en II hay que haber aprobado I | Listo para construir |
| 10 | Precarga | Cargar el listado de estudiantes y profesores de la cátedra para asignar el rol al registrarse. Quien no esté queda como estudiante | Falta el listado |
| 11 | Sustentaciones | El administrador asigna fecha y hora a cada equipo, y se avisa al correo institucional | Listo para construir |
| 12 | Evaluación | Rúbrica que se llena con clics, criterio por criterio. La nota final se calcula sola con los pesos. Observaciones opcionales (quizá obligatorias con nota baja). Recordatorio por correo al jurado con calificaciones pendientes. **WhatsApp se descartó** porque exige una sesión de WhatsApp Business siempre abierta | La rúbrica está en el SharePoint |
| 13 | Marca | La plataforma pasa a llamarse **«Ideario»**. Expoideas 1 pasa a llamarse **«Despegue»** y Expoideas 2, **«Atea» (?)**. La vitrina aún no tiene nombre. Se usarán los colores de la identidad rediseñada de la cátedra | Faltan logos y paleta |
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
3. **F3 · Prerrequisito** de INNPRENDE I a II (punto 9).
4. **F4 · Roles:** varios roles por persona e invitación de externos (puntos 2 y 6).
5. **F5 · Agenda de sustentaciones** con aviso por correo (punto 11).
6. **F6 · Tipos de prototipo** en INNPRENDE II (punto 8), cuando estén definidos.
7. **F7 · Cambio de marca a Ideario** (punto 13), cuando lleguen los recursos.
8. **F8 · Evaluación con rúbrica** (punto 12).

## Por confirmar

- Invitaciones al equipo: ¿la persona invitada sigue teniendo que aceptar, o queda asociada al
  proyecto automáticamente? En la reunión se dijeron las dos cosas.
- El nombre definitivo de Expoideas 2.
