import { create } from "zustand";
import { colorScheme as nativeWindColorScheme } from "nativewind";
import type { ThemeMode } from "@t/index";
import { CACHE_KEYS, getString, setString } from "@services/storage";

interface ThemeState {
  theme: ThemeMode;
  isDark: boolean;
  initTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

function resolveDark(theme: ThemeMode): boolean {
  if (theme === "system") {
    return nativeWindColorScheme.get() === "dark";
  }
  return theme === "dark";
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  isDark: false,

  initTheme: () => {
    const saved = getString(CACHE_KEYS.THEME) as ThemeMode | null;
    const theme = saved || "system";
    let isDark: boolean;

    if (theme === "system") {
      isDark = nativeWindColorScheme.get() === "dark";
    } else {
      isDark = theme === "dark";
    }

    nativeWindColorScheme.set(theme === "system" ? (isDark ? "dark" : "light") : theme);
    set({ theme, isDark });
  },

  setTheme: (theme) => {
    let isDark: boolean;
    if (theme === "system") {
      isDark = nativeWindColorScheme.get() === "dark";
    } else {
      isDark = theme === "dark";
    }

    nativeWindColorScheme.set(theme === "system" ? (isDark ? "dark" : "light") : theme);
    setString(CACHE_KEYS.THEME, theme);
    set({ theme, isDark });
  },
}));
