import { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Fingerprint, HardDrive, KeyRound, Trash2, X } from 'lucide-react-native';

import { Button, IconButton } from '../../components/ui/Button';
import { Card, SectionHeader } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Sheet';
import { Screen, ScreenHeader } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { useDeleteAccount } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../utils/toast';

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useDeleteAccount();
  const toast = useToast();
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (!user) return null;

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync();
      setConfirmVisible(false);
      await logout();
    } catch (error) {
      setConfirmVisible(false);
      toast.error(error instanceof Error ? error.message : 'Could not delete the account.');
    }
  }

  return (
    <Screen edges={{ top: true, bottom: true }}>
      <ScreenHeader
        title="Privacy and data"
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            accessibilityLabel="Close"
            icon={<X size={20} color="#8B8B94" />}
            onPress={() => navigation.goBack()}
          />
        }
      />

      <Card className="flex-row items-start">
        <View className="h-10 w-10 items-center justify-center rounded-pill bg-successSoft">
          <HardDrive size={19} color="#059669" />
        </View>
        <View className="ml-3 flex-1">
          <Text variant="bodyStrong">Your data stays yours</Text>
          <Text variant="callout" tone="secondary" className="mt-1">
            Walletrack stores only what it needs to show your finances: your name, email, a
            hashed password, and the accounts, transactions and budgets you create. Nothing is
            shared with advertisers or third-party analytics.
          </Text>
        </View>
      </Card>

      <SectionHeader title="On this device" className="mt-6" />
      <Card padded={false}>
        <InfoRow
          icon={<KeyRound size={19} color="#4F46E5" />}
          title="Session token"
          body="Stored in the encrypted iOS Keychain or Android Keystore, never in plain app storage. There is no refresh token: when the session ends you sign in again."
        />
        <View className="h-px bg-border" />
        <InfoRow
          icon={<Fingerprint size={19} color="#4F46E5" />}
          title="No biometrics collected"
          body="Walletrack does not read your fingerprint or face data. You can protect the app with your device passcode or biometrics through your phone settings."
        />
      </Card>

      <SectionHeader title="Your account" className="mt-6" />
      <Card padded={false}>
        <InfoRow
          icon={<Trash2 size={19} color="#DC2626" />}
          title="Delete everything"
          body={`Signing up as ${user.email}. Deleting removes every account, transaction, budget and setting immediately and cannot be undone.`}
        />
      </Card>

      <Button
        label="Delete my data"
        variant="danger"
        className="mt-6"
        onPress={() => setConfirmVisible(true)}
      />

      <Text variant="caption" tone="muted" center className="mt-6">
        Walletrack 1.0.0
      </Text>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete everything?"
        message="Your accounts, transactions, budgets and settings are removed permanently. This cannot be undone."
        confirmLabel="Delete forever"
        destructive
        loading={deleteAccount.isPending}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void handleDelete()}
      />
    </Screen>
  );
}

function InfoRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-row items-start px-4 py-3.5">
      <View className="mt-0.5">{icon}</View>
      <View className="ml-3 flex-1">
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" tone="secondary" className="mt-1">
          {body}
        </Text>
      </View>
    </View>
  );
}