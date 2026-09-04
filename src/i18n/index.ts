import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { createMMKV } from "react-native-mmkv";

import en from "./locales/en";
import hi from "./locales/hi";

export const CACHE_KEY = "app_language";

export const storage = createMMKV();

const i18n = new I18n({
  en,
  hi,
});

i18n.enableFallback = true;
i18n.defaultLocale = "en";

const storedLang = storage.getString(CACHE_KEY);
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? "en";
i18n.locale = storedLang || deviceLocale;

export function setLanguage(locale: string) {
  i18n.locale = locale;
  storage.set(CACHE_KEY, locale);
}

export function getCurrentLanguage(): string {
  return i18n.locale;
}

export default i18n;
