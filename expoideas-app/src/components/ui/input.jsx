import { cn } from '@/lib/utils';
import { campoBase } from './estilos';

export function Input({ className, type = 'text', ...props }) {
    return <input data-slot="input" type={type} className={cn(campoBase, 'h-11', className)} {...props} />;
}
