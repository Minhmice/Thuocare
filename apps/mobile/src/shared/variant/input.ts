import { cva } from 'class-variance-authority';

export const inputVariants = cva(
  'bg-surface-lowest rounded-2xl min-h-[56px] px-5 py-4 text-text text-base font-sans border border-transparent focus:border-primary/20',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-error/40 bg-error-container/5 focus:border-error/60',
        disabled: 'opacity-60 bg-surface-low',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
