# Despliegue de Expoideas

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
| Archivos | Carpeta en disco (`ARCHIVOS_DIR`) | Fotos y entregables (≤ 5 MB c/u) |

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
| `expoideas_datos-mysql` | Base de datos |
| `expoideas_archivos` | Archivos subidos |

### HTTPS

Nginx de la app escucha HTTP en el puerto 8080 del contenedor. Lo habitual es poner delante el
proxy o balanceador de TI con el certificado de la universidad, que debe reenviar:

- `X-Forwarded-Proto: https`
- `X-Forwarded-Host: <dominio público>`

Con esas cabeceras la API responde como si la petición hubiera llegado por HTTPS (HSTS, URLs y
comprobación de origen correctas).

## Opción B: sin Docker

1. **MySQL 8.4**: crear la base y un usuario con todos los privilegios sobre ella.
   ```sql
   CREATE DATABASE expoideas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'expoideas'@'%' IDENTIFIED BY '<contraseña>';
   GRANT ALL PRIVILEGES ON expoideas.* TO 'expoideas'@'%';
   ```
2. **API** (Java 25): compilar con `./mvnw -B package` y ejecutar
   `java -jar expoideas-api-0.0.1-SNAPSHOT.jar` como servicio (p. ej. systemd), con las variables
   de la tabla de abajo y `SPRING_PROFILES_ACTIVE=prod`.
3. **App** (Node 24 solo para compilar): en `expoideas-app`,
   `npm ci && VITE_API_URL=/expoideas/api/v1 npm run build`, y copiar `dist/` a la carpeta
   `expoideas/` del servidor web.
4. **Servidor web**: tomar `expoideas-app/nginx.conf` como referencia (rutas, SPA, caché,
   cabeceras de seguridad y proxy a la API).

## Variables de entorno de la API

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DB_URL` | Sí | `jdbc:mysql://host:3306/expoideas` |
| `DB_USERNAME` / `DB_PASSWORD` | Sí | Usuario de MySQL de la aplicación |
| `JWT_SECRET` | Sí | Clave de firma de sesiones, Base64 de 32 bytes o más (`openssl rand -base64 32`). Cambiarla cierra todas las sesiones |
| `SPRING_PROFILES_ACTIVE` | Sí en producción | `prod`: apaga Swagger, oculta detalles de error y respeta el proxy |
| `ARCHIVOS_DIR` | No | Carpeta de archivos (en Docker: `/data/archivos`) |
| `PORT` | No | Puerto de la API (por defecto 8080) |
| `JWT_EXPIRATION` | No | Duración de la sesión en ms (por defecto 4 h) |
| `ALLOWED_ORIGINS` | No | Orígenes externos permitidos por CORS, separados por comas. Vacío si la app y la API comparten origen |

## Primer administrador

Las cuentas nuevas nacen como estudiante y el registro exige elegir una facultad. En una base
recién creada solo existen las sedes (Barranquilla y Cúcuta), así que el primer administrador se
prepara así:

1. Crear al menos una facultad en MySQL (las demás, con sus programas, las carga luego el
   administrador desde **Catálogos**):
   ```bash
   docker compose exec mysql mysql --default-character-set=utf8mb4 -uexpoideas -p expoideas \
     -e "INSERT INTO facultades (nombre) VALUES ('Ingenierías');"
   ```
2. Registrarse en la plataforma con el correo institucional de quien administrará.
3. Asignarle el rol en MySQL:
   ```bash
   docker compose exec mysql mysql --default-character-set=utf8mb4 -uexpoideas -p expoideas \
     -e "UPDATE usuarios SET rol = 'admin' WHERE correo_institucional = 'persona@unisimon.edu.co';"
   ```
4. Cerrar sesión y volver a entrar. Desde **Usuarios**, ese administrador asigna los demás roles
   (MacondoLab, docentes, jurados) sin volver a tocar la base de datos.

## Operación

### Salud y monitoreo

- `GET /actuator/health/liveness` y `/actuator/health/readiness` en la API (puerto interno 8080)
  responden `{"status":"UP"}`. No exponen detalles ni requieren sesión. Nginx no los publica.
- En Docker, la imagen de la API trae su propio `HEALTHCHECK` (`docker compose ps`).
- Logs: salida estándar de cada contenedor (`docker compose logs -f api`).

### Copias de seguridad

Hay que respaldar **juntas** la base de datos y la carpeta de archivos: la base guarda los
metadatos y la carpeta, el contenido.

```bash
# Base de datos
docker compose exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines expoideas' > expoideas-$(date +%F).sql
# Archivos
docker run --rm -v expoideas_archivos:/datos -v "$PWD":/respaldo alpine tar czf /respaldo/archivos-$(date +%F).tar.gz -C /datos .
```

### Actualizar a una versión nueva

```bash
# 1. Respaldar base de datos y archivos (ver arriba)
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
- [ ] Copias de seguridad programadas y una restauración probada.
- [ ] Opcional: antivirus sobre la carpeta de archivos (p. ej. ClamAV). La plataforma ya valida
      tipo y tamaño de cada archivo por su contenido.

## Integración continua

`.github/workflows/ci.yml` ejecuta en cada push a `main` y en cada pull request las pruebas de
la API, el lint, las pruebas y el build de la app, y construye las dos imágenes Docker.
