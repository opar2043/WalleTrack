import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Mail } from 'lucide-react-native';

import { AuthFooterLink, AuthLayout } from '../../components/ui/AuthLayout';
import { Button } from '../../components/ui/Button';
import { InlineError } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { ApiError } from '../../api/client';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const storeError = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      next.email = 'That does not look like an email address.';
    }
    if (!password) next.password = 'Enter your password.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setError(null);
    if (!validate()) return;
    try {
      await login(email.trim().toLowerCase(), password);
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
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <AuthFooterLink
          prompt="New to Walletrack?"
          actionLabel="Create an account"
          onPress={() => {
            setError(null);
            navigation.navigate('SignUp');
          }}
        />
      }
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <InlineError message={storeError} />

        <View className="gap-4">
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

          <Input
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
            }}
            placeholder="Your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            error={fieldErrors.password}
            trailing={
              <Text
                variant="captionStrong"
                tone="primary"
                onPress={() => setShowPassword((value) => !value)}
                suppressHighlighting
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            }
          />

          <Button
            label="Sign in"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />

          <Text variant="caption" tone="muted" center className="pt-2">
            Your session is stored securely on this device. Walletrack never keeps your
            password on the phone.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}