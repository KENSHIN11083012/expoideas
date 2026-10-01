# Idearium

Repositorio académico y sistema de evaluación de los proyectos de la Cátedra INNPRENDE de la
Universidad Simón Bolívar, con MacondoLab: inscripción de proyectos de INNPRENDE I (investigación) e
INNPRENDE II (prototipado), evaluación por jurados y ranking.

La plataforma se llamó **Expoideas** hasta septiembre de 2026; el repositorio, los paquetes y la ruta
de despliegue conservan ese nombre. Las muestras también tienen nombre propio: **Despegue** la de
INNPRENDE I (antes Expoideas 1) y **Aterrizaje** la de INNPRENDE II (antes Expoideas 2).

Construido sobre la arquitectura del proyecto semilla **Dattapro** (sistema de convocatorias de investigación cedido por TI), del que se reutiliza
la infraestructura técnica — auth JWT, separación en capas, catálogos maestros, layout — pero no el
dominio.

| | |
|---|---|
| `expoideas-api` | Spring Boot 4 · Java 25 · MySQL 8.4 · Spring Security + JWT · Flyway · Swagger |
| `expoideas-app` | React 19 · Vite 7 · Tailwind 4 · react-router · TanStack Query · Radix UI · react-hook-form + zod |

## Qué existe hoy

**Cuentas y catálogos**

- Autenticación: registro, login y primer ingreso con cambio de contraseña obligatorio.
- Perfil propio: foto, datos personales, seguridad (cambio de contraseña) y consentimiento de datos.
- Gestión de usuarios: ADMIN y MacondoLab crean, editan, restablecen contraseña y eliminan cuentas.
- Catálogos: sedes, facultades, programas académicos, sectores y keywords.
- Archivos: subida y descarga, hasta 5 MB, validados por contenido (JPG, PNG, WEBP, PDF).

**Dominio de la Expo**

- Ediciones: cada vuelta de la Expo con sus plazos (apertura y cierre de inscripciones, cierre de
  entregas) y la configuración de cada cátedra (mínimo y máximo de integrantes). Las ediciones no se
  solapan y la plataforma abre y cierra sola según las fechas.
- Inscripción de proyectos: el estudiante que inscribe queda como líder, elige cátedra, sector y
  docente, e invita a sus compañeros por correo; nadie entra a un equipo sin aceptar la invitación.
  Cada estudiante está en un solo proyecto por cátedra en cada edición.
- Entregables: MacondoLab define qué pide cada cátedra (nombre, formatos aceptados, si es obligatorio
  y cuántos archivos admite) y el equipo sube los suyos hasta el cierre de entregas.
- Directorio y reportes: la gestión ve todos los proyectos y filtra por edición, cátedra, sector o
  docente; cada docente ve solo los que lo nombraron. Ambos exportan la lista en CSV, con el progreso
  de entregables de cada proyecto.

## Qué falta

Lo que pidió MacondoLab en la [reunión de septiembre de 2026](docs/reunion-2026-09.md), en el
orden en que se va a construir. Ya está hecho lo del piloto: registro con solo correo y contraseña
(el nombre y la facultad se completan en el primer ingreso), el rol se actualiza sin cerrar sesión,
«profesor» en vez de «docente» y el botón «Ver proyecto» en el listado. También las plantillas
descargables por entregable, los entregables de tipo enlace y el cierre propio para las fotos de la
sustentación. Y el prerrequisito: el profesor registra el resultado del proyecto al cerrar las
entregas, aprobar INNPRENDE I habilita para II, y nadie cursa las dos a la vez. También la agenda
de sustentaciones y los avisos por correo (invitaciones, cuentas creadas por la gestión y
sustentaciones); el servidor SMTP lo pone TI. Y los jurados por asignación: la gestión asigna
profesores, jurados externos o cuentas de gestión a cada proyecto, y cada jurado ve los suyos en
«Evaluar», con sus entregables. El mecanismo de los tipos de prototipo de INNPRENDE II también
está: el catálogo (vacío hasta que MacondoLab entregue los tipos), el tipo por proyecto y los
entregables que se piden solo a un tipo. Y la evaluación: las dos [rúbricas](docs/rubricas.md)
cargadas como datos y el tablero donde cada jurado asignado califica, arrastrando la ficha de cada
criterio a su nivel o tocándolo (con «no asistió» y observación obligatoria por debajo de 3.0). La
nota del proyecto (promedio de sus jurados) la ven el profesor del grupo y la gestión en la ficha,
en el listado y en el CSV, y la gestión puede recordar por correo a los jurados lo que les falta.
Y la precarga: la gestión carga el [listado de la cátedra](docs/listado.md) y cada persona se
registra con su rol.

