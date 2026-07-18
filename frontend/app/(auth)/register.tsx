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
  confirmPassword?: string;
  general?: string;
}

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      newErrors.password = 'Include at least one uppercase letter and one number.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrors({ general: error.message });
    } else {
      Alert.alert(
        'Check your email',
        `We sent a confirmation link to ${email.trim()}. Confirm it, then sign in.`,
        [{ text: 'OK' }]
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
          Create account
        </Text>
        <Text style={styles.subtitle}>Start breaking bad habits today</Text>

        {/* General error banner */}
        {errors.general ? (
          <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
            <Text style={styles.errorBannerText} accessibilityRole="alert">
              {errors.general}
            </Text>
          </View>
        ) : null}

        {/* Email */}
        <Text style={styles.label} nativeID="regEmailLabel">
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
          accessibilityLabelledBy="regEmailLabel"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!loading}
        />
        {errors.email ? (
          <Text style={styles.fieldError} accessibilityRole="alert">
            {errors.email}
          </Text>
        ) : null}

        {/* Password */}
        <Text style={styles.label} nativeID="regPasswordLabel">
          Password
        </Text>
        <TextInput
          ref={passwordRef}
          style={[styles.input, errors.password ? styles.inputError : null]}
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          secureTextEntry
          autoComplete="new-password"
          accessibilityLabel="Password"
          accessibilityLabelledBy="regPasswordLabel"
          accessibilityHint="Minimum 8 characters with at least one uppercase letter and one number"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          editable={!loading}
        />
        {errors.password ? (
          <Text style={styles.fieldError} accessibilityRole="alert">
            {errors.password}
          </Text>
        ) : null}

        {/* Confirm password */}
        <Text style={styles.label} nativeID="regConfirmLabel">
          Confirm Password
        </Text>
        <TextInput
          ref={confirmRef}
          style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
          placeholder="Repeat your password"
          value={confirmPassword}
          onChangeText={(v) => {
            setConfirmPassword(v);
            if (errors.confirmPassword)
              setErrors((e) => ({ ...e, confirmPassword: undefined }));
          }}
          secureTextEntry
          autoComplete="new-password"
          accessibilityLabel="Confirm password"
          accessibilityLabelledBy="regConfirmLabel"
          returnKeyType="go"
          onSubmitEditing={handleRegister}
          editable={!loading}
        />
        {errors.confirmPassword ? (
          <Text style={styles.fieldError} accessibilityRole="alert">
            {errors.confirmPassword}
          </Text>
        ) : null}

        {/* Password strength hint */}
        <Text style={styles.hint}>
          Password must be at least 8 characters and include an uppercase letter and a number.
        </Text>

        {/* Register button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityLabel="Create account"
          accessibilityRole="button"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" accessibilityLabel="Creating account…" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Sign in link */}
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Go to sign in screen"
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkBold}>Sign In</Text>
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
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
    marginTop: 4,
    lineHeight: 18,
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
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
