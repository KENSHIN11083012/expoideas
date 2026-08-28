export const FILTER_CONFIG = [
    {
        key: 'programaAcademico',
        label: 'Programa Académico',
        type: 'select' // 'select' means it expects single value mapping
    },
    {
        key: 'sectoresExperiencia',
        label: 'Sector de Experiencia',
        type: 'multi-select', // Multi-select means we expect arrays of objects/strings in the user data
        extractKey: 'nombre' // If it's an object, extract this key
    },
    {
        key: 'competenciasTecnicas',
        label: 'Competencia Técnica',
        type: 'multi-select',
        extractKey: 'nombre'
    },
    {
        key: 'competenciasTransversales',
        label: 'Competencia Transversal',
        type: 'multi-select',
        extractKey: 'nombre'
    },
    {
        key: 'facultad',
        label: 'Facultad',
        type: 'select'
    },
    {
        key: 'ciudad',
        label: 'Ciudad',
        type: 'select'
    },
    {
        key: 'idiomas',
        label: 'Idioma',
        type: 'multi-select'
    }
];

export const TABLE_COLUMNS = [
    {
        key: 'nombreCompleto',
        label: 'Usuario',
        sortable: true
    },
    {
        key: 'programaAcademico',
        label: 'Programa Académico',
        sortable: true
    },
    {
        key: 'sectoresExperiencia',
        label: 'Sectores',
        sortable: false
    },
    {
        key: 'competenciasTecnicas',
        label: 'Competencias',
        sortable: false
    },
    {
        key: 'acciones',
        label: '',
        sortable: false,
        align: 'right'
    }
];