- Los tipos de prototipo de INNPRENDE II y qué evidencia pide cada uno (los carga la gestión en
  Catálogos y en los entregables; falta que MacondoLab los defina).
- Identidad visual de Idearium: los nombres ya están puestos; faltan los logos y la paleta (el
  monograma y los colores de ahora son provisionales).

Sin definir por MacondoLab, y por eso fuera del piloto: ranking y premios por sector, y la vitrina
pública (ver [docs/preguntas-ti.md](docs/preguntas-ti.md) para lo pendiente de infraestructura).

## Requisitos

| Herramienta | Versión | Para qué | Comprobar |
|---|---|---|---|
| Git | Cualquiera reciente | Clonar el repositorio | `git --version` |
| JDK | **25** (Eclipse Temurin) | Compilar y ejecutar la API | `java -version` |
| Node.js | **24** (fijado en `.nvmrc`) | Compilar y ejecutar la app | `node -v` |
| Docker | Engine 24+ con el plugin Compose (en Windows y macOS viene con Docker Desktop) | MySQL, pruebas de integración y despliegue | `docker --version` |

Maven no hay que instalarlo: el repositorio trae el wrapper (`mvnw` y `mvnw.cmd`). Con `nvm` (o
`nvm-windows`), `nvm install` y `nvm use` dentro del repositorio toman la versión del `.nvmrc`. El
mínimo real de Node son 22.12+, pero el CI compila con la 24: si usas otra versión y algo falla solo
en tu equipo, ese es el primer sospechoso.

MySQL 8.4 puede estar instalado en el equipo o correr en Docker; abajo se explican las dos formas.

## Estructura

Organización por módulo en los dos proyectos: cada uno agrupa lo suyo (entidad, servicio,
controlador... o página, `api.js`, `queries.js`) en vez de separar por capas técnicas.

```
expoideas-api/src/main/java/co/edu/unisimon/expoideas/
  auth/         Login y registro (rutas públicas)
  security/     JWT, filtros, SecurityConfig
  users/        Cuenta propia, gestión de usuarios, roles
  catalogs/     Sedes, facultades, programas académicos, sectores, keywords
  editions/     Ediciones de la Expo, sus plazos y la configuración de cada cátedra
  projects/     Proyectos inscritos, equipo, líder e invitaciones
  deliverables/ Qué pide cada cátedra y qué subió cada equipo
  presentations/ Agenda de sustentaciones
  jury/         Jurados asignados a cada proyecto
  evaluations/  Rúbricas, evaluación de cada jurado y nota del proyecto
  notifications/ Avisos por correo
  reports/      Directorio de proyectos y exportación a CSV
  files/        Almacenamiento y metadatos de archivos subidos
  common/       Manejo de errores y configuración centralizada (ExpoideasProperties)

expoideas-app/src/
  features/   Un módulo por área: auth, users, profile, catalogs, editions,
              projects, deliverables, home, errors
  components/ ui/ (primitivos), layout/, forms/ (compartidos entre features)
  lib/        apiClient, rutas (routes.js), roles, cátedras (tracks.js), validaciones, sesión
```

## Roles y permisos

| Rol | Quién | Puede |
|---|---|---|
| `ADMIN` | Parte técnica de la plataforma | Todo lo de MacondoLab, y además gestionar cuentas de gestión (ADMIN, MACONDOLAB) |
| `MACONDOLAB` | Coordinación de INNPRENDE I y II | Gestionar cuentas de estudiantes, docentes y jurados; administrar catálogos; abrir ediciones y configurar sus entregables; ver y exportar el directorio completo |
| `TEACHER` | Docente de la universidad | Ver y exportar los proyectos que lo nombraron. Declara sede y facultad al registrarse |
| `JUDGE` | Jurado, puede ser externo a la universidad | Sin funciones propias todavía: su módulo es la evaluación, aún por construir. Sin adscripción académica obligatoria |
| `STUDENT` | Rol con el que nace toda cuenta registrada | Inscribir un proyecto por cátedra, invitar a su equipo y subir los entregables. Declara sede y facultad al registrarse |

