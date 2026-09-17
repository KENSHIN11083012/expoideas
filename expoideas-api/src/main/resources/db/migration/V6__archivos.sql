-- Archivos subidos a la plataforma: por ahora la foto de perfil; después los
-- entregables de INNPRENDE, la galería y la vitrina. El contenido vive en disco
-- (ARCHIVOS_DIR), fuera de la BD; aquí solo quedan los metadatos. TI fija un
-- máximo de 5 MB por archivo.
CREATE TABLE archivos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  uuid            VARCHAR(36)  NOT NULL UNIQUE,
  nombre_original VARCHAR(255) NOT NULL,
  tipo_contenido  VARCHAR(100) NOT NULL,
  tamano_bytes    INT          NOT NULL,
  sha256          VARCHAR(64)  NOT NULL,
  ruta            VARCHAR(255) NOT NULL UNIQUE,
  visibilidad     VARCHAR(20)  NOT NULL,
  id_propietario  INT          NOT NULL,
  fecha_creacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_archivo_propietario FOREIGN KEY (id_propietario) REFERENCES usuarios (id),
  CONSTRAINT chk_archivo_visibilidad CHECK (visibilidad IN ('publico', 'privado')),
  CONSTRAINT chk_archivo_tamano CHECK (tamano_bytes BETWEEN 1 AND 5242880)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_archivos_propietario ON archivos (id_propietario);

-- La foto deja de ser una URL libre heredada de Dattapro (que un admin podía
-- apuntar a cualquier sitio) y pasa a ser un archivo subido a la plataforma.
ALTER TABLE usuarios
  DROP COLUMN foto_url,
  ADD COLUMN id_foto INT NULL AFTER numero_identificacion,
  ADD CONSTRAINT fk_usuario_foto FOREIGN KEY (id_foto) REFERENCES archivos (id) ON DELETE SET NULL;
