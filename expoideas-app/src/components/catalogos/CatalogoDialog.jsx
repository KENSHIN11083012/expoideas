import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { aplicarErroresDelServidor } from '@/utils/validaciones';
import { catalogoSchema, programaSchema } from '@/schemas/catalogo';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Alert } from '@/components/ui/feedback';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

/**
 * Alta y edición de un registro de catálogo. Los programas académicos piden
 * además la facultad.
 *
 * @param {object} catalogo   { singular, nuevo, articulo, requiereFacultad }
 * @param {object|null} item  null para crear
 * @param {Array} facultades  opciones del select (solo programas)
 * @param {(datos: object) => Promise} onGuardar
 */
export function CatalogoDialog({ catalogo, item, facultades = [], onGuardar, onClose }) {
    const editando = Boolean(item);
    const { requiereFacultad } = catalogo;

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting, isDirty },
    } = useForm({
        resolver: zodResolver(requiereFacultad ? programaSchema : catalogoSchema),
        defaultValues: requiereFacultad
            ? { nombre: item?.nombre ?? '', facultadId: item?.facultadId != null ? String(item.facultadId) : '' }
            : { nombre: item?.nombre ?? '' },
    });

    const onSubmit = async (datos) => {
        const cuerpo = requiereFacultad ? { nombre: datos.nombre, facultadId: Number(datos.facultadId) } : { nombre: datos.nombre };
        try {
            await onGuardar(cuerpo);
            onClose();
        } catch (error) {
            if (error.status === 409) {
                setError('nombre', { type: 'server', message: `Ya existe ${catalogo.articulo} con ese nombre` }, { shouldFocus: true });
            } else if (!aplicarErroresDelServidor(error, setError)) {
                setError('root', { type: 'server', message: error.message });
            }
        }
    };

    return (
        <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
            <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <DialogHeader>
                        <DialogTitle>{editando ? `Editar ${catalogo.singular}` : catalogo.nuevo}</DialogTitle>
                        <DialogDescription>
                            {editando ? `Cambia los datos de "${item.nombre}".` : `Agrega ${catalogo.articulo} al catálogo.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {errors.root && <Alert variant="error" title={errors.root.message} />}
                        <Field label="Nombre" error={errors.nombre?.message} required>
                            <Input autoComplete="off" autoFocus {...register('nombre')} />
                        </Field>
                        {requiereFacultad && (
                            <Field
                                label="Facultad"
                                error={errors.facultadId?.message}
                                hint={facultades.length === 0 ? 'Primero crea al menos una facultad.' : undefined}
                                required
                            >
                                <NativeSelect {...register('facultadId')}>
                                    <option value="">Selecciona una facultad</option>
                                    {facultades.map((f) => (
                                        <option key={f.id} value={String(f.id)}>{f.nombre}</option>
                                    ))}
                                </NativeSelect>
                            </Field>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" loading={isSubmitting} disabled={editando && !isDirty}>
                            {editando ? 'Guardar cambios' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
