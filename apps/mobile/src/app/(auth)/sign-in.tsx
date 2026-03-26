import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';

import { useMobileAuth } from '@/core/auth/mobile-auth';
import { signInSchema, type SignInFormValues } from '@/features/auth/model/auth-schemas';
import { AuthTextField } from '@/features/auth/ui/auth-text-field';
import { cn } from '@/shared/lib/utils';
import { Button, Text } from '@/shared/ui';

export default function SignInScreen() {
  const { signIn } = useMobileAuth();
  const passwordRef = useRef<TextInput>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setAuthError(null);
    try {
      await signIn(values.email.trim(), values.password);
    } catch (submitError) {
      setAuthError(submitError instanceof Error ? submitError.message : 'Sign-in failed. Please try again.');
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-surface">
      <ScrollView
        contentContainerClassName="flex-grow justify-between px-6 pt-24 pb-16 gap-6"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-6">
          <View className="gap-2">
            <Text variant="h2" className="font-bold tracking-tight text-primary">
              Thuocare
            </Text>
            <Text variant="display" className="text-4xl text-text">
              Welcome back
            </Text>
            <Text variant="body" className="max-w-[320px] pr-8 text-text-variant">
              Sign in to continue your calm, secure medication routine.
            </Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <AuthTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  label="Email Address"
                  onBlur={onBlur}
                  onChangeText={(nextEmail) => {
                    setAuthError(null);
                    onChange(nextEmail);
                  }}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  placeholder="name@example.com"
                  returnKeyType="next"
                  textContentType="emailAddress"
                  value={value}
                />
              )}
            />
            {errors.email ? (
              <Text variant="bodySmall" className="px-1 text-error-dark">
                {errors.email.message}
              </Text>
            ) : null}

            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <AuthTextField
                  ref={passwordRef}
                  autoCapitalize="none"
                  autoCorrect={false}
                  enablePasswordToggle
                  label="Secure Password"
                  onBlur={onBlur}
                  onChangeText={(nextPassword) => {
                    setAuthError(null);
                    onChange(nextPassword);
                  }}
                  onSubmitEditing={() => void onSubmit()}
                  placeholder="••••••••"
                  returnKeyType="go"
                  secureTextEntry
                  textContentType="password"
                  value={value}
                />
              )}
            />
            {errors.password ? (
              <Text variant="bodySmall" className="px-1 text-error-dark">
                {errors.password.message}
              </Text>
            ) : null}

            {authError ? (
              <View className="mt-1 rounded-2xl border border-error/30 bg-error/5 px-4 py-3">
                <Text variant="bodySmall" className="text-error-dark">
                  {authError}
                </Text>
              </View>
            ) : null}

            <View className="mt-2 rounded-[20px] bg-white/70 p-4">
              <Text variant="bodySmall" className="leading-relaxed text-text-variant opacity-90">
                Your data is encrypted with clinical-grade security. We never share your records with third parties.
              </Text>
            </View>

            <View className="mt-1 gap-3">
              <Button variant="outline" className="w-full">
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full">
                Continue with Apple
              </Button>
            </View>
          </View>
        </View>

        <View className="mt-8 gap-4">
          <Button disabled={isSubmitting} loading={isSubmitting} onPress={() => void onSubmit()} className="w-full">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
          <Text variant="bodySmall" className="mt-2 text-center text-text-variant">
            New to Thuocare?{' '}
            <Link href="/(auth)/sign-up" className={cn('font-bold text-primary')}>
              Create account
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
