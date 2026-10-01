# Listado de la cátedra

> **Estado (septiembre de 2026):** TI no entrega este listado por ahora. El panel queda disponible por si
> llega; mientras tanto todos se registran como estudiantes y el administrador asigna los roles a mano.

Lo que MacondoLab carga en «Usuarios → Listado de la cátedra» para que cada persona se registre con
su rol (reunión de septiembre de 2026, punto 10). Quien está en el listado nace como estudiante o
profesor según diga; quien no está, como estudiante, y el administrador le cambia el rol a mano.

## El archivo

Un CSV, como lo exporta Excel con «Guardar como → CSV». La primera fila trae los títulos; las
columnas pueden ir en cualquier orden.

| Columna | Obligatoria | Qué va |
|---|---|---|
| `correo` | Sí | El correo institucional (`@unisimon.edu.co`). También vale `email`. |
| `rol` | Sí | `estudiante` o `profesor` (también `docente`). |
| `nombres` | No | Si viene, la persona lo ve puesto al completar su perfil y puede corregirlo. |
| `apellidos` | No | Igual que los nombres. |

Ejemplo (`listado-catedra.csv`, se descarga como plantilla desde la pantalla):

```csv
correo;rol;nombres;apellidos
ana.perez@unisimon.edu.co;estudiante;Ana María;Pérez
carlos.mendoza@unisimon.edu.co;profesor;Carlos;Mendoza
```

Se aceptan punto y coma o coma como separador, tildes en UTF-8 o en la codificación de Windows, y
mayúsculas en el correo (se guarda en minúsculas).

## Reglas

- Cargar otra vez **añade y actualiza**; no borra a nadie. Para quitar, se usa la pantalla (fila a
  fila o «Vaciar listado»).
- Las filas con correo no institucional, rol desconocido o correo repetido dentro del archivo se
  rechazan y se muestran con su línea; el resto entra igual.
- El listado solo actúa **al registrarse**. Si el correo ya tiene cuenta, no se le cambia nada: eso
  sigue siendo cosa del administrador en «Usuarios».
- Solo estudiantes y profesores. Los jurados externos entran por invitación de la gestión.
