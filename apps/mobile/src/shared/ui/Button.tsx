import React from 'react';
import { 
  Pressable, 
  ActivityIndicator, 
  View, 
  type PressableProps 
} from 'react-native';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { Text } from './Text';
import { buttonVariants, buttonTextVariants } from '@/shared/variant/button';

export interface ButtonProps 
  extends Omit<PressableProps, 'children'>, 
    VariantProps<typeof buttonVariants> {
  label?: string;
  loading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

/**
 * A highly reusable, production-ready Button component following 
 * "The Serene Clinical Aesthetic" design system.
 */
export function Button({
  variant,
  size,
  label,
  loading = false,
  asChild = false,
  leftIcon,
  rightIcon,
  className,
  textClassName,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isLoading = loading;
  const isDisabled = disabled || isLoading;

  const textClass = cn(buttonTextVariants({ variant, size }), textClassName);

  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          color={variant === 'default' || variant === 'destructive' ? '#ffffff' : '#0058BC'}
          size="small"
        />
      );
    }

    return (
      <>
        {leftIcon ? <View>{leftIcon}</View> : null}
        {children == null ? (
          <Text className={textClass}>{label}</Text>
        ) : (
          React.Children.map(children, (child) => {
            if (typeof child === 'string' || typeof child === 'number') {
              return <Text className={textClass}>{child}</Text>;
            }

            return child;
          })
        )}
        {rightIcon ? <View>{rightIcon}</View> : null}
      </>
    );
  };
  
  // Implementation of asChild pattern
  // Note: Since @rn-primitives/slot is not available, we handle it by
  // cloning the child and merging the styling.
  if (asChild && React.isValidElement<{ className?: string; disabled?: boolean }>(children)) {
    return React.cloneElement(children, {
      ...props,
      className: cn(buttonVariants({ variant, size }), className, children.props.className),
      disabled: isDisabled,
    });
  }

  return (
    <Pressable
      disabled={isDisabled}
      className={cn(
        buttonVariants({ variant, size }),
        isDisabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {() => <View className="flex-row items-center justify-center gap-2">{renderContent()}</View>}
    </Pressable>
  );
}

export { buttonVariants, buttonTextVariants };
