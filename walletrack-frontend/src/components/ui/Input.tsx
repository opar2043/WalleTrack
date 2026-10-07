import { forwardRef, useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';

import { Text } from './Text';
import { cn } from '../../theme/utils';

type Props = TextInputProps & {
  className?: string;
  label?: string;
  error?: string;
  hint?: string;
  /** Rendered inside the field on the leading edge, e.g. a currency symbol. */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerClassName?: string;
  /** Larger type for numeric entry on the amount pad. */
  size?: 'md' | 'lg';
};

export const Input = forwardRef<TextInput, Props>(function Input(
  {
    label,
    error,
    hint,
    leading,
    trailing,
    containerClassName,
    size = 'md',
    onFocus,
    onBlur,
    className,
    multiline,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-danger'
    : focused
      ? 'border-primary'
      : 'border-border';

  const height = multiline ? 'min-h-[104px] py-3' : size === 'lg' ? 'h-14' : 'h-12';

  return (
    <View className={['w-full', containerClassName ?? ''].filter(Boolean).join(' ')}>
      {label ? (
        <Text variant="label" tone="secondary" className="mb-1.5">
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          'w-full flex-row items-center rounded-md border bg-surface px-3',
          height,
          borderClass,
          multiline ? 'items-start' : 'items-center',
        )}
      >
        {leading ? <View className="mr-2">{leading}</View> : null}
        <TextInput
          ref={ref}
          multiline={multiline}
          className={cn(
            'flex-1 text-content',
            size === 'lg' ? 'text-xl font-semibold' : 'text-base',
          )}
          placeholderTextColor="#8B8B94"
          selectionColor="#4F46E5"
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={multiline ? { textAlignVertical: 'top', minHeight: 80 } : undefined}
          {...rest}
        />
        {trailing ? <View className="ml-2">{trailing}</View> : null}
      </View>

      {error ? (
        <Text variant="caption" tone="danger" className="mt-1.5">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted" className="mt-1.5">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  error?: string;
};

export function Checkbox({ checked, onToggle, label, error }: CheckboxProps) {
  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        onPress={onToggle}
        className="flex-row items-center py-1"
      >
        <View
          className={cn(
            'h-6 w-6 items-center justify-center rounded-xs border',
            checked ? 'border-primary bg-primary' : error ? 'border-danger' : 'border-borderStrong',
          )}
        >
          {checked ? <Text variant="captionStrong" className="text-white">✓</Text> : null}
        </View>
        <Text variant="callout" tone="secondary" className="ml-3 flex-1">
          {label}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" tone="danger" className="mt-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

type SegmentedOption<T extends string> = { value: T; label: string; icon?: React.ReactNode };

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
};

/** iOS-style segmented control; the single-choice input used across filters. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  return (
    <View className={['w-full', className ?? ''].filter(Boolean).join(' ')}>
      {label ? (
        <Text variant="label" tone="secondary" className="mb-1.5">
          {label}
        </Text>
      ) : null}
      <View className="flex-row rounded-md bg-surfaceSunken p-1">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.value)}
              className={cn(
                'flex-1 flex-row items-center justify-center rounded-sm',
                size === 'sm' ? 'h-8 px-2' : 'h-10 px-3',
                active ? 'bg-surface' : 'bg-transparent',
              )}
            >
              {option.icon}
              <Text
                variant={size === 'sm' ? 'captionStrong' : 'label'}
                tone={active ? 'default' : 'secondary'}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
};

export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      className={cn(
        'flex-row items-center rounded-pill border px-3 py-2',
        selected ? 'border-primary bg-primarySoft' : 'border-border bg-surface',
      )}
    >
      {icon}
      <Text variant="captionStrong" tone={selected ? 'primary' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

type ListRowProps = ViewProps & {
  onPress?: () => void;
  chevron?: boolean;
};

export function ListRow({ onPress, chevron, className, children, ...rest }: ListRowProps) {
  if (!onPress) {
    return <View className={className} {...rest}>{children}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn('active:opacity-60', className)}
      {...rest}
    >
      {children}
      {chevron ? <Text variant="body" tone="muted" className="ml-2">›</Text> : null}
    </Pressable>
  );
}
