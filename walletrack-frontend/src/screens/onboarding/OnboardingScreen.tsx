import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Check, Globe, PiggyBank, Wallet } from 'lucide-react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { InlineError } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Input';
import { Sheet } from '../../components/ui/Sheet';
import { Text } from '../../components/ui/Text';
import { useCompleteOnboarding } from '../../hooks/queries';
import { cn } from '../../theme/utils';
import { useToast } from '../../utils/toast';

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', locale: 'en-US', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', currency: 'CAD', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', locale: 'en-AU', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', currency: 'EUR', locale: 'de-DE', flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'EUR', locale: 'fr-FR', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', currency: 'EUR', locale: 'es-ES', flag: '🇪🇸' },
  { code: 'IN', name: 'India', currency: 'INR', locale: 'en-IN', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', locale: 'pt-BR', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', locale: 'es-MX', flag: '🇲🇽' },
  { code: 'JP', name: 'Japan', currency: 'JPY', locale: 'ja-JP', flag: '🇯🇵' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', locale: 'en-ZA', flag: '🇿🇦' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', locale: 'ar-AE', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', locale: 'en-SG', flag: '🇸🇬' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', locale: 'en-NZ', flag: '🇳🇿' },
];

const HIGHLIGHTS = [
  {
    icon: Wallet,
    title: 'Every account, one total',
    body: 'Cash, cards, savings and investments roll up into a single balance.',
  },
  {
    icon: PiggyBank,
    title: 'Budgets that warn you early',
    body: 'Set a monthly limit and Walletrack nudges you at 80% and 100%.',
  },
  {
    icon: Globe,
    title: 'Built for your currency',
    body: 'Amounts are stored exactly, so no rounding drift ever creeps in.',
  },
];

/**
 * First-run flow: pick a country and currency, then start with the starter
 * accounts the backend already seeded. Kept to a single screen so the user is
 * looking at real money before the app ever asks for a transaction.
 */
/**
 * First-run setup and the later "change region" flow. Reachable both as the
 * post-signup gate and as a modal from Settings, so it takes no route props.
 */
export default function OnboardingScreen() {
  const toast = useToast();

  const completeOnboarding = useCompleteOnboarding();

  const [countryCode, setCountryCode] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [locale, setLocale] = useState('en-US');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');

  const country = COUNTRIES.find((item) => item.code === countryCode) ?? COUNTRIES[0];

  const filtered = COUNTRIES.filter((item) =>
    item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function handleFinish() {
    try {
      await completeOnboarding.mutateAsync({ country: countryCode, currency, locale });
      toast.success('All set. Welcome to Walletrack!');
    } catch {
      // The inline error below covers the failure case.
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 64, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="display">Let's set you up</Text>
        <Text variant="body" tone="secondary" className="mt-2">
          Two taps and Walletrack is ready to track.
        </Text>

        <View className="mt-7 gap-3">
          <Text variant="label" tone="secondary">
            Country and currency
          </Text>
          <Card padded={false}>
            <View className="flex-row items-center px-4 py-4">
              <Text variant="title2" className="mr-3">
                {country.flag}
              </Text>
              <View className="flex-1">
                <Text variant="bodyStrong">{country.name}</Text>
                <Text variant="caption" tone="muted">
                  {currency} · {locale}
                </Text>
              </View>
              <Button
                label="Change"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onPress={() => setPickerVisible(true)}
              />
            </View>
          </Card>
        </View>

        <View className="mt-7 gap-4">
          <Text variant="label" tone="secondary">
            What you get
          </Text>
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.title} className="flex-row">
                <View className="h-10 w-10 items-center justify-center rounded-md bg-primarySoft">
                  <Icon size={20} color="#4F46E5" />
                </View>
                <View className="ml-3 flex-1">
                  <Text variant="bodyStrong">{item.title}</Text>
                  <Text variant="caption" tone="muted" className="mt-0.5">
                    {item.body}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View className="border-t border-border bg-surface px-6 pb-10 pt-4">
        <View className="mb-3">
          <InlineError message={completeOnboarding.error?.message} />
        </View>
        <Button
          label="Start tracking"
          size="lg"
          onPress={handleFinish}
          loading={completeOnboarding.isPending}
        />
      </View>

      <Sheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title="Country and currency"
        subtitle="You can change this later in Settings."
      >
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search countries"
          autoCapitalize="none"
          autoCorrect={false}
          containerClassName="mb-3"
        />
        <View className="gap-1">
          {filtered.map((item) => {
            const selected = item.code === countryCode;
            return (
              <View
                key={item.code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onTouchEnd={() => {
                  setCountryCode(item.code);
                  setCurrency(item.currency);
                  setLocale(item.locale);
                  setPickerVisible(false);
                }}
                className={cn(
                  'flex-row items-center rounded-md px-3 py-3',
                  selected ? 'bg-primarySoft' : 'bg-transparent',
                )}
              >
                <Text variant="title3" className="mr-3">
                  {item.flag}
                </Text>
                <View className="flex-1">
                  <Text variant="bodyStrong">{item.name}</Text>
                  <Text variant="caption" tone="muted">
                    {item.currency}
                  </Text>
                </View>
                {selected ? <Check size={18} color="#4F46E5" strokeWidth={2.6} /> : null}
              </View>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}