## Puesta en marcha en otro equipo

Dos caminos, según para qué quieras el proyecto. Los dos empiezan clonando:

```bash
git clone https://github.com/KENSHIN11083012/expoideas.git
cd expoideas
```

> **En Windows**: los bloques de abajo están escritos para una consola tipo Unix (Git Bash o WSL).
> Desde PowerShell, cambia `./mvnw` por `.\mvnw.cmd` y `cp` por `Copy-Item`.

### Camino A — solo verla funcionando (Docker)

Levanta la plataforma entera —base de datos, API y app— sin instalar Java ni Node. Es también la
forma en que se despliega en un servidor.

**1. Crear el archivo de variables**

```bash
cp .env.example .env
```

Edita `.env` y rellena los tres valores obligatorios: `MYSQL_ROOT_PASSWORD` y `DB_PASSWORD` (largas
y distintas entre sí) y `JWT_SECRET`. Para generar el secreto, con Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

O con OpenSSL, si lo tienes a mano: `openssl rand -base64 32`.

**2. Construir y arrancar**

```bash
docker compose up -d --build
```

La primera vez tarda varios minutos: compila la API con Maven y la app con Vite dentro de Docker.

**3. Comprobar que los tres servicios quedaron arriba**

```bash
docker compose ps
```

`mysql` y `api` deben decir `healthy`, y `app`, `running`. Si alguno se reinicia en bucle, mira por
qué con `docker compose logs api` (o `mysql`, o `app`).

La plataforma queda en **http://localhost:8080/expoideas/** — o en el puerto que pusieras en
`HTTP_PORT`. Solo la app publica puerto: MySQL y la API se quedan en la red interna de Docker, que
es justo lo que se quiere en un servidor.

