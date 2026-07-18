import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useState, useRef } from 'react';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const passwordRef = useRef<TextInput>(null);

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) {
      setErrors({ general: error.message });
    }
    // Navigation handled by root _layout auth guard
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email to receive a magic link.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }

    setMagicLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });

    setMagicLoading(false);
    if (error) {
      setErrors({ general: error.message });
    } else {
      Alert.alert(
        'Magic link sent',
        `Check ${email.trim()} for your sign-in link.`
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title} accessibilityRole="header">
          Welcome back
        </Text>
        <Text style={styles.subtitle}>Sign in to HabitHeal</Text>

        {/* General error banner */}
        {errors.general ? (
          <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
            <Text style={styles.errorBannerText} accessibilityRole="alert">
              {errors.general}
            </Text>
          </View>
        ) : null}

        {/* Email field */}
        <Text style={styles.label} nativeID="emailLabel">
          Email
        </Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="you@example.com"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          accessibilityLabel="Email address"
          accessibilityLabelledBy="emailLabel"
          accessibilityHint="Enter the email address associated with your account"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!loading}
        />
        {errors.email ? (
          <Text style={styles.fieldError} accessibilityRole="alert">
            {errors.email}
          </Text>
        ) : null}

        {/* Password field */}
        <Text style={styles.label} nativeID="passwordLabel">
          Password
        </Text>
        <TextInput
          ref={passwordRef}
          style={[styles.input, errors.password ? styles.inputError : null]}
          placeholder="••••••••"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          secureTextEntry
          autoComplete="password"
          accessibilityLabel="Password"
          accessibilityLabelledBy="passwordLabel"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
          editable={!loading}
        />
        {errors.password ? (
          <Text style={styles.fieldError} accessibilityRole="alert">
            {errors.password}
          </Text>
        ) : null}

        {/* Sign In button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading || magicLoading}
          accessibilityLabel="Sign in with email and password"
          accessibilityRole="button"
          accessibilityState={{ disabled: loading || magicLoading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" accessibilityLabel="Signing in…" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Magic link */}
        <TouchableOpacity
          style={styles.ghostButton}
          onPress={handleMagicLink}
          disabled={loading || magicLoading}
          accessibilityLabel="Send magic link to email"
          accessibilityRole="button"
          accessibilityState={{ disabled: loading || magicLoading, busy: magicLoading }}
        >
          {magicLoading ? (
            <ActivityIndicator color="#4F46E5" accessibilityLabel="Sending magic link…" />
          ) : (
            <Text style={styles.ghostButtonText}>Send magic link instead</Text>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Go to registration screen"
          >
            <Text style={styles.linkText}>
              Don&apos;t have an account?{' '}
              <Text style={styles.linkBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 4,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 10,
    marginLeft: 2,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ghostButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ghostButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
  linkText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  linkBold: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
