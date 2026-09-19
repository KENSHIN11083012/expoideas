/** Cuentas de ejemplo, con la forma que devuelve la API. */

export const ana = {
    id: 1,
    firstName: 'Ana María',
    lastName: 'Pérez',
    email: 'ana@unisimon.edu.co',
    role: 'STUDENT',
    campusId: 1,
    campus: 'Barranquilla',
    facultyId: 2,
    faculty: 'Ingeniería',
    pendingSteps: [],
};

export const luis = { id: 2, firstName: 'Luis', lastName: 'Gómez', email: 'luis@unisimon.edu.co', role: 'ADMIN', pendingSteps: [] };

export const carla = {
    id: 3,
    firstName: 'Carla',
    lastName: 'Díaz',
    email: 'coordinacion@unisimon.edu.co',
    role: 'MACONDOLAB',
    pendingSteps: [],
};

/** Jurado externo recién creado: aún no cambia su contraseña temporal. */
export const marta = {
    id: 4,
    firstName: 'Marta',
    lastName: 'Ríos',
    email: 'marta@empresa.com',
    role: 'JUDGE',
    pendingSteps: ['CHANGE_PASSWORD'],
};

const CATALOGS = {
    '/campuses': [{ id: 1, name: 'Barranquilla' }],
    '/faculties': [{ id: 2, name: 'Ingeniería' }],
    '/academic-programs': [],
};

/** Respuesta de catalogApi.list por ruta, para simular los catálogos. */
export const catalogFor = (path) => CATALOGS[path] ?? [];
