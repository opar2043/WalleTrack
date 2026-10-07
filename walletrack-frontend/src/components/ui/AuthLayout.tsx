import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';

import { Text } from './Text';
import { useResponsive } from '../../utils/responsive';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Longest line we want for a form, so fields stay readable on a desktop window. */
const FORM_MAX_WIDTH = 460;

/** Shared shell for sign-in, sign-up and the onboarding steps. */
export function AuthLayout({ title, subtitle, children, footer }: Props) {
  const { width, gutter } = useResponsive();
  const insets = useSafeAreaInsets();

  // Border-box width of the centred column: the content stays at most
  // FORM_MAX_WIDTH wide and never grows past the viewport minus its gutters.
  const columnWidth = Math.min(FORM_MAX_WIDTH, width - gutter * 2) + gutter * 2;
  const isWide = width >= 768;

  const columnStyle = { maxWidth: columnWidth, paddingHorizontal: gutter };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#4F46E5', '#6366F1', '#818CF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 48, paddingBottom: 40 }}
      >
        <View className="w-full self-center" style={columnStyle}>
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <ShieldCheck size={30} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <Text variant="title1" className="mt-5 text-white">
            {title}
          </Text>
          <Text variant="body" className="mt-1.5 text-white/85">
            {subtitle}
          </Text>
        </View>
      </LinearGradient>

      {/* flexGrow (not flex-1) keeps the form's real height in the scroll
          content, so a long form can never be clipped when the window is short. */}
      <View
        className="w-full self-center justify-center"
        style={[columnStyle, { flexGrow: 1, paddingVertical: isWide ? 40 : 28 }]}
      >
        <View
          className={isWide ? 'rounded-xl border border-border bg-surface p-6' : undefined}
        >
          {children}
        </View>
      </View>

      {footer ? (
        <View
          className="w-full self-center"
          style={[columnStyle, { paddingTop: 4, paddingBottom: 36 }]}
        >
          {footer}
        </View>
      ) : null}
    </ScrollView>
  );
}

/** Centered link/button pair used at the bottom of the auth screens. */
export function AuthFooterLink({
  prompt,
  actionLabel,
  onPress,
  tone = 'primary',
}: {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
  tone?: 'primary' | 'danger';
}) {
  return (
    <Text variant="callout" tone="secondary" center>
      {prompt}{' '}
      <Text
        variant="callout"
        className={tone === 'danger' ? 'text-danger' : 'text-primary'}
        onPress={onPress}
        suppressHighlighting
      >
        {actionLabel}
      </Text>
    </Text>
  );
}
