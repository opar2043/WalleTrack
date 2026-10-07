/**
 * Toast wrapper.
 *
 * `react-native-toast-alert`'s static helpers hard-code a light background, which
 * disappears against the dark theme. This hook routes every toast through
 * `styled` with tone-aware, theme-aware colours so feedback stays readable.
 */

import { useCallback, useMemo } from 'react';

import ToastManager from 'react-native-toast-alert';

import { useTheme } from '../theme/ThemeProvider';
import { darkPalette, lightPalette } from '../theme/tokens';

type ToastTone = 'success' | 'error' | 'info' | 'warning';

type ToneColors = { backgroundColor: string; textColor: string };

const LIGHT_TONES: Record<ToastTone, ToneColors> = {
  success: { backgroundColor: '#22C55E', textColor: '#FFFFFF' },
  error: { backgroundColor: '#EF4444', textColor: '#FFFFFF' },
  warning: { backgroundColor: '#F59E0B', textColor: '#FFFFFF' },
  info: { backgroundColor: '#FFFFFF', textColor: '#18181B' },
};

const DARK_TONES: Record<ToastTone, ToneColors> = {
  success: { backgroundColor: '#166534', textColor: '#ECFDF5' },
  error: { backgroundColor: '#7F1D1D', textColor: '#FEF2F2' },
  warning: { backgroundColor: '#78350F', textColor: '#FFFBEB' },
  info: { backgroundColor: '#27272A', textColor: '#FAFAFA' },
};

export function useToast() {
  const { isDark } = useTheme();
  const palette = isDark ? DARK_TONES : LIGHT_TONES;

  const show = useCallback(
    (tone: ToastTone, text: string) => {
      ToastManager.styled(text, {
        ...palette[tone],
        fontWeight: '600',
      });
    },
    [palette],
  );

  return useMemo(
    () => ({
      success: (text: string) => show('success', text),
      error: (text: string) => show('error', text),
      info: (text: string) => show('info', text),
      warning: (text: string) => show('warning', text),
    }),
    [show],
  );
}

export type ToastApi = ReturnType<typeof useToast>;