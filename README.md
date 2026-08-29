# Expoideas

Red social para emprendedores universitarios. Construido sobre la arquitectura del proyecto
semilla **Dattapro** (sistema de convocatorias de investigación cedido por TI), del que se reutiliza
la infraestructura técnica — auth JWT, separación en capas, catálogos maestros, layout — pero no el
dominio.

| | |
|---|---|
| `dattapro-api` | Spring Boot 4 · Java 25 · MySQL · Spring Security + JWT · Flyway · Swagger |
| `dattapro-app` | React 19 · Vite 7 · Tailwind 4 · react-router-dom |

> Los directorios conservan el nombre `dattapro-*` hasta que se complete el renombre a `expoideas-*`.

## Requisitos

- Java 25
- Node 20+
- MySQL 8

## Puesta en marcha

### 1. Base de datos

```sql
CREATE DATABASE expoideas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Flyway aplica las migraciones de `dattapro-api/src/main/resources/db/migration/` al arrancar la API.

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

Sin el perfil `local`, la configuración se toma de variables de entorno: `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `JWT_SECRET` y, opcionalmente, `PORT`, `JWT_EXPIRATION` y `ALLOWED_ORIGINS`. No hay
valores por defecto para las credenciales: si falta una, la app no arranca.

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

- `docs/legacy-schema/` guarda el DDL original de Dattapro como referencia. Está fuera de git.
- Nunca commitees dumps de base de datos ni logs de ejecución: el `.gitignore` de la raíz los cubre.
