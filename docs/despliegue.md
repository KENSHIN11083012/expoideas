# Despliegue de Idearium (antes Expoideas)

Guía para el equipo de TI de la Universidad Simón Bolívar. Describe qué hay que instalar, cómo
configurarlo y cómo operarlo (actualizaciones, copias de seguridad y monitoreo).

## Arquitectura

```
Navegador ──HTTPS──▶ Proxy de TI (opcional) ──▶ app: Nginx :8080
                                                   ├─ /expoideas/        app React (estática)
                                                   └─ /expoideas/api/    ──▶ api: Spring Boot :8080
                                                                              ├─ MySQL 8.4
                                                                              └─ carpeta de archivos
```

| Componente | Tecnología | Estado que guarda |
|---|---|---|
| `app` | React 19 compilada, servida por Nginx (usuario sin privilegios) | Ninguno |
| `api` | Spring Boot 4 · Java 25 (JRE, usuario sin privilegios) | Ninguno en memoria |
| `mysql` | MySQL 8.4 · utf8mb4 | Datos de la plataforma |
| Archivos | Carpeta en disco (`FILES_DIR`) | Fotos y entregables (≤ 5 MB c/u) |

La app y la API comparten origen: Nginx reenvía `/expoideas/api/` a la API. Por eso no hace
falta abrir CORS ni publicar la API. **La API y MySQL no deben quedar expuestas a Internet.**

El esquema de la base de datos lo crea y actualiza la propia API al arrancar (migraciones
Flyway en `expoideas-api/src/main/resources/db/migration`). No hay que ejecutar scripts SQL.

## Opción A: Docker Compose (recomendada)

Requisitos: Docker Engine 24+ con el plugin Compose, 2 GB de RAM libres y espacio en disco para
la base de datos y los archivos.

```bash
git clone https://github.com/KENSHIN11083012/expoideas.git
cd expoideas
cp .env.example .env
# Editar .env: contraseñas de MySQL, JWT_SECRET (openssl rand -base64 32) y HTTP_PORT
docker compose up -d --build
docker compose ps        # los tres servicios deben quedar "healthy" o "running"
```

La plataforma queda en `http://servidor:HTTP_PORT/expoideas/`. Si falta una variable
obligatoria, Compose se niega a arrancar e indica cuál.

Datos persistentes (volúmenes de Docker):

| Volumen | Contenido |
|---|---|
| `expoideas_mysql-data` | Base de datos |
| `expoideas_files` | Archivos subidos |

Cada servicio tiene un tope de memoria, para que uno que se desboque no tumbe a los otros ni al
servidor. Los valores por defecto suman cerca de 2 GB y se cambian en el `.env`:

| Variable | Por defecto | Servicio |
|---|---|---|
| `MYSQL_MEMORY` | `1g` | MySQL (en reposo usa cerca de 480 MB) |
| `API_MEMORY` | `768m` | API (el montón de Java se queda con el 60 %) |
| `APP_MEMORY` | `128m` | Nginx con la app (usa cerca de 15 MB) |

Si un servicio se reinicia solo y `docker inspect` dice `OOMKilled`, le faltó memoria: se sube su
variable y se ejecuta `docker compose up -d`.

### HTTPS

Nginx de la app escucha HTTP en el puerto 8080 del contenedor. Lo habitual es poner delante el
proxy o balanceador de TI con el certificado de la universidad, que debe reenviar:

- `X-Forwarded-Proto: https`
- `X-Forwarded-Host: <dominio público>`
- `X-Forwarded-For`, con la dirección del cliente al final

Con las dos primeras la API responde como si la petición hubiera llegado por HTTPS (HSTS, URLs y
comprobación de origen correctas).

La tercera la usa el Nginx de la app para frenar los intentos en serie contra el inicio de sesión y
el registro: por cada dirección admite una petición por segundo sostenida y ráfagas de hasta 30, y
al resto responde 429. Toma la **última** dirección de la cabecera, que es la que vio el proxy. Si
el proxy no la envía, todas las personas llegan con la dirección del proxy y comparten ese mismo
cupo: en una hora pico de inscripciones se quedarían cortas.

## Opción B: sin Docker

1. **MySQL 8.4**: crear la base y un usuario con todos los privilegios sobre ella.
   ```sql
   CREATE DATABASE expoideas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'expoideas'@'%' IDENTIFIED BY '<contraseña>';
   GRANT ALL PRIVILEGES ON expoideas.* TO 'expoideas'@'%';
   ```
