import { View, type ViewProps } from 'react-native';
import { RotateCcw } from 'lucide-react-native';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';
import { avatarColorFor, cn, initialsFor } from '../../theme/utils';
import type { BudgetStatus } from '../../types/api';

/* ----------------------------------------------------------------- loading */

export function Skeleton({
  className,
  height = 16,
  width,
  rounded = 'sm',
}: {
  className?: string;
  height?: number;
  width?: number | `${number}%`;
  rounded?: keyof typeof import('../../theme/tokens').radius;
}) {
  return (
    <View
      className={cn('bg-surfaceSunken', className)}
      style={{ height, width, borderRadius: rounded === 'pill' ? 999 : rounded === 'lg' ? 20 : 12 }}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="gap-3">
      <Skeleton height={20} width="55%" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height={14} width={index === lines - 1 ? '40%' : '100%'} />
      ))}
    </Card>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="flex-row items-center gap-3">
          <Skeleton height={40} width={40} rounded="pill" />
          <View className="flex-1 gap-2">
            <Skeleton height={14} width="60%" />
            <Skeleton height={12} width="35%" />
          </View>
          <Skeleton height={16} width={70} />
        </Card>
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------- empty */

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  compact,
}: EmptyStateProps) {
  return (
    <View className={['items-center px-6', compact ? 'py-6' : 'py-12'].join(' ')}>
      {icon ? (
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-pill bg-surfaceSunken">
          {icon}
        </View>
      ) : null}
      <Text variant="title3" center>
        {title}
      </Text>
      {message ? (
        <Text variant="callout" tone="muted" center className="mt-1.5 max-w-[280px]">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          fullWidth={false}
          className="mt-5 px-6"
          size="sm"
        />
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------- error */

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View className="items-center px-6 py-12">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-pill bg-dangerSoft">
        <RotateCcw size={26} color="#DC2626" />
      </View>
      <Text variant="title3" center>
        Could not load this
      </Text>
      <Text variant="callout" tone="muted" center className="mt-1.5 max-w-[280px]">
        {message}
      </Text>
      {onRetry ? (
        <Button label="Try again" onPress={onRetry} fullWidth={false} className="mt-5 px-6" size="sm" />
      ) : null}
    </View>
  );
}

/** Inline, dismissible form-level error. */
export function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View className="mb-3 rounded-md border border-danger bg-dangerSoft px-3 py-2.5">
      <Text variant="callout" tone="danger">
        {message}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------- badge */

const BADGE_TONE: Record<string, string> = {
  neutral: 'bg-surfaceSunken',
  primary: 'bg-primarySoft',
  income: 'bg-incomeSoft',
  expense: 'bg-expenseSoft',
  transfer: 'bg-transferSoft',
  warning: 'bg-warningSoft',
  danger: 'bg-dangerSoft',
  success: 'bg-successSoft',
};

const BADGE_TEXT: Record<string, string> = {
  neutral: 'text-contentSecondary',
  primary: 'text-primary',
  income: 'text-income',
  expense: 'text-expense',
  transfer: 'text-transfer',
  warning: 'text-warning',
  danger: 'text-danger',
  success: 'text-success',
};

export type BadgeTone = keyof typeof BADGE_TONE;

export function Badge({
  label,
  tone = 'neutral',
  icon,
  className,
}: {
  label: string;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center self-start rounded-pill px-2.5 py-1',
        BADGE_TONE[tone],
        className,
      )}
    >
      {icon}
      <Text variant="captionStrong" className={BADGE_TEXT[tone]}>
        {label}
      </Text>
    </View>
  );
}

export const STATUS_TONE: Record<BudgetStatus, BadgeTone> = {
  safe: 'success',
  warning: 'warning',
  overspent: 'danger',
};

export const STATUS_LABEL: Record<BudgetStatus, string> = {
  safe: 'On track',
  warning: 'Nearly spent',
  overspent: 'Overspent',
};

/* ------------------------------------------------------------------ avatar */

type AvatarProps = {
  name: string;
  /** Explicit colour; otherwise derived deterministically from the name. */
  color?: string | null;
  size?: number;
  icon?: React.ReactNode;
  className?: string;
};

export function Avatar({ name, color, size = 40, icon, className }: AvatarProps) {
  const background = color ?? avatarColorFor(name);
  const showInitials = !icon && name.length <= 14;

  return (
    <View
      className={cn('items-center justify-center rounded-pill', className)}
      style={{ width: size, height: size, backgroundColor: `${background}1F` }}
    >
      {icon ?? (
        <Text
          variant={size >= 48 ? 'title3' : 'label'}
          style={{ color: background, fontSize: size * 0.36 }}
        >
          {showInitials ? initialsFor(name) : '•'}
        </Text>
      )}
    </View>
  );
}

/* ---------------------------------------------------------------- progress */

type ProgressBarProps = {
  /** 0-100, may exceed 100 for overspent budgets. */
  percentage: number;
  tone?: BudgetStatus | 'primary';
  height?: number;
  className?: string;
  showOverflow?: boolean;
};

const PROGRESS_FILL: Record<string, string> = {
  safe: 'bg-success',
  warning: 'bg-warning',
  overspent: 'bg-danger',
  primary: 'bg-primary',
};

export function ProgressBar({
  percentage,
  tone = 'safe',
  height = 8,
  className,
  showOverflow = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const overflow = showOverflow && percentage > 100;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percentage) }}
      className={cn('w-full overflow-hidden rounded-pill bg-surfaceSunken', className)}
      style={{ height }}
    >
      <View
        className={cn('h-full rounded-pill', PROGRESS_FILL[tone])}
        style={{ width: `${clamped}%` }}
      />
      {overflow ? (
        <View className="absolute inset-0 border-2 border-danger" style={{ borderRadius: 999 }} />
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------- rows */

type RowShellProps = ViewProps & { inset?: boolean };

export function RowShell({ inset = true, className, children, ...rest }: RowShellProps) {
  return (
    <View
      className={cn(
        'w-full flex-row items-center',
        inset ? 'px-4 py-3' : 'py-3',
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}

/** Grouped-list container with hairline separators between rows. */
export function RowGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View
      className={cn(
        'w-full overflow-hidden rounded-lg border border-border bg-surface',
        className,
      )}
    >
      {children}
    </View>
  );
}
