-- Autorizacion de tratamiento de datos personales.
--
-- El formulario de registro ya la pedia (autorizaDatos), pero la API la
-- descartaba sin guardarla. Queda constancia de si se dio y cuando.
-- Las cuentas anteriores a esta migracion quedan en FALSE: no hay registro de
-- que la hayan dado.

ALTER TABLE usuarios
  ADD COLUMN autoriza_datos           BOOLEAN  NOT NULL DEFAULT FALSE,
  ADD COLUMN fecha_autorizacion_datos DATETIME NULL;
