/**
 * Theme context. Resolves the user's saved preference (system | light | dark)
 * into a concrete palette, exposes it for non-className consumers such as
 * charts and React Navigation, and keeps the native navigation container in
 * sync so screen transitions never flash the wrong colour.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type ThemePalette } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  resolved: ResolvedTheme;
  isDark: boolean;
  colors: ThemePalette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialPreference = 'system',
}: {
  children: ReactNode;
  initialPreference?: ThemePreference;
}) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);

  const resolved: ResolvedTheme = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const isDark = resolved === 'dark';
  const colors = isDark ? darkPalette : lightPalette;

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({ preference, setPreference, resolved, isDark, colors }),
    [preference, setPreference, resolved, isDark, colors],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return context;
}

/**
 * Synchronises the preference held by the app with the one persisted on the
 * server, without fighting the user's most recent local choice.
 */
export function useSyncThemePreference(remotePreference: ThemePreference | undefined) {
  const { preference, setPreference } = useTheme();

  useEffect(() => {
    if (remotePreference && remotePreference !== preference) {
      setPreference(remotePreference);
    }
    // Only react to remote changes arriving from the profile screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remotePreference]);

  return { preference, setPreference };
}
