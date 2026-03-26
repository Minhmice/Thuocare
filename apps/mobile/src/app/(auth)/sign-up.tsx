import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';

import { useMobileAuth } from '@/core/auth/mobile-auth';
import { mobileSupabase } from '@/core/supabase/mobile-client';
import { getPasswordStrength } from '@/features/auth/model/password-strength';
import { signUpSchema, type SignUpFormValues } from '@/features/auth/model/auth-schemas';
import { AuthTextField } from '@/features/auth/ui/auth-text-field';
import { cn } from '@/shared/lib/utils';
import { Button, Text } from '@/shared/ui';

type Step = 1 | 2;

const METADATA = {
  actor_type: 'patient',
  care_intent: 'personal',
} as const;

export default function SignUpScreen() {
  const { signUp } = useMobileAuth();
  const [step, setStep] = useState<Step>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const contactRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      full_name: '',
      contact_method: 'email',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    },
    mode: 'onBlur',
  });

  const contactMethod = watch('contact_method');
  const passwordValue = watch('password') ?? '';
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);
  const hasSubmissionSuccess = successMessage !== null;

  const onContinueStepTwo = async () => {
    setServerError(null);
    setSuccessMessage(null);
    const fieldsToValidate =
      contactMethod === 'email'
        ? (['full_name', 'contact_method', 'email'] as const)
        : (['full_name', 'contact_method', 'phone'] as const);
    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return;
    setStep(2);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (hasSubmissionSuccess) return;
    setServerError(null);
    setSuccessMessage(null);

    try {
      if (values.contact_method === 'email') {
        const result = await signUp(values.full_name.trim(), values.email!.trim(), values.password);
        if (result.needsEmailConfirmation) {
          setSuccessMessage('Account created. Please check your inbox to verify your email before signing in.');
          return;
        }
        setSuccessMessage('Account created and signed in. Redirecting to your secure home...');
        return;
      }

      const { data, error } = await mobileSupabase.auth.signUp({
        phone: values.phone!.trim(),
        password: values.password,
        options: {
          data: {
            full_name: values.full_name.trim(),
            ...METADATA,
          },
        },
      });

      if (error) throw error;

      if (data.session == null) {
        setSuccessMessage('Account created. Please verify your phone number to complete sign in.');
        return;
      }

      setSuccessMessage('Account created and signed in. Redirecting to your secure home...');
    } catch (submitError) {
      setServerError(submitError instanceof Error ? submitError.message : 'Could not create your account. Please try again.');
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
              {step === 1 ? 'Create account' : 'Secure your account'}
            </Text>
            <Text variant="body" className="max-w-[320px] pr-8 text-text-variant">
              {step === 1
                ? 'Enter your profile and preferred contact method.'
                : 'Create a strong password to protect your medication data.'}
            </Text>
          </View>

          <View className="gap-4">
            <View className="flex-row gap-2">
              {[1, 2].map((index) => (
                <View
                  key={index}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    index <= step ? 'bg-primary' : 'bg-surface-high',
                  )}
                />
              ))}
            </View>

            {step === 1 ? (
              <View className="gap-4">
                <Controller
                  control={control}
                  name="full_name"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <AuthTextField
                      autoCapitalize="words"
                      autoCorrect={false}
                      label="Full Name"
                      onBlur={onBlur}
                      onChangeText={(nextValue) => {
                        setServerError(null);
                        setSuccessMessage(null);
                        onChange(nextValue);
                      }}
                      onSubmitEditing={() => contactRef.current?.focus()}
                      placeholder="Nguyen Van A"
                      returnKeyType="next"
                      textContentType="name"
                      value={value}
                    />
                  )}
                />
                {errors.full_name ? (
                  <Text variant="bodySmall" className="px-1 text-error-dark">
                    {errors.full_name.message}
                  </Text>
                ) : null}

                <Controller
                  control={control}
                  name="contact_method"
                  render={({ field: { onChange, value } }) => (
                    <View className="gap-2">
                      <Text variant="label" className="ml-1 font-bold uppercase tracking-widest text-text-variant">
                        Contact Method
                      </Text>
                      <View className="flex-row gap-2">
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            setServerError(null);
                            setSuccessMessage(null);
                            onChange('email');
                          }}
                          className={cn(
                            'flex-1 rounded-2xl border px-4 py-3',
                            value === 'email' ? 'border-primary/40 bg-primary/10' : 'border-surface-high bg-surface-low',
                          )}
                        >
                          <Text
                            variant="bodySmall"
                            className={cn('text-center font-medium', value === 'email' ? 'text-primary' : 'text-text-variant')}
                          >
                            Email
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            setServerError(null);
                            setSuccessMessage(null);
                            onChange('phone');
                          }}
                          className={cn(
                            'flex-1 rounded-2xl border px-4 py-3',
                            value === 'phone' ? 'border-primary/40 bg-primary/10' : 'border-surface-high bg-surface-low',
                          )}
                        >
                          <Text
                            variant="bodySmall"
                            className={cn('text-center font-medium', value === 'phone' ? 'text-primary' : 'text-text-variant')}
                          >
                            Phone
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                />

                {contactMethod === 'email' ? (
                  <>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onBlur, onChange, value } }) => (
                        <AuthTextField
                          ref={contactRef}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          label="Email Address"
                          onBlur={onBlur}
                          onChangeText={(nextValue) => {
                            setServerError(null);
                            setSuccessMessage(null);
                            onChange(nextValue);
                          }}
                          onSubmitEditing={() => void onContinueStepTwo()}
                          placeholder="name@example.com"
                          returnKeyType="go"
                          textContentType="emailAddress"
                          value={value ?? ''}
                        />
                      )}
                    />
                    {errors.email ? (
                      <Text variant="bodySmall" className="px-1 text-error-dark">
                        {errors.email.message}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field: { onBlur, onChange, value } }) => (
                        <AuthTextField
                          ref={contactRef}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="phone-pad"
                          label="Phone Number (E.164)"
                          onBlur={onBlur}
                          onChangeText={(nextValue) => {
                            setServerError(null);
                            setSuccessMessage(null);
                            onChange(nextValue);
                          }}
                          onSubmitEditing={() => void onContinueStepTwo()}
                          placeholder="+84901234567"
                          returnKeyType="go"
                          textContentType="telephoneNumber"
                          value={value ?? ''}
                        />
                      )}
                    />
                    {errors.phone ? (
                      <Text variant="bodySmall" className="px-1 text-error-dark">
                        {errors.phone.message}
                      </Text>
                    ) : null}
                  </>
                )}

                <View className="mt-1 gap-3">
                  <Button variant="outline" className="w-full">
                    Continue with Google
                  </Button>
                  <Button variant="outline" className="w-full">
                    Continue with Apple
                  </Button>
                </View>
              </View>
            ) : (
              <View className="gap-4">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <AuthTextField
                      ref={passwordRef}
                      autoCapitalize="none"
                      autoCorrect={false}
                      enablePasswordToggle
                      helperText="Use 8+ chars with uppercase, lowercase, number, and special character."
                      label="Secure Password"
                      onBlur={onBlur}
                      onChangeText={(nextValue) => {
                        setServerError(null);
                        setSuccessMessage(null);
                        onChange(nextValue);
                      }}
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      placeholder="••••••••"
                      returnKeyType="next"
                      secureTextEntry
                      textContentType="newPassword"
                      value={value}
                    />
                  )}
                />

                <View className="gap-2">
                  <View className="flex-row gap-2">
                    {[1, 2, 3].map((barIndex) => (
                      <View
                        key={barIndex}
                        className={cn(
                          'h-2 flex-1 rounded-full',
                          barIndex <= strength.activeBars
                            ? strength.level === 'strong'
                              ? 'bg-primary'
                              : strength.level === 'medium'
                                ? 'bg-primary-container'
                                : 'bg-error'
                            : 'bg-surface-high',
                        )}
                      />
                    ))}
                  </View>
                  <Text
                    variant="bodySmall"
                    className={cn(
                      strength.level === 'strong'
                        ? 'text-primary'
                        : strength.level === 'medium'
                          ? 'text-primary-container'
                          : 'text-error-dark',
                    )}
                  >
                    Password strength: {strength.label}
                  </Text>
                </View>

                {errors.password ? (
                  <Text variant="bodySmall" className="px-1 text-error-dark">
                    {errors.password.message}
                  </Text>
                ) : null}

                <Controller
                  control={control}
                  name="confirm_password"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <AuthTextField
                      ref={confirmPasswordRef}
                      autoCapitalize="none"
                      autoCorrect={false}
                      enablePasswordToggle
                      label="Confirm Password"
                      onBlur={onBlur}
                      onChangeText={(nextValue) => {
                        setServerError(null);
                        setSuccessMessage(null);
                        onChange(nextValue);
                      }}
                      onSubmitEditing={() => void onSubmit()}
                      placeholder="••••••••"
                      returnKeyType="go"
                      secureTextEntry
                      textContentType="newPassword"
                      value={value}
                    />
                  )}
                />
                {errors.confirm_password ? (
                  <Text variant="bodySmall" className="px-1 text-error-dark">
                    {errors.confirm_password.message}
                  </Text>
                ) : null}
              </View>
            )}

            {successMessage ? (
              <View className="mt-1 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3">
                <Text variant="bodySmall" className="font-bold text-primary">
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {serverError ? (
              <View className="mt-1 rounded-2xl border border-error/30 bg-error/5 px-4 py-3">
                <Text variant="bodySmall" className="text-error-dark">
                  {serverError}
                </Text>
              </View>
            ) : null}

            <View className="mt-2 rounded-[20px] bg-white/70 p-4">
              <Text variant="bodySmall" className="leading-relaxed text-text-variant opacity-90">
                Your data is encrypted with clinical-grade security. We never share your records with third parties.
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8 gap-4">
          {step === 1 ? (
            <Button disabled={isSubmitting} onPress={() => void onContinueStepTwo()} className="w-full">
              Continue
            </Button>
          ) : (
            <View className="flex-row gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={isSubmitting}
                onPress={() => {
                  setServerError(null);
                  setSuccessMessage(null);
                  setStep(1);
                }}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={isSubmitting || hasSubmissionSuccess}
                loading={isSubmitting}
                onPress={() => void onSubmit()}
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </Button>
            </View>
          )}

          <Text variant="bodySmall" className="mt-2 text-center text-text-variant">
            Already have an account?{' '}
            <Link href="/(auth)/sign-in" className="font-bold text-primary">
              Sign In
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
