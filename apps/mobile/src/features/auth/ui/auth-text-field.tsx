import { forwardRef, useState } from 'react';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';
import { Text } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  helperText?: string;
  enablePasswordToggle?: boolean;
}

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(function AuthTextField({
  label,
  helperText,
  enablePasswordToggle = false,
  secureTextEntry,
  ...inputProps
}, ref) {
  const [focused, setFocused] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const shouldHideSecret = enablePasswordToggle ? !showSecret : secureTextEntry;

  return (
    <View className="gap-2">
      <Text variant="label" className="ml-1 tracking-widest uppercase font-bold text-text-variant">{label}</Text>
      <View
        className={cn(
          "bg-surface-low rounded-2xl min-h-[60px] px-5 flex-row items-center gap-2 border-2 border-transparent",
          focused && "bg-surface-lowest border-primary/30"
        )}
      >
        <TextInput
          {...inputProps}
          ref={ref}
          secureTextEntry={shouldHideSecret}
          className="flex-1 text-text text-base py-4 font-sans"
          placeholderTextColor="#717786"
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
        />
        {enablePasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showSecret ? 'Hide password' : 'Show password'}
            onPress={() => setShowSecret((current) => !current)}
            className="px-2 py-2"
          >
            <Text variant="bodySmall" className="text-text-variant font-bold">
              {showSecret ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {helperText ? (
        <Text variant="bodySmall" className="text-text-variant opacity-80 leading-snug">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});
