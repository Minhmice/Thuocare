import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'flex-row items-center justify-center rounded-full active:opacity-70 disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-surface-low',
        ghost: 'bg-transparent active:bg-primary/5',
        destructive: 'bg-error',
        outline: 'bg-transparent border-2 border-primary/40',
        link: 'bg-transparent',
      },
      size: {
        default: 'px-6 py-3 min-h-[52px]',
        sm: 'px-4 py-2 min-h-[40px]',
        lg: 'px-8 py-4 min-h-[64px]',
        icon: 'p-3 aspect-square',
        xs: 'px-3 py-1.5 min-h-[32px]',
        'icon-sm': 'p-2 aspect-square',
        'icon-lg': 'p-4 aspect-square',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const buttonTextVariants = cva(
  'font-sans font-medium text-center',
  {
    variants: {
      variant: {
        default: 'text-white',
        secondary: 'text-primary',
        ghost: 'text-primary',
        destructive: 'text-white',
        outline: 'text-primary',
        link: 'text-primary underline',
      },
      size: {
        default: 'text-base',
        sm: 'text-sm',
        lg: 'text-lg',
        icon: 'text-base',
        xs: 'text-xs',
        'icon-sm': 'text-sm',
        'icon-lg': 'text-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
