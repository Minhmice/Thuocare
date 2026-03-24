import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useMobileAuth } from '@/lib/auth/mobile-auth';

export default function SignInScreen() {
  const { signIn } = useMobileAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardRoot}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Thuocare</Text>
          <Text style={styles.subtitle}>Sign in to your patient account</Text>

          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={() => passwordRef.current?.focus()}
            placeholder="Email"
            placeholderTextColor="#6b7280"
            returnKeyType="next"
            style={styles.input}
            value={email}
          />

          <TextInput
            ref={passwordRef}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setPassword}
            onSubmitEditing={() => void onSubmit()}
            placeholder="Password"
            placeholderTextColor="#6b7280"
            returnKeyType="go"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.submitButtonSlot} collapsable={false}>
            <Pressable
              accessibilityLabel="Sign in"
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !isSubmitting ? styles.submitButtonPressed : null,
                isSubmitting ? styles.submitButtonDisabled : null,
              ]}
            >
              {isSubmitting ? (
                <View style={styles.submitButtonInner}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.submitText}>Signing in…</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>Sign In</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 16,
  },
  input: {
    borderColor: '#d1d5db',
    borderRadius: 10,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
  },
  submitButtonSlot: {
    marginTop: 8,
    width: '100%',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 48,
    width: '100%',
  },
  submitButtonInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
