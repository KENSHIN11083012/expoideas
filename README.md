# Expoideas

Repositorio académico y sistema de evaluación de los proyectos de la Cátedra INNPRENDE de la
Universidad Simón Bolívar, con MacondoLab: inscripción de proyectos de INNPRENDE I (investigación) e
INNPRENDE II (prototipado), evaluación por jurados y ranking.

Construido sobre la arquitectura del proyecto semilla **Dattapro** (sistema de convocatorias de investigación cedido por TI), del que se reutiliza
la infraestructura técnica — auth JWT, separación en capas, catálogos maestros, layout — pero no el
dominio.

| | |
|---|---|
| `expoideas-api` | Spring Boot 4 · Java 25 · MySQL · Spring Security + JWT · Flyway · Swagger |
| `expoideas-app` | React 19 · Vite 7 · Tailwind 4 · react-router · Radix UI · react-hook-form + zod |

## Requisitos

- Java 25
- Node 20.19+ o 22.12+ (lo exige Vite 7)
- MySQL 8, instalado o en Docker

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
Los cambios de esquema van siempre en una migración nueva (`V4__...sql`, `V5__...sql`); nunca se
edita una que ya se aplicó.

### 2. Backend

```bash
cd expoideas-api
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
```

Rellena `application-local.properties` con tus credenciales y un JWT secret nuevo
(`openssl rand -base64 32`), y arranca:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

API en `http://localhost:8080` · Swagger en `http://localhost:8080/swagger-ui.html`

**Si el puerto 8080 está ocupado**, descomenta `server.port` en `application-local.properties` (o
usa la variable `PORT`) y apunta el frontend al mismo puerto con `VITE_API_URL` en su `.env`.

Sin el perfil `local`, la configuración se toma de variables de entorno: `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `JWT_SECRET` y, opcionalmente, `PORT`, `JWT_EXPIRATION`, `ALLOWED_ORIGINS` y `ARCHIVOS_DIR`.
No hay valores por defecto para las credenciales: si falta una, la app no arranca.

Los tests no necesitan base de datos:

```bash
./mvnw test
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

El subdirectorio sale de `VITE_BASE_PATH` (por defecto `/expoideas/`). `App.jsx` lo
reutiliza como `basename` del router, así que no hay que tocarlo en dos sitios.

## Notas

- Los errores de la API siguen el estándar Problem Details (RFC 9457, `application/problem+json`): el
  mensaje para el usuario va en `detail` y los errores de validación añaden `campos` con el mensaje
  de cada campo. Sin sesión válida la API responde 401 y el frontend cierra la sesión.
- Al desplegar, apaga Swagger con `springdoc.api-docs.enabled=false` y
  `springdoc.swagger-ui.enabled=false`.
- Los archivos subidos (fotos, entregables) se guardan en disco, en `ARCHIVOS_DIR` (por defecto
  `uploads/` junto a la API, ignorada por git); la BD solo guarda sus metadatos. Esa carpeta debe
  quedar fuera de lo que publica el servidor web y entrar en las copias de seguridad junto con la BD.
  Se aceptan JPG, PNG, WEBP y PDF de hasta 5 MB, validados por su contenido.

- `docs/legacy-schema/` guarda el DDL original de Dattapro como referencia. Está fuera de git.
- Nunca commitees dumps de base de datos ni logs de ejecución: el `.gitignore` de la raíz los cubre.