2. **API** (Java 25): compilar con `./mvnw -B package` y ejecutar
   `java -jar target/expoideas-api-0.1.0-SNAPSHOT.jar` como servicio (p. ej. systemd), con las
   variables de la tabla de abajo y `SPRING_PROFILES_ACTIVE=prod`.
3. **App** (Node 24 solo para compilar): en `expoideas-app`,
   `npm ci && VITE_API_URL=/expoideas/api/v1 npm run build`, y copiar `dist/` a la carpeta
   `expoideas/` del servidor web.
4. **Servidor web**: tomar `expoideas-app/nginx.conf` como referencia (rutas, SPA, caché,
   cabeceras de seguridad y proxy a la API). Asume que Nginx corre en el contenedor de Docker
   (escucha en 8080, usuario sin privilegios); fuera de Docker hay que adaptar el puerto y,
   si el servidor web no es Nginx, reproducir el mismo comportamiento en el que se use.

## Variables de entorno de la API

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DB_URL` | Sí | `jdbc:mysql://host:3306/expoideas` |
| `DB_USERNAME` / `DB_PASSWORD` | Sí | Usuario de MySQL de la aplicación |
| `JWT_SECRET` | Sí | Clave de firma de sesiones, Base64 de 32 bytes o más (`openssl rand -base64 32`). Cambiarla cierra todas las sesiones |
| `SPRING_PROFILES_ACTIVE` | Sí en producción | `prod`: apaga Swagger, oculta detalles de error y respeta el proxy |
| `FILES_DIR` | No | Carpeta de archivos (por defecto `uploads`; en Docker: `/data/files`) |
| `PORT` | No | Puerto de la API (por defecto 8080) |
| `JWT_EXPIRATION` | No | Duración de la sesión: `4h`, `30m`… (por defecto 4 h; un número sin unidad son milisegundos) |
| `LOGIN_MAX_FAILED_ATTEMPTS` / `LOGIN_LOCK_DURATION` | No | Cuántas contraseñas equivocadas seguidas bloquean una cuenta (por defecto 5) y por cuánto tiempo (por defecto `5m`). Mientras dura el bloqueo no entra ni la contraseña correcta; restablecer la contraseña desde **Usuarios** lo quita |
| `ALLOWED_ORIGINS` | No | Orígenes externos permitidos por CORS, separados por comas. Por defecto vacío: solo el mismo origen, como detrás de Nginx |
| `SPRING_MAIL_HOST` / `SPRING_MAIL_PORT` | No | Servidor SMTP de TI para los avisos (invitaciones, cuentas creadas, sustentaciones). Sin host no se envía nada y la API lo dice en el log. En `docker-compose.yml` salen de `MAIL_HOST` y `MAIL_PORT` |
| `SPRING_MAIL_USERNAME` / `SPRING_MAIL_PASSWORD` | No | Credenciales del SMTP (`MAIL_USERNAME` y `MAIL_PASSWORD` en el `.env`). Con `MAIL_AUTH=false` y `MAIL_STARTTLS=false` se desactivan la autenticación y STARTTLS |
| `MAIL_FROM` | No | Remitente de los avisos (por defecto `no-reply@unisimon.edu.co`; debe ser una dirección que el SMTP acepte) |
| `MAIL_ATTEMPTS` / `MAIL_RETRY_DELAY` | No | Cuántas veces se intenta un envío (por defecto 3) y cuánto se espera antes del segundo intento (por defecto `5s`; antes del tercero, el doble). Ver «Si un correo no sale» abajo |
| `APP_URL` | No | URL pública de la app, para los enlaces de los correos (`https://<dominio>.unisimon.edu.co/expoideas`). Junto con el SMTP activa la verificación del correo al registrarse y la recuperación de contraseña; ver «Verificación del correo» abajo |
| `JAVA_TOOL_OPTIONS` | No | Opciones de la JVM. La imagen Docker ya trae `-XX:MaxRAMPercentage=75`; fuera de Docker no hay valor por defecto |

## Verificación del correo y recuperación de contraseña

Cuando la API tiene servidor de correo (`SPRING_MAIL_HOST`) **y** una `APP_URL` válida:

- Quien se registra recibe un enlace y no puede usar su cuenta hasta abrirlo (vale 48 horas; se
  puede pedir otro desde la pantalla de primer ingreso). Es lo que demuestra que el correo es suyo.
