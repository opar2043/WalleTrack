import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { IconButton } from './Button';
import { Divider } from './Button';
import { Text } from './Text';
import { radius } from '../../theme/tokens';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Sticky footer, typically the primary action. */
  footer?: ReactNode;
  /** Fraction of the screen the sheet may occupy. */
  maxHeightRatio?: number;
  scrollable?: boolean;
};

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeightRatio = 0.9,
  scrollable = true,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const maxHeight = screenHeight * maxHeightRatio;

  const Body = scrollable ? ScrollView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="absolute inset-0 bg-overlay"
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="justify-end"
        >
          <View
            className="w-full overflow-hidden rounded-t-3xl border-t border-border bg-surface"
            style={{ maxHeight, paddingBottom: insets.bottom }}
          >
            <View className="items-center pb-1 pt-2.5">
              <View className="h-1 w-10 rounded-pill bg-borderStrong" />
            </View>

            {title ? (
              <View className="flex-row items-start px-5 pb-3 pt-2">
                <View className="flex-1 pr-3">
                  <Text variant="title3">{title}</Text>
                  {subtitle ? (
                    <Text variant="caption" tone="muted" className="mt-0.5">
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                <IconButton
                  accessibilityLabel="Close"
                  icon={<X size={20} color="#8B8B94" />}
                  onPress={onClose}
                  size={36}
                />
              </View>
            ) : null}

            {title ? <Divider /> : null}

            <Body
              className={scrollable ? '' : undefined}
              keyboardShouldPersistTaps="handled"
              {...(scrollable
                ? { contentContainerStyle: { padding: 20 }, showsVerticalScrollIndicator: false }
                : { style: { padding: 20 } })}
            >
              {children}
            </Body>

            {footer ? (
              <>
                <Divider />
                <View className="px-5 pb-2 pt-4">{footer}</View>
              </>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-7">
        <Pressable accessibilityRole="button" className="absolute inset-0 bg-overlay" onPress={onCancel} />
        <View
          className="w-full bg-surface p-5"
          style={{ borderRadius: radius.xl, maxWidth: 380 }}
        >
          <Text variant="title3">{title}</Text>
          <Text variant="callout" tone="secondary" className="mt-2">
            {message}
          </Text>
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <ConfirmButton label={cancelLabel} onPress={onCancel} />
            </View>
            <View className="flex-1">
              <ConfirmButton
                label={confirmLabel}
                onPress={onConfirm}
                loading={loading}
                tone={destructive ? 'danger' : 'primary'}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmButton({
  label,
  onPress,
  loading,
  tone = 'neutral',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  tone?: 'neutral' | 'primary' | 'danger';
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
        }
        className={[
          'h-12 items-center justify-center rounded-md',
          tone === 'primary' ? 'bg-primary' : tone === 'danger' ? 'bg-danger' : 'bg-surfaceSunken',
          loading ? 'opacity-50' : '',
        ].join(' ')}
      >
        <Text
          variant="bodyStrong"
          className={tone === 'neutral' ? 'text-contentSecondary' : 'text-white'}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
