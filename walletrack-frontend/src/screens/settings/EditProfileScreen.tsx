import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Avatar, InlineError } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useUpdateProfile } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { AVATAR_COLORS, cn } from '../../theme/utils';
import { useToast } from '../../utils/toast';
import { ApiError } from '../../api/client';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const updateProfile = useUpdateProfile();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatarColor(user.avatarColor);
    }
  }, [user]);

  if (!user) return null;

  const currentEmail = user.email;

  function validate(): boolean {
    const next: { name?: string; email?: string } = {};
    if (!name.trim()) next.name = 'Enter a name.';
    if (email !== currentEmail) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        next.email = 'That does not look like an email address.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      const updated = await updateProfile.mutateAsync({
        name: name.trim(),
        avatarColor,
      });
      setUser(updated);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Profile updated');
      navigation.goBack();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ name: error.fieldError('name'), email: error.fieldError('email') });
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
          <Text variant="title3">Edit profile</Text>
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
        <View className="mb-6 items-center">
          <Avatar name={name || user.email} color={avatarColor} size={88} />
          <Text variant="caption" tone="muted" className="mt-2">
            Tap a colour below to change your avatar
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-center gap-3">
          {AVATAR_COLORS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Avatar colour ${option}`}
              accessibilityState={{ selected: option === avatarColor }}
              onPress={() => setAvatarColor(option)}
              className="h-10 w-10 items-center justify-center rounded-pill"
              style={{ backgroundColor: `${option}26` }}
            >
              <View
                className="h-7 w-7 items-center justify-center rounded-pill"
                style={{ backgroundColor: option }}
              >
                {option === avatarColor ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
            </Pressable>
          ))}
        </View>

        <Input
          label="Name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          placeholder="Alex Morgan"
          autoCapitalize="words"
          error={errors.name}
          containerClassName="mt-7"
        />

        <Input
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={
            errors.email ??
            (email !== currentEmail ? 'Email changes are not supported yet.' : undefined)
          }
          hint={email === currentEmail ? undefined : 'Contact support to change your email.'}
          editable={false}
          containerClassName="mt-4"
          className={cn(email !== currentEmail && 'opacity-60')}
        />

        <View className="mt-5">
          <InlineError message={updateProfile.error?.message} />
          <Button
            label="Save changes"
            size="lg"
            onPress={() => void handleSave()}
            loading={updateProfile.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}