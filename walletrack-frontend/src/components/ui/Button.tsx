import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { Text } from './Text';
import { elevation, radius } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primaryHover',
  secondary: 'bg-surfaceSunken active:bg-border border border-border',
  ghost: 'bg-transparent active:bg-surfaceSunken',
  danger: 'bg-danger active:opacity-90',
  success: 'bg-success active:opacity-90',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-content',
  ghost: 'text-primary',
  danger: 'text-white',
  success: 'text-white',
};

const SIZE: Record<ButtonSize, { container: string; text: 'bodyStrong' | 'label' | 'body' }> = {
  sm: { container: 'h-9 px-3 rounded-sm gap-1', text: 'label' },
  md: { container: 'h-12 px-4 rounded-md gap-2', text: 'bodyStrong' },
  lg: { container: 'h-14 px-5 rounded-lg gap-2', text: 'body' },
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 };

type Props = Omit<PressableProps, 'children' | 'style'> & {
  style?: StyleProp<ViewStyle>;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
};

export const Button = forwardRef<View, Props>(function Button(
  {
    label,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = true,
    icon,
    iconRight,
    className,
    style,
    onPress,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const { container, text } = SIZE[size];

  function handlePress(event: Parameters<NonNullable<PressableProps['onPress']>>[0]) {
    if (isDisabled) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(event);
  }

  return (
    <Pressable
      ref={ref as unknown as React.Ref<View>}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      className={[
        'flex-row items-center justify-center',
        container,
        CONTAINER[variant],
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-45' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={[
        variant === 'primary' || variant === 'danger' ? elevation.sm : undefined,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? '#4F46E5' : '#FFFFFF'}
        />
      ) : (
        <>
          {icon}
          <Text variant={text} className={LABEL[variant]}>
            {label}
          </Text>
          {iconRight}
        </>
      )}
    </Pressable>
  );
});

type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  style?: StyleProp<ViewStyle>;
  icon: React.ReactNode;
  accessibilityLabel: string;
  size?: number;
  tone?: 'default' | 'primary' | 'danger';
};

/** Square, 44pt-minimum touch target used in headers and list rows. */
export function IconButton({
  icon,
  accessibilityLabel,
  size = 44,
  tone = 'default',
  className,
  style,
  ...rest
}: IconButtonProps) {
  const toneClass =
    tone === 'primary' ? 'bg-primarySoft' : tone === 'danger' ? 'bg-dangerSoft' : 'bg-transparent';
  const pressedClass = tone === 'danger' ? 'active:bg-danger/20' : 'active:bg-surfaceSunken';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      className={['items-center justify-center rounded-pill', toneClass, pressedClass, className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={[{ width: size, height: size, borderRadius: radius.pill }, style]}
      {...rest}
    >
      {icon}
    </Pressable>
  );
}

type FloatingButtonProps = Props & { bottomOffset?: number };

/** Primary action button that floats above scrolling content. */
export function FloatingButton({
  label,
  icon,
  bottomOffset = 96,
  style,
  ...rest
}: FloatingButtonProps) {
  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0">
      <View style={{ paddingBottom: bottomOffset, paddingHorizontal: 20 }}>
        <Button
          label={label}
          size="lg"
          icon={icon}
          className="rounded-pill"
          style={[elevation.lg, style]}
          {...rest}
        />
      </View>
    </View>
  );
}

export function Divider({ className, ...rest }: ViewProps) {
  return <View className={['h-px w-full bg-border', className ?? ''].join(' ')} {...rest} />;
}
