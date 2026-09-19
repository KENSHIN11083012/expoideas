import { Alert } from '@/components/ui/feedback';
import { Button } from '@/components/ui/button';
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
 * Diálogo con un formulario: título, descripción, error general, campos y pie
 * con Cancelar y el botón de envío. Se monta abierto y se cierra con onClose.
 *
 * @param {(event) => void} onSubmit  normalmente handleSubmit(...) de react-hook-form
 * @param {string} [error]            error general (errors.root?.message)
 */
export function FormDialog({
    title,
    description,
    onClose,
    onSubmit,
    error,
    submitLabel,
    submitting = false,
    submitDisabled = false,
    className,
    children,
}) {
    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={className}>
                <form onSubmit={onSubmit} noValidate>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {error && <Alert variant="error" title={error} />}
                        {children}
                    </DialogBody>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={submitting} disabled={submitDisabled}>
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
