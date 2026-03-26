import { cva } from 'class-variance-authority';

/**
 * Container variants for the Badge component (Styles the View)
 */
export const badgeVariants = cva(
  'flex-row items-center justify-center rounded-full px-2.5 py-0.5 gap-1',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-primary/10',
        destructive: 'bg-error',
        'soft-error': 'bg-error-container/15',
        outline: 'bg-transparent border-2 border-primary/20',
        ghost: 'bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Text variants for the Badge component (Styles the Text)
 */
export const badgeTextVariants = cva(
  'font-sans text-xs font-semibold tracking-wide uppercase',
  {
    variants: {
      variant: {
        default: 'text-white',
        secondary: 'text-primary',
        destructive: 'text-white',
        'soft-error': 'text-error',
        outline: 'text-primary',
        ghost: 'text-text-variant',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
