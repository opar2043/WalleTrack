import { View, type ViewProps } from 'react-native';

import { Text } from './Text';
import { elevation, radius, type ElevationName } from '../../theme/tokens';

type CardProps = ViewProps & {
  /** `flat` for list rows, `raised` for hero blocks, `sunken` for inset wells. */
  variant?: 'flat' | 'raised' | 'sunken' | 'outline';
  padded?: boolean;
  radiusToken?: keyof typeof radius;
  elevation?: ElevationName;
};

const VARIANT: Record<NonNullable<CardProps['variant']>, string> = {
  flat: 'bg-surface border border-border',
  raised: 'bg-surface border border-border',
  sunken: 'bg-surfaceSunken',
  outline: 'bg-transparent border border-borderStrong',
};

export function Card({
  variant = 'flat',
  padded = true,
  radiusToken = 'lg',
  elevation: elevationName = 'sm',
  className,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      className={['w-full', VARIANT[variant], padded ? 'p-4' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={[
        { borderRadius: radius[radiusToken] },
        variant === 'raised' ? elevation[elevationName] : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
};

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <View className={['mb-3 flex-row items-end justify-between', className ?? ''].filter(Boolean).join(' ')}>
      <View className="flex-1 pr-3">
        <Text variant="title3">{title}</Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" className="mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

type StatTileProps = {
  label: string;
  value: string;
  caption?: string;
  tone?: 'default' | 'income' | 'expense' | 'warning';
  icon?: React.ReactNode;
};

/** Compact metric used in the dashboard's two-up row. */
export function StatTile({ label, value, caption, tone = 'default', icon }: StatTileProps) {
  const valueTone = tone === 'default' ? 'default' : tone;
  return (
    <Card className="flex-1" padded={false}>
      <View className="flex-1 p-4">
        <View className="mb-2 flex-row items-center gap-2">
          {icon}
          <Text variant="overline" tone="muted">
            {label.toUpperCase()}
          </Text>
        </View>
        <Text variant="amount" tone={valueTone} tabular>
          {value}
        </Text>
        {caption ? (
          <Text variant="caption" tone="muted" className="mt-1">
            {caption}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
