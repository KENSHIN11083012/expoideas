# Expoideas

Repositorio académico y sistema de evaluación de los proyectos de la Cátedra INNPRENDE de la
Universidad Simón Bolívar, con MacondoLab: inscripción de proyectos de INNPRENDE I (investigación) e
INNPRENDE II (prototipado), evaluación por jurados y ranking.

Construido sobre la arquitectura del proyecto semilla **Dattapro** (sistema de convocatorias de investigación cedido por TI), del que se reutiliza
la infraestructura técnica — auth JWT, separación en capas, catálogos maestros, layout — pero no el
dominio.

| | |
|---|---|
| `expoideas-api` | Spring Boot 4 · Java 25 · MySQL 8.4 · Spring Security + JWT · Flyway · Swagger |
| `expoideas-app` | React 19 · Vite 7 · Tailwind 4 · react-router · TanStack Query · Radix UI · react-hook-form + zod |

## Qué existe hoy

- Autenticación: registro, login y primer ingreso con cambio de contraseña obligatorio.
- Perfil propio: foto, datos personales, seguridad (cambio de contraseña) y consentimiento de datos.
- Gestión de usuarios: ADMIN y MacondoLab crean, editan, restablecen contraseña y eliminan cuentas.
- Catálogos: sedes, facultades, programas académicos, categorías y keywords.
- Archivos: subida y descarga (fotos de perfil), hasta 5 MB, validados por contenido (JPG, PNG, WEBP, PDF).

## Qué falta

Es el dominio propio de Expoideas, todavía sin construir porque espera la definición de campos y
reglas de MacondoLab (ver [docs/preguntas-ti.md](docs/preguntas-ti.md) para lo pendiente de
infraestructura y el cronograma en curso):

- Inscripción de proyectos (INNPRENDE I: póster; INNPRENDE II: prototipo + pitch).
- Asignación de jurados y evaluación.
- Ranking y reportes.
- Vitrina pública (aparte de las cátedras).

## Requisitos

- Java 25
- Node 24 (fijado en `.nvmrc`); Vite 7 exige como mínimo 20.19+ o 22.12+
- MySQL 8.4, instalado o en Docker

## Estructura

Organización por módulo en los dos proyectos: cada uno agrupa lo suyo (entidad, servicio,
controlador... o página, `api.js`, `queries.js`) en vez de separar por capas técnicas.

```
expoideas-api/src/main/java/co/edu/unisimon/expoideas/
  auth/       Login y registro (rutas públicas)
  security/   JWT, filtros, SecurityConfig
  users/      Cuenta propia, gestión de usuarios, roles
  catalogs/   Sedes, facultades, programas académicos, categorías, keywords
  files/      Almacenamiento y metadatos de archivos subidos
  common/     Manejo de errores y configuración centralizada (ExpoideasProperties)

expoideas-app/src/
  features/   Un módulo por área: auth, users, profile, catalogs, home, errors
  components/ ui/ (primitivos), layout/, forms/ (compartidos entre features)
  lib/        apiClient, rutas (routes.js), roles, validaciones, sesión
```

## Roles y permisos

| Rol | Quién | Puede |
|---|---|---|
| `ADMIN` | Parte técnica de la plataforma | Todo lo de MacondoLab, y además gestionar cuentas de gestión (ADMIN, MACONDOLAB) |
| `MACONDOLAB` | Coordinación de INNPRENDE I y II | Gestionar cuentas de estudiantes, docentes y jurados; administrar catálogos |
| `TEACHER` | Docente de la universidad | Declara sede y facultad al registrarse |
| `JUDGE` | Jurado, puede ser externo a la universidad | Sin adscripción académica obligatoria |
| `STUDENT` | Rol con el que nace toda cuenta registrada | Declara sede y facultad al registrarse |

## Puesta en marcha

### 1. Base de datos

Con MySQL instalado:

```sql
CREATE DATABASE expoideas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

O con Docker, sin instalar nada más:

```bash
docker run -d --name expoideas-mysql -e MYSQL_ROOT_PASSWORD=<elige-una> -e MYSQL_DATABASE=expoideas \
  -p 3306:3306 mysql:8.4 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

Las siguientes veces basta con `docker start expoideas-mysql`.

Flyway aplica las migraciones de `expoideas-api/src/main/resources/db/migration/` al arrancar la API.
Los cambios de esquema van siempre en una migración nueva (`V2__...sql`, `V3__...sql`); nunca se
edita una que ya se aplicó.

### 2. Backend

```bash
cd expoideas-api
cp config/application-local.properties.example config/application-local.properties
```

Rellena `config/application-local.properties` con tus credenciales y un JWT secret nuevo
(`openssl rand -base64 32`), y arranca:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

API en `http://localhost:8080` · Swagger en `http://localhost:8080/swagger-ui.html`

**Si el puerto 8080 está ocupado**, descomenta `server.port` en `config/application-local.properties` (o
usa la variable `PORT`) y apunta el frontend al mismo puerto con `VITE_API_URL` en su `.env`.

Sin el perfil `local`, la configuración se toma de variables de entorno: `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `JWT_SECRET` y, opcionalmente, `PORT`, `JWT_EXPIRATION`, `ALLOWED_ORIGINS` y `FILES_DIR`.
No hay valores por defecto para las credenciales: si falta una, la app no arranca.

Las pruebas unitarias no necesitan base de datos:

```bash
./mvnw test
```

Las de integración (`*IT`) levantan la API completa contra un MySQL 8.4 real en Docker
(Testcontainers). Necesitan Docker encendido y corren junto con las unitarias, el formato
(`spotless:check`) y el build en:

```bash
./mvnw verify
```

Para aplicar el formato de Java (Spotless + palantir-java-format):

```bash
./mvnw spotless:apply
```

### 3. Frontend

```bash
cd expoideas-app
cp .env.example .env
npm ci
npm run dev
```

App en `http://localhost:5173/expoideas/`

Pruebas (Vitest + Testing Library, sin navegador ni API):

```bash
npm test
```

Formato (Prettier):

```bash
npm run format         # aplica
npm run format:check   # solo verifica, como en CI
```

El subdirectorio sale de `VITE_BASE_PATH` (por defecto `/expoideas/`). `App.jsx` lo
reutiliza como `basename` del router, así que no hay que tocarlo en dos sitios.

## Despliegue

La plataforma se despliega con Docker Compose (MySQL, API y app detrás de Nginx) o sin Docker.
La guía para TI está en [docs/despliegue.md](docs/despliegue.md) y las preguntas pendientes para
ellos, en [docs/preguntas-ti.md](docs/preguntas-ti.md).

```bash
cp .env.example .env   # rellenar contraseñas y JWT_SECRET
docker compose up -d --build
```

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
