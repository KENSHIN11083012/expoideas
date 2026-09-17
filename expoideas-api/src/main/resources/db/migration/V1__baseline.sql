-- Baseline de Expoideas.
--
-- Nucleo minimo heredado de Dattapro: estructura academica, clasificacion e
-- identidad de usuario. El dominio de convocatorias y el perfil docente
-- (competencias, idiomas, formacion, certificaciones) no se trasladaron.

-- ---------------------------------------------------------------
-- Estructura academica
-- ---------------------------------------------------------------

CREATE TABLE sede (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE facultades (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE programas_academicos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  id_facultad INT NOT NULL,
  CONSTRAINT fk_programa_facultad FOREIGN KEY (id_facultad) REFERENCES facultades (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- Clasificacion (base de sectores y categorias de emprendimiento)
-- ---------------------------------------------------------------

CREATE TABLE categorias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE keywords (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- Nucleo de identidad
-- ---------------------------------------------------------------
--
-- Frente al DDL de Dattapro:
--   * `rol` era ENUM('admin','profesor','directivo'): agregar un rol exigia
--     reescribir el tipo de la columna. Ahora es VARCHAR con un CHECK, que se
--     actualiza con una migracion. `profesor` pasa a llamarse `docente`;
--     `directivo` no se traslado.
--   * `foto` era un MEDIUMBLOB dentro de esta misma tabla: inviable para un
--     feed y por encima del limite de 5 MB por archivo que fijo TI.

CREATE TABLE usuarios (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  nombres                VARCHAR(100) NOT NULL,
  apellidos              VARCHAR(100) NOT NULL,
  correo_institucional   VARCHAR(150) NOT NULL UNIQUE,
  password               VARCHAR(255) NOT NULL,
  rol                    VARCHAR(30)  NOT NULL DEFAULT 'emprendedor',
  foto_url               VARCHAR(255) NULL,
  numero_identificacion  VARCHAR(50)  NULL UNIQUE,
  fecha_creacion         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_sede                INT NULL,
  id_programa_academico  INT NULL,
  CONSTRAINT fk_usuario_sede     FOREIGN KEY (id_sede) REFERENCES sede (id),
  CONSTRAINT fk_usuario_programa FOREIGN KEY (id_programa_academico) REFERENCES programas_academicos (id),
  CONSTRAINT chk_usuario_rol CHECK (rol IN ('admin','docente','emprendedor','mentor','visitante'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_usuarios_rol ON usuarios (rol);