Sigue en [Primer administrador](#primer-administrador): recién instalada, la plataforma no tiene
ninguna cuenta de gestión.

Para apagarla: `docker compose down`. Los datos sobreviven en los volúmenes de Docker; `down -v` sí
los borra, con base de datos y archivos subidos incluidos.

### Camino B — para programar

Aquí cada parte corre por separado, con recarga en caliente.

**1. Levantar MySQL**

Lo más rápido es en Docker, sin instalar nada:

```bash
docker run -d --name expoideas-mysql \
  -e MYSQL_ROOT_PASSWORD=<elige-una> -e MYSQL_DATABASE=expoideas \
  -p 3306:3306 mysql:8.4 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

Las siguientes veces basta con `docker start expoideas-mysql`. Si prefieres MySQL instalado en el
equipo, crea la base a mano:

```sql
CREATE DATABASE expoideas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

En los dos casos el esquema lo crea la API sola al arrancar: Flyway aplica las migraciones de
`expoideas-api/src/main/resources/db/migration/`. No hay scripts que ejecutar a mano.

**2. Configurar la API**

```bash
cd expoideas-api
cp config/application-local.properties.example config/application-local.properties
```

Abre ese archivo y pon la contraseña de MySQL y un `expoideas.jwt.secret` nuevo (el mismo comando de
Node del camino A). Está ignorado por git: nunca se sube.

**3. Arrancar la API**

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Está lista cuando el log dice `Started ExpoideasApiApplication`. Compruébalo:

```bash
curl http://localhost:8080/actuator/health
```

Debe responder `{"status":"UP"}`.

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html` (apagado en el perfil `prod`)

**Correos en desarrollo (opcional).** La API envía avisos (invitaciones, cuentas creadas,
sustentaciones). Para verlos sin un SMTP real, levanta Mailpit y deja las líneas `spring.mail.*`
del `application-local.properties`:

```bash
docker compose --profile dev up -d mailpit
```

Los correos quedan en **http://localhost:8025**. Sin Mailpit ni SMTP, la API funciona igual y
solo deja en el log qué correo habría enviado.

**Si el puerto 8080 está ocupado** —pasa a menudo—, descomenta `server.port` en
`config/application-local.properties` (por ejemplo, `server.port=8081`) y apunta el frontend a ese
mismo puerto en el paso siguiente.

**4. Arrancar la app**

En otra consola, desde la raíz del repositorio:

```bash
cd expoideas-app
cp .env.example .env
npm ci
npm run dev
```

App en **http://localhost:5173/expoideas/**

`npm ci` —no `npm install`— instala exactamente lo que dice `package-lock.json`, que es lo mismo que
usa el CI. Si cambiaste el puerto de la API, edita `VITE_API_URL` en `expoideas-app/.env` y
**reinicia `npm run dev`**: Vite lee ese archivo solo al arrancar.

El subdirectorio `/expoideas/` sale de `VITE_BASE_PATH`. `App.jsx` lo reutiliza como `basename` del
router, así que no hay que tocarlo en dos sitios; para servir en la raíz durante el desarrollo, mira
el comentario del `.env.example`.

### Primer administrador

Toda cuenta nace como estudiante. El registro pide solo correo y contraseña; el nombre y la
adscripción (sede y facultad) se completan en el primer ingreso, y hasta entonces la cuenta no puede
hacer nada más. Una base recién creada trae las dos sedes (Barranquilla y Cúcuta) pero ninguna
facultad, así que hay que crear una para poder terminar ese primer ingreso. Las demás las carga
después el administrador desde **Catálogos**, sin volver a tocar la base de datos.

**1. Crear una facultad.** Con Docker Compose (camino A):

```bash
docker compose exec mysql mysql --default-character-set=utf8mb4 -uexpoideas -p expoideas \
  -e "INSERT INTO faculties (name) VALUES ('Ingenierías');"
```

Con el MySQL del camino B:

```bash
docker exec -it expoideas-mysql mysql --default-character-set=utf8mb4 -uroot -p expoideas \
  -e "INSERT INTO faculties (name) VALUES ('Ingenierías');"
```

El `--default-character-set=utf8mb4` no es un adorno: sin él los acentos entran mal desde la consola.

**2. Registrarse** en la plataforma con el correo institucional (`@unisimon.edu.co`) de quien vaya a
administrar. La contraseña necesita ocho caracteres o más, con al menos un número y un símbolo. Al
entrar, la app pide el nombre y la facultad.

**3. Darle el rol**, cambiando el correo por el que registraste:

```bash
docker compose exec mysql mysql --default-character-set=utf8mb4 -uexpoideas -p expoideas \
  -e "UPDATE users SET role = 'ADMIN' WHERE email = 'persona@unisimon.edu.co';"
```

**4. Volver a la pestaña de la app.** La sesión consulta su rol cada minuto y al volver a la
pestaña, así que en menos de un minuto (o al cerrar sesión y entrar de nuevo) aparece el menú de
administración. Desde ahí, ese administrador crea las demás cuentas y reparte roles desde
**Usuarios**.

### Comprobar que quedó bien

1. Abre la app: se ve la portada con los logos de la Universidad Simón Bolívar y MacondoLab.
2. Entra con la cuenta de administrador: en el menú aparecen **Usuarios**, **Catálogos** y
   **Ediciones**.
3. En **Catálogos**, crea una facultad de prueba y bórrala. Si eso funciona, la app, la API y la base
   de datos se están hablando.
4. En **Ediciones**, crea una edición con sus fechas y configura sus dos cátedras. Sin una edición
   con inscripciones abiertas, los estudiantes no pueden inscribir proyectos.

### Pruebas y formato

Lo mismo que corre el CI en cada push, para pasarlo antes de subir nada:

```bash
cd expoideas-api
./mvnw test              # unitarias, no necesitan base de datos
./mvnw verify            # unitarias + integración + formato + build
./mvnw spotless:apply    # aplica el formato de Java (palantir-java-format)
```

```bash
cd expoideas-app
npm test                 # Vitest + Testing Library, sin navegador ni API
npm run lint
npm run format           # aplica Prettier
npm run format:check     # solo verifica, como en CI
npm run build
```

Las pruebas de integración de la API (`*IT`) levantan la aplicación completa contra un MySQL 8.4 real
que Testcontainers arranca en Docker. **Necesitan Docker encendido**; se descargan la imagen la
primera vez y crean y destruyen su propia base: no tocan la tuya.

### Si algo falla

| Síntoma | Qué pasa | Qué hacer |
|---|---|---|
| La API no arranca: `Port 8080 was already in use` | Otro programa ocupa el 8080 | Poner `server.port=8081` en `config/application-local.properties`, y `VITE_API_URL=http://localhost:8081/api/v1` en `expoideas-app/.env` |
| La API no arranca y el log habla de `jwt.secret` | Falta el secreto de firma | Rellenarlo en `config/application-local.properties`; a propósito no tiene valor por defecto |
| `Validate failed: Migration checksum mismatch` | Se editó una migración ya aplicada | Nunca se edita una migración aplicada: se añade otra. Para empezar de cero en local, borrar la base y dejar que Flyway la recree |
| Las pruebas `*IT` fallan con `Could not find a valid Docker environment` | Docker Desktop está apagado | Encenderlo y repetir. `./mvnw test` no lo necesita |
| La app carga pero todo dice «Error de red» | La API no está arriba, o `VITE_API_URL` apunta a otro puerto | Comprobar `curl .../actuator/health` y reiniciar `npm run dev` después de tocar el `.env` |
| La sesión se cierra sola al entrar | El token venció o cambió `JWT_SECRET` | Volver a entrar. Cambiar el secreto invalida todas las sesiones, a propósito |
| Acentos rotos al consultar MySQL por consola | Falta el juego de caracteres | Añadir `--default-character-set=utf8mb4` al comando |
| En PowerShell, `./mvnw` no hace nada | Ese es el script de Unix | Usar `.\mvnw.cmd` |

## Despliegue en un servidor

Los comandos son los mismos del [camino A](#camino-a--solo-verla-funcionando-docker), porque la
plataforma se despliega igual en un portátil que en un servidor: `docker compose up -d --build`, con
MySQL, la API y la app detrás de Nginx. Lo que cambia en un servidor de verdad es lo de alrededor, y
eso está en la guía para TI, [docs/despliegue.md](docs/despliegue.md):

- HTTPS con el certificado de la universidad delante de Nginx, y las cabeceras `X-Forwarded-*` que
  la API espera.
- Copias de seguridad de la base de datos **y** de la carpeta de archivos, que van juntas.
- Actualizar a una versión nueva sin perder datos, y qué hacer si una migración falla.
- Despliegue sin Docker, si TI lo prefiere, y la tabla completa de variables de entorno.
- Lista de verificación de seguridad.

Las preguntas todavía abiertas con TI están en [docs/preguntas-ti.md](docs/preguntas-ti.md).

Cada push a `main` y cada pull request pasan por GitHub Actions (`.github/workflows/ci.yml`):
pruebas y formato de la API, lint, formato, pruebas y build de la app, validación de
`docker-compose.yml` y construcción de las dos imágenes Docker.

## Convenciones

- **Código en inglés** (clases, métodos, variables, JSON, rutas de la API, columnas de la base de
  datos); **comentarios, documentación, mensajes al usuario y URLs del navegador, en español**
  (`/iniciar-sesion`, `/admin/usuarios`...).
- Commits en [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat`, `fix`, `refactor`, `test`, `chore`, `style`, `docs`...); el historial de commits es la
  referencia real del orden en que avanzó cada fase.
- Formato automático y obligatorio en CI: Prettier en el frontend, Spotless con
  palantir-java-format en el backend (ver comandos arriba).
- Desarrollo por fases: los cambios grandes se dividen en fases pequeñas, cada una en su rama,
  probada y revisada antes de fusionarse a `main`.

Las reglas completas —incluidas las del backend, las del frontend y lo que necesita permiso
explícito— están en **[AGENTS.md](AGENTS.md)**, escrito tanto para agentes de IA como para quien
llega nuevo al proyecto.

## Notas

- Los errores de la API siguen el estándar Problem Details (RFC 9457, `application/problem+json`): el
  mensaje para el usuario va en `detail` y los errores de validación añaden `fields` con el mensaje
  de cada campo. Sin sesión válida la API responde 401 y el frontend cierra la sesión.
- En producción se usa el perfil `prod` (`SPRING_PROFILES_ACTIVE=prod`, ya incluido en la imagen
  Docker): apaga Swagger, oculta detalles de error y respeta las cabeceras del proxy.
- Los archivos subidos (fotos, entregables) se guardan en disco, en `FILES_DIR` (por defecto
  `uploads/` junto a la API, ignorada por git); la BD solo guarda sus metadatos. Esa carpeta debe
  quedar fuera de lo que publica el servidor web y entrar en las copias de seguridad junto con la BD.
  Se aceptan JPG, PNG, WEBP y PDF de hasta 5 MB, validados por su contenido.
- Nunca commitees dumps de base de datos ni logs de ejecución: el `.gitignore` de la raíz los cubre.
