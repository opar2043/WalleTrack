import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyRound, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { InlineError } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useChangePassword } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { ApiError } from '../../api/client';
import { useToast } from '../../utils/toast';
import type { RootStackParamList } from '../../navigation/RootNavigator';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const changePassword = useChangePassword();
  const clearLocalSession = useAuthStore((state) => state.clearLocalSession);
  const toast = useToast();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirm?: string;
  }>({});

  function validate(): boolean {
    const found: typeof errors = {};
    if (!current) found.currentPassword = 'Enter your current password.';
    if (next.length < 8) found.newPassword = 'Use at least 8 characters.';
    else if (!/[A-Z]/.test(next) || !/[a-z]/.test(next) || !/\d/.test(next)) {
      found.newPassword = 'Include an uppercase letter, a lowercase letter and a number.';
    }
    if (next !== confirm) found.confirm = 'The two passwords do not match.';
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Changing the password revokes every session, including this one.
      await clearLocalSession();
      toast.success('Password updated. Sign in again.');
      navigation.navigate('SignIn');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          currentPassword: error.fieldError('currentPassword'),
          newPassword: error.fieldError('newPassword'),
        });
      }
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <View className="flex-1">
          <Text variant="title3">Change password</Text>
        </View>
        <IconButton
          accessibilityLabel="Close"
          icon={<X size={22} color="#8B8B94" />}
          onPress={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card className="mb-5 flex-row items-center">
          <View className="h-9 w-9 items-center justify-center rounded-pill bg-primarySoft">
            <KeyRound size={18} color="#4F46E5" />
          </View>
          <Text variant="caption" tone="secondary" className="ml-3 flex-1">
            Changing your password signs you out on every device, including this one.
          </Text>
        </Card>

        <Input
          label="Current password"
          value={current}
          onChangeText={(value) => {
            setCurrent(value);
            setErrors((e) => ({ ...e, currentPassword: undefined }));
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          error={errors.currentPassword}
        />

        <Input
          label="New password"
          value={next}
          onChangeText={(value) => {
            setNext(value);
            setErrors((e) => ({ ...e, newPassword: undefined }));
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          textContentType="newPassword"
          error={errors.newPassword}
          hint="At least 8 characters, with upper and lower case and a number."
          containerClassName="mt-4"
        />

        <Input
          label="Confirm new password"
          value={confirm}
          onChangeText={(value) => {
            setConfirm(value);
            setErrors((e) => ({ ...e, confirm: undefined }));
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          textContentType="newPassword"
          error={errors.confirm}
          containerClassName="mt-4"
        />

        <View className="mt-5">
          <InlineError message={changePassword.error?.message} />
          <Button
            label="Update password"
            size="lg"
            onPress={() => void handleSave()}
            loading={changePassword.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}