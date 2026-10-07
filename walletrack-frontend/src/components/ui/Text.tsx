import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { fontSize } from '../../theme/tokens';

export type TextVariant =
  | 'display'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'caption'
  | 'captionStrong'
  | '2xs'
  | 'overline'
  | 'label'
  | 'amount'
  | 'amountLarge'
  | 'amountSmall';

export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'primary'
  | 'income'
  | 'expense'
  | 'warning'
  | 'danger'
  | 'success'
  | 'transfer'
  | 'inverse';

const variantStyles: Record<TextVariant, TextStyle> = {
  display: { fontSize: fontSize['4xl'], lineHeight: 44, fontWeight: '700', letterSpacing: -0.8 },
  title1: { fontSize: fontSize['3xl'], lineHeight: 38, fontWeight: '700', letterSpacing: -0.6 },
  title2: { fontSize: fontSize['2xl'], lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  title3: { fontSize: fontSize.xl, lineHeight: 28, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: fontSize.base, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: fontSize.base, lineHeight: 23, fontWeight: '600' },
  callout: { fontSize: fontSize.sm, lineHeight: 19, fontWeight: '400' },
  caption: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: '400' },
  captionStrong: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: '600' },
  '2xs': { fontSize: fontSize['2xs'], lineHeight: 14, fontWeight: '600' },
  overline: { fontSize: fontSize['2xs'], lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
  label: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: '600' },
  amount: { fontSize: fontSize.lg, lineHeight: 26, fontWeight: '700', letterSpacing: -0.3 },
  amountLarge: { fontSize: fontSize['3xl'], lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
  amountSmall: { fontSize: fontSize.sm, lineHeight: 20, fontWeight: '600' },
};

const TONE_CLASS: Record<TextTone, string> = {
  default: 'text-content',
  secondary: 'text-contentSecondary',
  muted: 'text-contentMuted',
  primary: 'text-primary',
  income: 'text-income',
  expense: 'text-expense',
  warning: 'text-warning',
  danger: 'text-danger',
  success: 'text-success',
  transfer: 'text-transfer',
  inverse: 'text-white',
};

type Props = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  center?: boolean;
  /** Renders numerals in a tabular style so columns of money stay aligned. */
  tabular?: boolean;
};

export function Text({
  variant = 'body',
  tone = 'default',
  center,
  tabular,
  className,
  style,
  ...rest
}: Props) {
  return (
    <RNText
      className={[
        TONE_CLASS[tone],
        center ? 'text-center' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={[
        variantStyles[variant],
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
