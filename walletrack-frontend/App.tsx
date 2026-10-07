import './global.css';

import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, type QueryClientConfig } from '@tanstack/react-query';
import { ApiError } from './src/api/client';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { ThemeProvider, useSyncThemePreference, useTheme } from './src/theme/ThemeProvider';

// Hold the splash until the stored session has been checked, so the app never
// flashes the sign-in screen at someone who is already signed in.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden, or unsupported on this platform.
});

/**
 * `400`-class errors are deterministic: the request will never succeed on a
 * retry, and retrying a `401` would fight the sign-out the client just did.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

function createQueryClient(): QueryClient {
  const config: QueryClientConfig = {
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
  };
  return new QueryClient(config);
}

/** Keeps the resolved palette in step with the preference saved on the server. */
function ThemeSync() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const { isDark } = useTheme();

  useSyncThemePreference(user?.themePreference);

  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  const queryClient = useMemo(createQueryClient, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ThemeSync />
            <RootNavigator />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});