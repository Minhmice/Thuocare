import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { textVariants } from '@/shared/variant/text';

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
  className?: string;
}

export function Text({ className, variant, ...props }: TextProps) {
  return <RNText className={cn(textVariants({ variant }), className)} {...props} />;
}
