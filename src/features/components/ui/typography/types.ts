import { TextProps as RNTextProps } from 'react-native';

export type TypographyVariant =
  | 'display-lg'
  | 'display-md'
  | 'display-sm'
  | 'headline-lg'
  | 'headline-md'
  | 'headline-sm'
  | 'title-lg'
  | 'title-md'
  | 'title-sm'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'label-lg'
  | 'label-md'
  | 'label-sm';

export interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: 'normal' | 'bold' | 'semi-bold' | 'medium';
  align?: 'left' | 'center' | 'right' | 'justify';
}
