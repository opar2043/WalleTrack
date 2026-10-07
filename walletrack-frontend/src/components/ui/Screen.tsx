import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { IconButton } from './Button';
import { Text } from './Text';
import { useTheme } from '../../theme/ThemeProvider';
import { useResponsive } from '../../utils/responsive';

type ScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Extra bottom padding so content clears the floating action button. */
  bottomInset?: number;
  background?: 'default' | 'surface';
  keyboardAware?: boolean;
  contentClassName?: string;
  edges?: { top?: boolean; bottom?: boolean };
  header?: ReactNode;
  footer?: ReactNode;
};

export function Screen({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  bottomInset = 0,
  background = 'default',
  keyboardAware = false,
  contentClassName,
  edges,
  header,
  footer,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { gutter, maxContentWidth } = useResponsive();

  const showTop = edges?.top ?? true;
  const showBottom = edges?.bottom ?? true;

  const paddingTop = showTop ? insets.top : 0;
  const paddingBottom = showBottom ? insets.bottom + bottomInset : bottomInset;

  const content = (
    <View
      className={[
        'w-full self-center',
        contentClassName ?? '',
      ].filter(Boolean).join(' ')}
      style={{ maxWidth: maxContentWidth, paddingHorizontal: gutter }}
    >
      {header}
      {children}
    </View>
  );

  const body = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop, paddingBottom, paddingHorizontal: gutter }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B8B94"
            colors={['#4F46E5']}
            progressBackgroundColor="#FFFFFF"
          />
        ) : undefined
      }
    >
      <View className="w-full self-center" style={{ maxWidth: maxContentWidth }}>
        {header}
        {children}
      </View>
    </ScrollView>
  ) : (
    <View
      className="flex-1"
      style={{ paddingTop, paddingBottom, paddingHorizontal: gutter }}
    >
      {content}
    </View>
  );

  const wrapped = keyboardAware ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <View className={['flex-1', background === 'surface' ? 'bg-surface' : 'bg-background'].join(' ')}>
      {wrapped}
      {footer ? (
        <View
          style={{ paddingBottom: showBottom ? insets.bottom : 0 }}
          className="border-t border-border bg-surface px-5 pt-3"
        >
          <View className="w-full self-center" style={{ maxWidth: maxContentWidth }}>
            {footer}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Header layout shared by every screen: optional back button, title, actions. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  large = false,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  large?: boolean;
}) {
  return (
    <View className="mb-4 flex-row items-center">
      {onBack ? (
        <IconButton
          accessibilityLabel="Go back"
          icon={<ChevronLeft size={24} color="#18181B" />}
          onPress={onBack}
          className="-ml-2 mr-1"
        />
      ) : null}
      <View className="flex-1">
        <Text variant={large ? 'title1' : 'title3'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View className="flex-row items-center gap-1">{right}</View> : null}
    </View>
  );
}

/**
 * Native stack header configured from the theme so push transitions, the back
 * chevron and the status bar all match the active palette.
 */
export function useStackScreenOptions() {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.content,
    headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };
}
