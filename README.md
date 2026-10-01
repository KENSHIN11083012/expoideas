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

**Si solo vienes a desplegarla**, ve directo al
[camino A](#camino-a--desplegarla-con-docker): hacen falta Git y Docker, nada más.

## Qué existe hoy

**Cuentas y catálogos**

- Autenticación: registro con solo el correo institucional y una contraseña, inicio de sesión y
  primer ingreso, donde cada cuenta resuelve sus pasos pendientes (cambiar la contraseña temporal,
  aceptar el tratamiento de datos, completar el perfil).
- Perfil propio: foto, datos personales, seguridad (cambio de contraseña) y consentimiento de datos.
  Cambiar la contraseña cierra las demás sesiones abiertas de esa cuenta.
- Gestión de usuarios: ADMIN y MacondoLab crean, editan, restablecen contraseña, suspenden y eliminan
  cuentas, y cargan el [listado de la cátedra](docs/listado.md) para que cada persona se registre
  con su rol. Una cuenta suspendida no entra, pero conserva sus proyectos, entregas y evaluaciones.
- Catálogos: sedes, facultades, programas académicos, sectores, keywords y tipos de prototipo.
- Archivos: subida y descarga, hasta 5 MB, validados por contenido (JPG, PNG, WEBP y PDF; las
  plantillas también en DOCX y PPTX).
- Avisos por correo: invitaciones a un equipo, cuentas creadas por la gestión, sustentaciones y
  recordatorios a los jurados. Sin servidor SMTP la plataforma funciona igual y no envía nada.

**Dominio de la Expo**

- Ediciones: cada vuelta de la Expo con sus plazos (apertura y cierre de inscripciones, cierre de
  entregas) y la configuración de cada cátedra (mínimo y máximo de integrantes). Las ediciones no se
  solapan y la plataforma abre y cierra sola según las fechas.
- Inscripción de proyectos: el estudiante que inscribe queda como líder, elige cátedra, sector y
  profesor, e invita a sus compañeros por correo; nadie entra a un equipo sin aceptar la invitación.
  Cada estudiante está en un solo proyecto por cátedra en cada edición.
- Prerrequisito: nadie cursa las dos cátedras a la vez, y para inscribirse en INNPRENDE II hay que
  haber aprobado INNPRENDE I. El profesor registra el resultado del proyecto al cerrar las entregas.
- Entregables: MacondoLab define qué pide cada cátedra (nombre, formatos aceptados o enlace, si es
  obligatorio, cuántos archivos admite, plantilla para descargar y cierre propio) y el equipo sube los
  suyos hasta el cierre. En INNPRENDE II un entregable puede pedirse solo a un tipo de prototipo.
- Sustentaciones: la gestión asigna fecha y hora a cada proyecto, y el equipo y su profesor reciben
  el aviso por correo.
- Jurados: la gestión asigna a cada proyecto profesores, jurados externos o cuentas de gestión, y
  cada jurado ve los suyos en «Evaluar», con sus entregables.
- Evaluación: las dos [rúbricas](docs/rubricas.md) están cargadas como datos y cada jurado asignado
  califica en un tablero, criterio por criterio. La nota del proyecto es el promedio de sus jurados;
  la ven el profesor del grupo y la gestión en la ficha, en el listado y en el CSV.
- Publicación de notas: la gestión publica las de cada cátedra en «Ediciones», y desde ese momento
  cada equipo ve su nota final y las observaciones de los jurados, sin nombres.
- Directorio y reportes: la gestión ve todos los proyectos y filtra por edición, cátedra, sector o
  profesor; cada profesor ve solo los que lo nombraron. Ambos exportan la lista en CSV, con el
  progreso de entregables de cada proyecto.

## Qué falta

Lo que pidió MacondoLab y el orden en que se construyó, fase a fase, está en la
[reunión de septiembre de 2026](docs/reunion-2026-09.md). Sigue pendiente:

**De MacondoLab**

- Los tipos de prototipo de INNPRENDE II y qué evidencia pide cada uno. El mecanismo está hecho: los
  carga la gestión en **Catálogos** y en los entregables.
- Identidad visual de Idearium: los nombres ya están puestos; faltan los logos y la paleta (el
  monograma y los colores de ahora son provisionales).
- Dos confirmaciones: las diferencias de la rúbrica del póster ([docs/rubricas.md](docs/rubricas.md))
  y si la invitación a un equipo se sigue aceptando o pasa a ser automática.
- Sin definir, y por eso fuera del piloto: ranking y premios por sector, y la vitrina pública.

**De TI** (las preguntas completas están en [docs/preguntas-ti.md](docs/preguntas-ti.md))

- El servidor, la URL pública y el certificado HTTPS.
- El servidor de correo (SMTP) para los avisos.
- El listado de la cátedra para la precarga: mientras no llegue, todos se registran como estudiantes
  y la gestión asigna los roles a mano.

## Requisitos

| Herramienta | Versión | Para qué | Comprobar |
|---|---|---|---|
| Git | Cualquiera reciente | Clonar el repositorio | `git --version` |
| Docker | Engine 24+ con el plugin Compose (en Windows y macOS viene con Docker Desktop) | MySQL, pruebas de integración y despliegue | `docker compose version` |
| JDK | **25** (Eclipse Temurin) | Compilar y ejecutar la API | `java -version` |
| Node.js | **24** (fijado en `.nvmrc`) | Compilar y ejecutar la app | `node -v` |

**Para desplegar bastan Git y Docker**: Java y Node se usan dentro de las imágenes y no hay que
instalarlos. El equipo necesita además unos 2 GB de RAM libres, del orden de 5 GB de disco para las
imágenes y su construcción (aparte de lo que crezcan la base de datos y los archivos subidos) y
salida a Internet la primera vez, para descargar las imágenes base y las dependencias.

Para programar hacen falta los cuatro. Maven no hay que instalarlo: el repositorio trae el wrapper
(`mvnw` y `mvnw.cmd`). Con `nvm` (o `nvm-windows`), `nvm install` y `nvm use` dentro del repositorio
toman la versión del `.nvmrc`. El mínimo real de Node son 22.12+, pero el CI compila con la 24: si
usas otra versión y algo falla solo en tu equipo, ese es el primer sospechoso.

## Puesta en marcha en otro equipo

Dos caminos, según para qué quieras el proyecto:

- **[Camino A](#camino-a--desplegarla-con-docker)**: desplegarla entera con Docker. Es el mismo
  recorrido en un portátil, para verla funcionando, y en un servidor.
- **[Camino B](#camino-b--para-programar)**: cada parte por separado, con recarga en caliente.

> **Consola.** Todos los comandos del camino A sirven tal cual en Bash, en PowerShell y en la
> terminal de macOS, salvo los que dicen otra cosa. Los del camino B están escritos para una consola
> tipo Unix (Git Bash o WSL): desde PowerShell, cambia `./mvnw` por `.\mvnw.cmd` y `cp` por `Copy-Item`.

### Camino A — desplegarla con Docker

Levanta la plataforma entera —base de datos, API y app— en tres contenedores. Solo la app publica
un puerto; MySQL y la API se quedan en la red interna de Docker, que es justo lo que se quiere en un
servidor.

```
Navegador ──▶ app: Nginx (puerto HTTP_PORT)
                ├─ /expoideas/       la app React
                └─ /expoideas/api/   ──▶ api: Spring Boot ──▶ mysql: MySQL 8.4
                                                          └─▶ volumen de archivos subidos
```

**1. Descargar el proyecto**

```bash
git clone https://github.com/KENSHIN11083012/expoideas.git
```

```bash
cd expoideas
```

Todos los comandos que siguen se ejecutan desde esa carpeta, que es donde está `docker-compose.yml`.

**2. Crear el archivo de variables**

```bash
cp .env.example .env
```

Abre `.env` con un editor y rellena los tres valores obligatorios. Para generar cada uno sirve este
comando, que solo necesita Docker; ejecútalo tres veces y pega un resultado distinto en cada
variable:

```bash
docker run --rm alpine sh -c "head -c 32 /dev/urandom | base64"
```

| Variable | Obligatoria | Qué poner |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | Sí | Contraseña del administrador de MySQL |
| `DB_PASSWORD` | Sí | Contraseña del usuario `expoideas`, con el que se conecta la API. Distinta de la anterior |
| `JWT_SECRET` | Sí | Clave con la que se firman las sesiones. Tiene que ser Base64 de 32 bytes o más: una frase escrita a mano no sirve |
| `HTTP_PORT` | No | Puerto del equipo donde se publica la plataforma. Por defecto, 8080 |
| `APP_URL` | Solo con correo | URL pública de la app, para los enlaces de los correos. El valor de ejemplo no sirve tal cual: pon la URL real o déjalo vacío |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | No | Servidor SMTP para los avisos. Sin `MAIL_HOST` la plataforma funciona, pero no envía correos |
| `MAIL_AUTH`, `MAIL_STARTTLS` | No | `false` si el SMTP no pide autenticación o STARTTLS |
| `JWT_EXPIRATION` | No | Duración de la sesión (`4h`, `30m`…). Por defecto, 4 horas |

Si escribes una contraseña a mano, que no lleve `$`, espacios ni comillas: Docker Compose los
interpreta. El `.env` está ignorado por git y nunca se sube.

> **Las contraseñas de MySQL se fijan la primera vez que arranca.** Cambiarlas después en el `.env`
> no las cambia en la base de datos y deja a la API sin poder conectarse. Decídelas antes del paso 3.

**3. Construir y arrancar**

```bash
docker compose up -d --build
```

La primera vez tarda varios minutos: descarga las imágenes base y compila la API con Maven y la app
con Vite dentro de Docker. El comando termina cuando los tres servicios están arriba. Si falta una
variable obligatoria, se niega a arrancar y dice cuál.

**4. Comprobar que arrancó**

```bash
docker compose ps
```

`mysql` y `api` deben decir `healthy`, y `app`, `Up`. Después, en el navegador:

- `http://localhost:8080/expoideas/` muestra la portada de Idearium.
- `http://localhost:8080/expoideas/api/v1/campuses` responde con las dos sedes, Barranquilla y
  Cúcuta. Si esto funciona, la app, la API y la base de datos se están hablando.

Cambia `8080` por tu `HTTP_PORT` si lo tocaste y, desde otro equipo, `localhost` por el nombre o la
IP del servidor.

Recién instalada, la plataforma no tiene ninguna cuenta de gestión: sigue en
[Primer administrador](#primer-administrador).

### Primer administrador

Toda cuenta nace como estudiante. El registro pide solo correo y contraseña; el nombre y la
adscripción (sede y facultad) se completan en el primer ingreso, y hasta entonces la cuenta no puede
hacer nada más. Una base recién creada trae las dos sedes (Barranquilla y Cúcuta) pero ninguna
facultad, así que hay que crear una para poder terminar ese primer ingreso. Las demás las carga
después el administrador desde **Catálogos**, sin volver a tocar la base de datos.

Los dos comandos de abajo piden una contraseña: es la `DB_PASSWORD` del `.env`.

**1. Crear una facultad**

```bash
docker compose exec mysql mysql --default-character-set=utf8mb4 -uexpoideas -p expoideas -e "INSERT INTO faculties (name) VALUES ('Ingenierías');"
```

El `--default-character-set=utf8mb4` no es un adorno: sin él los acentos entran mal desde la consola.

**2. Registrarse** en la plataforma con el correo institucional (`@unisimon.edu.co`) de quien vaya a
administrar. La contraseña necesita ocho caracteres o más, con al menos un número y un símbolo. Al
entrar, la app pide el nombre y la facultad.

**3. Darle el rol**, cambiando el correo por el que registraste:

```bash
docker compose exec mysql mysql --default-character-set=utf8mb4 -uexpoideas -p expoideas -e "UPDATE users SET role = 'ADMIN' WHERE email = 'persona@unisimon.edu.co';"
```

**4. Volver a la pestaña de la app.** La sesión consulta su rol cada minuto y al volver a la
pestaña, así que en menos de un minuto (o al cerrar sesión y entrar de nuevo) aparece el menú de
administración. Desde ahí, ese administrador crea las demás cuentas y reparte roles desde
**Usuarios**.

Con el MySQL del [camino B](#camino-b--para-programar) son los mismos dos comandos, cambiando el
principio por `docker exec -it expoideas-mysql mysql --default-character-set=utf8mb4 -uroot -p expoideas`
y usando la contraseña de `root` que elegiste.

### Comprobar que quedó bien

1. Abre la app: se ve la portada con los logos de la Universidad Simón Bolívar y MacondoLab.
2. Entra con la cuenta de administrador: en el menú aparecen **Usuarios**, **Catálogos**,
   **Ediciones** y **Sustentaciones**.
3. En **Catálogos**, crea una facultad de prueba y bórrala. Si eso funciona, la app, la API y la base
   de datos se están hablando también para escribir.
4. En **Ediciones**, crea una edición con sus fechas y configura sus dos cátedras. Sin una edición
   con inscripciones abiertas, los estudiantes no pueden inscribir proyectos.

### En un servidor

Los pasos son los mismos del camino A. Lo que cambia en un servidor de verdad es lo de alrededor; el
detalle para TI está en [docs/despliegue.md](docs/despliegue.md), y lo imprescindible es esto:

- **Arranque con el equipo.** Los contenedores vuelven solos tras un reinicio siempre que Docker
  arranque con el sistema (`sudo systemctl enable docker` en Linux).
- **Red.** El cortafuegos debe dejar entrar al `HTTP_PORT`, y a nada más: MySQL y la API no publican
  puerto y no deben quedar expuestas.
- **HTTPS.** Los contenedores hablan HTTP. El certificado lo pone un proxy delante (el de TI o un
  Nginx en el mismo servidor), que debe reenviar `X-Forwarded-Proto` y `X-Forwarded-Host` y admitir
  cuerpos de al menos 10 MB, o cortará las subidas de archivos antes de que lleguen. Como referencia,
  en Nginx (con tu `HTTP_PORT` en lugar de 8080):

  ```nginx
  location /expoideas/ {
      proxy_pass http://127.0.0.1:8080;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-Proto https;
      proxy_set_header X-Forwarded-Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      client_max_body_size 10m;
  }
  ```

- **Correo.** Rellena las variables `MAIL_*` con el SMTP de TI y pon en `APP_URL` la URL pública
  (`https://<dominio>/expoideas`), que es la que llevan los enlaces de los correos. Después,
  `docker compose up -d` aplica el cambio.
- **Sin Docker.** Si TI no lo permite, [docs/despliegue.md](docs/despliegue.md) explica cómo
  instalar MySQL, la API y la app por separado, con la tabla completa de variables de entorno y la
  lista de verificación de seguridad.

### Actualizar, apagar y copias de seguridad

**Actualizar a una versión nueva**, después de hacer una copia de seguridad:

```bash
git pull
```

```bash
docker compose up -d --build
```

El `--build` es lo que reconstruye las imágenes: sin él sigue corriendo la versión anterior. La API
aplica sola las migraciones pendientes al arrancar; si una falla, la API no arranca y lo dice en
`docker compose logs api`.

**Apagar y volver a encender**, sin perder nada:

```bash
docker compose down
```

```bash
docker compose up -d
```

Los datos viven en dos volúmenes de Docker, `expoideas_mysql-data` (la base de datos) y
`expoideas_files` (los archivos subidos), y sobreviven al `down`. `docker compose down -v` sí los
borra, con todo lo que tengan: es la forma de empezar de cero.

**Copia de seguridad.** La base de datos y los archivos se respaldan **juntos**: la base guarda los
metadatos y la carpeta, el contenido. Estos dos comandos son para Bash: usan `$(date +%F)` para
fechar el archivo, y en PowerShell la redirección `>` puede cambiar la codificación del volcado. En
Windows se ejecutan desde Git Bash, poniendo `MSYS_NO_PATHCONV=1` delante del segundo para que no
convierta las rutas del contenedor.

```bash
docker compose exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines expoideas' > expoideas-$(date +%F).sql
```

```bash
docker run --rm -v expoideas_files:/datos -v "$PWD":/respaldo alpine tar czf /respaldo/archivos-$(date +%F).tar.gz -C /datos .
```

Los dos archivos resultantes contienen datos reales: se guardan fuera del repositorio.

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

Abre ese archivo y pon la contraseña de MySQL y un `expoideas.jwt.secret` nuevo (el mismo comando
generador del camino A). Está ignorado por git: nunca se sube.

**3. Arrancar la API**

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Está lista cuando el log dice `Started ExpoideasApplication`. Compruébalo:

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

**Si el puerto 8080 está ocupado** —pasa a menudo, por ejemplo con el camino A levantado—,
descomenta `server.port` en `config/application-local.properties` (por ejemplo, `server.port=8081`)
y apunta el frontend a ese mismo puerto en el paso siguiente.

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

Falta la cuenta de gestión: sigue en [Primer administrador](#primer-administrador).

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

Cada push a `main` y cada pull request pasan por GitHub Actions (`.github/workflows/ci.yml`):
pruebas y formato de la API, lint, formato, pruebas y build de la app, validación de
`docker-compose.yml` y construcción de las dos imágenes Docker.

### Si algo falla

Con Docker (camino A), lo primero es siempre mirar qué dice el servicio: `docker compose logs api`
(o `mysql`, o `app`).

| Síntoma | Qué pasa | Qué hacer |
|---|---|---|
| `docker compose up` no arranca y dice `Define DB_PASSWORD en .env` (o `MYSQL_ROOT_PASSWORD`, o `JWT_SECRET`) | Falta el `.env` o esa variable está vacía | Crear el `.env` desde `.env.example` y rellenar las tres obligatorias |
| `Bind for 0.0.0.0:8080 failed: port is already allocated` | Otro programa ocupa ese puerto | Poner otro `HTTP_PORT` en el `.env` y repetir `docker compose up -d` |
| `docker compose up` termina con `dependency failed to start: container expoideas-api-1 is unhealthy` | La API no logra arrancar | Mirar por qué en `docker compose logs api`; los dos casos de abajo son los habituales |
| El log de `api` dice `Access denied for user 'expoideas'` | Se cambió `DB_PASSWORD` después del primer arranque | Volver a poner la contraseña original. Si la instalación es nueva y no hay datos que perder, `docker compose down -v` y empezar otra vez |
| El log de `api` dice `Illegal base64 character` o `WeakKeyException` | `JWT_SECRET` no es Base64 de 32 bytes o más | Generarlo con el comando del paso 2 |
| Después de actualizar se sigue viendo la versión anterior | Se levantó sin reconstruir | `docker compose up -d --build` |
| La portada carga en el servidor pero no desde otro equipo | El cortafuegos no deja entrar al puerto | Abrir el `HTTP_PORT` en el cortafuegos del servidor |
| Detrás del proxy de TI, subir un archivo falla con 413 | El proxy corta los cuerpos grandes antes de la app | Subir su límite a 10 MB (`client_max_body_size 10m` en Nginx) |
| Los enlaces de los correos no abren | `APP_URL` quedó con el valor de ejemplo | Poner la URL pública real y `docker compose up -d` |
| La API no arranca: `Port 8080 was already in use` | Otro programa ocupa el 8080 (camino B) | Poner `server.port=8081` en `config/application-local.properties`, y `VITE_API_URL=http://localhost:8081/api/v1` en `expoideas-app/.env` |
| `Validate failed: Migration checksum mismatch` | Se editó una migración ya aplicada | Nunca se edita una migración aplicada: se añade otra. Para empezar de cero en local, borrar la base y dejar que Flyway la recree |
| Las pruebas `*IT` fallan con `Could not find a valid Docker environment` | Docker Desktop está apagado | Encenderlo y repetir. `./mvnw test` no lo necesita |
| La app carga pero todo dice «Error de red» | La API no está arriba, o `VITE_API_URL` apunta a otro puerto | Comprobar `curl .../actuator/health` y reiniciar `npm run dev` después de tocar el `.env` |
| La sesión se cierra sola al entrar | El token venció o cambió `JWT_SECRET` | Volver a entrar. Cambiar el secreto invalida todas las sesiones, a propósito |
| Acentos rotos al consultar MySQL por consola | Falta el juego de caracteres | Añadir `--default-character-set=utf8mb4` al comando |
| En PowerShell, `./mvnw` no hace nada | Ese es el script de Unix | Usar `.\mvnw.cmd` |

## Estructura

Organización por módulo en los dos proyectos: cada uno agrupa lo suyo (entidad, servicio,
controlador... o página, `api.js`, `queries.js`) en vez de separar por capas técnicas.

```
expoideas-api/src/main/java/co/edu/unisimon/expoideas/
  auth/         Login y registro (rutas públicas)
  security/     JWT, filtros, SecurityConfig
  users/        Cuenta propia, gestión de usuarios, roles, listado de la cátedra
  catalogs/     Sedes, facultades, programas académicos, sectores, keywords, tipos de prototipo
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
  features/   Un módulo por área: auth, users, profile, catalogs, editions, projects,
              deliverables, presentations, jury, evaluations, home, errors
  components/ ui/ (primitivos), layout/, forms/ (compartidos entre features)
  lib/        apiClient, rutas (routes.js), roles, cátedras (tracks.js), validaciones, sesión
```

## Roles y permisos

| Rol | Quién | Puede |
|---|---|---|
| `ADMIN` | Parte técnica de la plataforma | Todo lo de MacondoLab, y además gestionar cuentas de gestión (ADMIN, MACONDOLAB) y la estructura académica (sedes, facultades, programas) |
| `MACONDOLAB` | Coordinación de INNPRENDE I y II | Gestionar cuentas de estudiantes, profesores y jurados; administrar sectores, keywords y tipos de prototipo; abrir ediciones y configurar sus entregables; programar sustentaciones, asignar jurados y publicar las notas; ver y exportar el directorio completo |
| `TEACHER` | Profesor de la universidad | Ver y exportar los proyectos que lo nombraron, registrar su resultado y ver sus notas. Puede ser jurado de proyectos de otros profesores. Declara sede y facultad |
| `JUDGE` | Jurado, puede ser externo a la universidad | Calificar con la rúbrica los proyectos que la gestión le asigna, en «Evaluar». Su cuenta la crea la gestión. Sin adscripción académica obligatoria |
| `STUDENT` | Rol con el que nace toda cuenta registrada | Inscribir un proyecto por cátedra, invitar a su equipo, subir los entregables y ver su nota cuando se publica. Declara sede y facultad |

Ser jurado es una asignación por proyecto, no solo un rol: la gestión también puede asignar como
jurado a un profesor o a una cuenta de gestión.

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
