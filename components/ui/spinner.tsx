import { Loader2, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends LucideProps {
    size?: 'sm' | 'default' | 'lg' | 'icon';
}

export function Spinner({ className, size = 'default', ...props }: SpinnerProps) {
    return (
        <Loader2
            className={cn(
                'animate-spin',
                {
                    'h-4 w-4': size === 'sm',
                    'h-6 w-6': size === 'default',
                    'h-8 w-8': size === 'lg',
                    'h-10 w-10': size === 'icon',
                },
                className
            )}
            {...props}
        />
    );
}