- En el inicio de sesión aparece «¿Olvidaste tu contraseña?», que envía un enlace de una hora para
  poner una nueva.
- Quien figura como profesor en el listado de la cátedra recibe ese rol al verificar su correo.

Sin servidor de correo, o con `APP_URL` vacía o mal escrita, nada de eso se activa: el registro no
pide verificación, el rol del listado lo confirma la gestión y las contraseñas se restablecen desde
**Usuarios**.

Al activar el correo en una instalación que ya tiene cuentas, las existentes no quedan pendientes
de verificar. Antes de anunciarlo conviene registrar una cuenta de prueba y comprobar que el enlace
llega y abre: si el SMTP rechaza los envíos, las cuentas nuevas no podrían entrar.

### Si un correo no sale

Los correos salen después de la operación que los pide, en segundo plano: un SMTP lento o caído no
frena a quien está usando la plataforma.

- Cada envío espera como mucho 10 segundos para conectar y 15 para leer o escribir, y se intenta
  tres veces (`MAIL_ATTEMPTS`), con 5 y 10 segundos de espera entre intentos (`MAIL_RETRY_DELAY`).
  Las credenciales rechazadas no se reintentan: otro intento no las arregla.
- Si ningún intento sale, queda en el log de la API y en el rastro de auditoría
  (`GET /api/v1/admin/audit?action=MAIL_FAILED`, solo administradores): a quién iba, el asunto y el
  motivo, nunca el cuerpo. Es donde mirar cuando alguien dice que no le llegó su contraseña
  temporal: se le restablece desde **Usuarios**.
- Hay cuatro envíos a la vez y hasta 500 en espera. Si el SMTP lleva rato caído y la espera se
  llena, el envío lo hace la propia petición, que tarda más pero no falla.
- Al apagar la API, los envíos en curso tienen 30 segundos para terminar.

## Primer administrador

Las cuentas nuevas nacen como estudiante. El registro pide solo correo y contraseña; el nombre, la
sede y la facultad se completan en el primer ingreso. En una base recién creada solo existen las
sedes (Barranquilla y Cúcuta), así que el primer administrador se prepara así. Los dos comandos
piden una contraseña: es la `DB_PASSWORD` del `.env`.

1. Crear al menos una facultad en MySQL (las demás, con sus programas, las carga luego el
   administrador desde **Catálogos**):
   ```bash
   docker compose exec mysql mysql --default-character-set=utf8mb4 -uexpoideas -p expoideas \
     -e "INSERT INTO faculties (name) VALUES ('Ingenierías');"
   ```
2. Registrarse en la plataforma con el correo institucional de quien administrará y completar el
   perfil que pide al entrar.
3. Asignarle el rol en MySQL:
   ```bash
   docker compose exec mysql mysql --default-character-set=utf8mb4 -uexpoideas -p expoideas \
     -e "UPDATE users SET role = 'ADMIN' WHERE email = 'persona@unisimon.edu.co';"
   ```
4. Volver a la pestaña de la plataforma. La sesión consulta su rol cada minuto, así que el menú de
   administración aparece sin cerrar sesión. Desde **Usuarios**, ese administrador asigna los demás
   roles (MacondoLab, profesores, jurados) sin volver a tocar la base de datos.

## Operación

### Salud y monitoreo

- `GET /actuator/health/liveness` y `/actuator/health/readiness` en la API (puerto interno 8080)
  responden `{"status":"UP"}`. No exponen detalles ni requieren sesión. Nginx no los publica.
- En Docker, los tres servicios tienen comprobación de salud: `docker compose ps` debe mostrarlos
  `healthy`. La de la app comprueba que Nginx responde; la de la API, que está lista.
- Al parar o actualizar, la API termina las peticiones en curso y los correos que estaba enviando
  antes de apagarse, y MySQL cierra bien sus archivos. Por eso `docker compose stop` puede tardar
  hasta un minuto: no hay que matarlo.
- Nginx vuelve a buscar la dirección de la API cada diez segundos, así que actualizar solo la API
  (`docker compose up -d --build api`) no obliga a reiniciarlo.
- Logs: salida estándar de cada contenedor (`docker compose logs -f api`).

### Copias de seguridad

Hay que respaldar **juntas** la base de datos y la carpeta de archivos: la base guarda los
metadatos y la carpeta, el contenido. Uno sin el otro no sirve.

**Hacer una copia.** Desde la raíz del repositorio, con la plataforma encendida (no hace falta
apagarla ni sacar a nadie):

