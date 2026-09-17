-- Primer ingreso seguro. Una contraseña puesta por la gestión (cuenta creada por
-- MacondoLab o restablecida) es temporal: la persona debe cambiarla antes de
-- usar la plataforma. La autorización de datos ya existe (V2); quien no la dio,
-- como las cuentas creadas desde la gestión, la da en ese mismo primer ingreso.
ALTER TABLE usuarios
  ADD COLUMN debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE AFTER password;
