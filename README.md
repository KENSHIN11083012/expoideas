# Expoideas

Red social para emprendedores universitarios. Construido sobre la arquitectura del proyecto
semilla **Dattapro** (sistema de convocatorias de investigación cedido por TI), del que se reutiliza
la infraestructura técnica — auth JWT, separación en capas, catálogos maestros, layout — pero no el
dominio.

| | |
|---|---|
| `dattapro-api` | Spring Boot 4 · Java 25 · MySQL · Spring Security + JWT · Flyway · Swagger |
| `dattapro-app` | React 19 · Vite 7 · Tailwind 4 · react-router · Radix UI · react-hook-form + zod |

> Los directorios conservan el nombre `dattapro-*` hasta que se complete el renombre a `expoideas-*`.

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

Flyway aplica las migraciones de `dattapro-api/src/main/resources/db/migration/` al arrancar la API.
Los cambios de esquema van siempre en una migración nueva (`V3__...sql`, `V4__...sql`); nunca se
edita una que ya se aplicó.

### 2. Backend

```bash
cd dattapro-api
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
`DB_PASSWORD`, `JWT_SECRET` y, opcionalmente, `PORT`, `JWT_EXPIRATION` y `ALLOWED_ORIGINS`. No hay
valores por defecto para las credenciales: si falta una, la app no arranca.

Los tests no necesitan base de datos:

```bash
./mvnw test
```

### 3. Frontend

```bash
cd dattapro-app
cp .env.example .env
npm ci
npm run dev
```

App en `http://localhost:5173/expoideas/`

El subdirectorio sale de `VITE_BASE_PATH` (por defecto `/expoideas/`). `App.jsx` lo
reutiliza como `basename` del router, asi que no hay que tocarlo en dos sitios.

## Notas

- Los errores de la API siguen el estándar Problem Details (RFC 9457, `application/problem+json`): el
  mensaje para el usuario va en `detail` y los errores de validación añaden `campos` con el mensaje
  de cada campo. Sin sesión válida la API responde 401 y el frontend cierra la sesión.
- Al desplegar, apaga Swagger con `springdoc.api-docs.enabled=false` y
  `springdoc.swagger-ui.enabled=false`.

- `docs/legacy-schema/` guarda el DDL original de Dattapro como referencia. Está fuera de git.
- Nunca commitees dumps de base de datos ni logs de ejecución: el `.gitignore` de la raíz los cubre.