```bash
scripts/copia.sh
```

Deja en `copias/` un solo archivo, `idearium-AAAA-MM-DD-HHMMSS.tar`, con el volcado de la base, los
archivos subidos y un manifiesto (fecha, versión de la base, número de archivos y sus sumas de
comprobación). Si algo falla, no deja paquete y termina con error: sirve para programarlo.

- La carpeta de destino se puede cambiar: `scripts/copia.sh /ruta/de/copias`.
- El paquete lleva datos reales de estudiantes y **no es una copia hasta que sale del servidor**: hay
  que llevarlo a donde TI guarde sus respaldos. `copias/` está en el `.gitignore`.
- El script no borra copias viejas: cuántas se conservan lo decide quien administra el disco.
- Para programarla cada noche, una línea de `cron` en el servidor:

```
30 2 * * * cd /ruta/a/expoideas && scripts/copia.sh /ruta/de/copias >> /var/log/idearium-copia.log 2>&1
```

**Restaurar una copia.** Reemplaza la base y los archivos por los de la copia; lo que haya en ese
momento se pierde, y por eso pide escribir `RESTAURAR`:

```bash
scripts/restaurar.sh copias/idearium-AAAA-MM-DD-HHMMSS.tar
```

Antes de tocar nada comprueba que el paquete esté entero (si no coincide con su manifiesto, se
niega). Después apaga la app y la API, carga la base, repone los archivos y lo vuelve a encender
todo. La copia puede ser de esta versión de la plataforma o de una anterior: al arrancar, la API
aplica las migraciones que falten. No sirve una copia de una versión **más nueva** que el código
instalado: la API no arrancaría.

**Probar la restauración** sin tocar la instalación real. Una copia que nunca se ha restaurado no
está probada. Se levanta una segunda instalación, vacía, con otro nombre y otro puerto, y se
restaura ahí:

```bash
export COMPOSE_PROJECT_NAME=idearium-prueba HTTP_PORT=8090
docker compose up -d --build
scripts/restaurar.sh copias/idearium-AAAA-MM-DD-HHMMSS.tar
# Entrar a http://servidor:8090/expoideas/ con una cuenta real y abrir un entregable.
docker compose down -v      # borra la instalación de prueba, con sus datos
unset COMPOSE_PROJECT_NAME HTTP_PORT
```

Los dos `export` son los que hacen que todo lo que sigue, incluido el script, actúe sobre la
instalación de prueba y no sobre la real: sin ellos, `restaurar.sh` y `down -v` actuarían sobre la
real. El script dice sobre qué instalación va a actuar antes de pedir la confirmación.

Así se probó el 1 de octubre de 2026: con cuentas, un proyecto con jurados y un archivo subido, se
hizo la copia, se borró la instalación entera, se levantó vacía y se restauró. Volvieron las mismas
cuentas y el mismo proyecto, y el archivo se descargó idéntico al original.

En una instalación sin Docker (opción B) los scripts no aplican: la copia es un `mysqldump
--single-transaction` de la base y un `tar` de la carpeta `FILES_DIR`, hechos en ese orden.

### Actualizar a una versión nueva

```bash
scripts/copia.sh
git pull
docker compose up -d --build
```

La API aplica sola las migraciones pendientes al arrancar. Si una migración falla, la API no
arranca (`docker compose logs api`). MySQL no revierte cambios de estructura, así que la base
puede quedar a medias: por eso el respaldo previo es obligatorio y es lo que se restaura.

## Seguridad: lista de verificación

- [ ] HTTPS con el certificado de la universidad delante de Nginx.
- [ ] `.env` fuera del repositorio, con permisos restringidos y contraseñas únicas.
- [ ] MySQL y la API sin puertos publicados (solo la app).
- [ ] `SPRING_PROFILES_ACTIVE=prod` (Swagger apagado).
- [ ] Copias de seguridad programadas (`scripts/copia.sh`), guardadas fuera del servidor, y una
      restauración probada con una copia real (`scripts/restaurar.sh` en una instalación de prueba).
- [ ] Opcional: antivirus sobre la carpeta de archivos (p. ej. ClamAV). La plataforma ya valida
      tipo y tamaño de cada archivo por su contenido.

## Integración continua

`.github/workflows/ci.yml` ejecuta en cada push a `main` y en cada pull request las pruebas de
la API, el lint, las pruebas y el build de la app, y construye las dos imágenes Docker.
