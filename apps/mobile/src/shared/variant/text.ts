import { cva } from 'class-variance-authority';

export const textVariants = cva(
  'text-text',
  {
    variants: {
      variant: {
        display: 'font-display text-4xl font-bold tracking-tight',
        h1: 'font-display text-2xl font-bold tracking-tight',
        h2: 'font-display text-xl font-semibold',
        h3: 'font-display text-lg font-semibold',
        bodyLarge: 'font-sans text-lg leading-relaxed',
        body: 'font-sans text-base leading-relaxed',
        bodyMedium: 'font-sans text-[15px] leading-relaxed',
        bodySmall: 'font-sans text-sm leading-relaxed',
        label: 'font-sans text-xs font-medium text-text-variant',
      },
    },
    defaultVariants: {
      variant: 'body',
    },
  }
);
