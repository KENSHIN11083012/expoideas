-- Adscripción académica del usuario.
--
-- Hasta aquí la facultad salía del programa académico, así que un docente o
-- mentor sin programa no tenía facultad. Ahora la facultad se guarda en el
-- usuario y el programa es opcional (si lo hay, debe ser de esa facultad: lo
-- valida UsuarioService).

ALTER TABLE usuarios
  ADD COLUMN id_facultad INT NULL AFTER id_sede,
  ADD CONSTRAINT fk_usuario_facultad FOREIGN KEY (id_facultad) REFERENCES facultades (id);

-- Las cuentas que ya tenían programa toman la facultad de ese programa.
UPDATE usuarios u
  JOIN programas_academicos p ON p.id = u.id_programa_academico
   SET u.id_facultad = p.id_facultad
 WHERE u.id_facultad IS NULL;

-- El registro ahora exige sede: en una instalación nueva se crean las dos sedes
-- de la universidad. Si ya hay sedes cargadas no se toca nada.
INSERT INTO sede (nombre)
SELECT nombre
  FROM (SELECT 'Barranquilla' AS nombre UNION ALL SELECT 'Cúcuta') AS sedes
 WHERE NOT EXISTS (SELECT 1 FROM sede);
