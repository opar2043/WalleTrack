import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Check, Mail, User } from 'lucide-react-native';

import { AuthFooterLink, AuthLayout } from '../../components/ui/AuthLayout';
import { Button } from '../../components/ui/Button';
import { InlineError } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { ApiError } from '../../api/client';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const RULES = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One number', test: (value: string) => /\d/.test(value) },
];

export default function SignUpScreen({ navigation }: Props) {
  const register = useAuthStore((state) => state.register);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const storeError = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    accepted?: string;
  }>({});

  const passedRules = useMemo(
    () => RULES.map((rule) => rule.test(password)),
    [password],
  );

  function validate(): boolean {
    const next: typeof fieldErrors = {};
    if (!name.trim()) next.name = 'Tell us what to call you.';
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      next.email = 'That does not look like an email address.';
    }
    if (passedRules.some((passed) => !passed)) {
      next.password = 'Choose a password that meets every requirement below.';
    }
    if (!accepted) next.accepted = 'Please accept the terms to continue.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setError(null);
    if (!validate()) return;
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors({
          email: caught.fieldError('email'),
          password: caught.fieldError('password'),
        });
      }
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free to start. No card required."
      footer={
        <AuthFooterLink
          prompt="Already have an account?"
          actionLabel="Sign in"
          onPress={() => {
            setError(null);
            navigation.goBack();
          }}
        />
      }
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <InlineError message={storeError} />

        <View className="gap-4">
          <Input
            label="Name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setFieldErrors((current) => ({ ...current, name: undefined }));
            }}
            placeholder="Alex Morgan"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            error={fieldErrors.name}
            leading={<User size={18} color="#8B8B94" />}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setFieldErrors((current) => ({ ...current, email: undefined }));
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            textContentType="emailAddress"
            error={fieldErrors.email}
            leading={<Mail size={18} color="#8B8B94" />}
          />

          <View>
            <Input
              label="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="Create a strong password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              error={fieldErrors.password}
              trailing={
                <Text
                  variant="captionStrong"
                  tone="primary"
                  onPress={() => setShowPassword((value) => !value)}
                  suppressHighlighting
                  accessibilityRole="button"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              }
            />

            <View className="mt-3 gap-1.5">
              {RULES.map((rule, index) => {
                const passed = passedRules[index];
                return (
                  <View key={rule.label} className="flex-row items-center">
                    <View
                      className={[
                        'h-4 w-4 items-center justify-center rounded-pill',
                        passed ? 'bg-success' : 'bg-surfaceSunken',
                      ].join(' ')}
                    >
                      {passed ? <Check size={11} color="#FFFFFF" strokeWidth={3} /> : null}
                    </View>
                    <Text
                      variant="caption"
                      tone={passed ? 'success' : 'muted'}
                      className="ml-2"
                    >
                      {rule.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View>
            <Text
              variant="callout"
              tone="secondary"
              onPress={() => {
                setAccepted((value) => !value);
                setFieldErrors((current) => ({ ...current, accepted: undefined }));
              }}
              suppressHighlighting
              accessibilityRole="checkbox"
              accessibilityState={{ checked: accepted }}
            >
              {accepted ? '✓  ' : '○  '}I agree to the Terms of Service and Privacy Policy.
            </Text>
            {fieldErrors.accepted ? (
              <Text variant="caption" tone="danger" className="mt-1">
                {fieldErrors.accepted}
              </Text>
            ) : null}
          </View>

          <Button
            label="Create account"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}