-- Roles de Expoideas (acordados el 2026-09-17), en lugar de los heredados de
-- Dattapro:
--   admin       parte técnica; hereda todo lo de macondolab
--   macondolab  coordinación de INNPRENDE I y II, sin la parte técnica
--   docente     profesores; declaran adscripción académica
--   jurado      evalúa proyectos; puede ser externo a la universidad
--   estudiante  rol por defecto al registrarse; declara adscripción académica
--
-- "emprendedor" pasa a "estudiante" y "mentor" a "docente". "visitante"
-- desaparece: el público entra sin cuenta.

-- El CHECK viejo rechazaría los valores nuevos: se quita antes de migrar datos.
ALTER TABLE usuarios DROP CHECK chk_usuario_rol;

UPDATE usuarios SET rol = 'estudiante' WHERE rol IN ('emprendedor', 'visitante');
UPDATE usuarios SET rol = 'docente' WHERE rol = 'mentor';

ALTER TABLE usuarios
  ALTER COLUMN rol SET DEFAULT 'estudiante',
  ADD CONSTRAINT chk_usuario_rol CHECK (rol IN ('admin', 'macondolab', 'docente', 'jurado', 'estudiante'));
