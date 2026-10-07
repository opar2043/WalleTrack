import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, X } from 'lucide-react-native';

import { InlineError } from '../../components/ui/Feedback';
import { Button, IconButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useCreateCategory } from '../../hooks/queries';
import { cn } from '../../theme/utils';
import { useToast } from '../../utils/toast';

const ICONS = ['tag', 'shopping-bag', 'utensils', 'car', 'house', 'film', 'heart', 'briefcase', 'graduation-cap', 'plane', 'gift', 'dumbbell', 'paw-print', 'baby', 'zap'] as const;

const COLORS = [
  '#4F46E5',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#64748B',
];

export default function CategoryFormScreen() {
  const navigation = useNavigation();
  const createCategory = useCreateCategory();
  const toast = useToast();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(ICONS[0]);
  const [color, setColor] = useState<string>(COLORS[0]);
  const [errors, setErrors] = useState<{ name?: string }>({});

  function validate(): boolean {
    const next: { name?: string } = {};
    if (!name.trim()) next.name = 'Give the category a name.';
    else if (name.trim().length > 40) next.name = 'Keep the name under 40 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      await createCategory.mutateAsync({ name: name.trim(), type, icon, color });
      toast.success(`${name.trim()} created`);
      navigation.goBack();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create the category.');
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <View className="flex-1">
          <Text variant="title3">New category</Text>
        </View>
        <IconButton
          accessibilityLabel="Close"
          icon={<X size={22} color="#8B8B94" />}
          onPress={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row gap-3">
          {(['expense', 'income'] as const).map((option) => {
            const active = option === type;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setType(option)}
                className={cn(
                  'flex-1 items-center rounded-md border py-3',
                  active ? 'border-primary bg-primarySoft' : 'border-border bg-card',
                )}
              >
                <Text variant="bodyStrong" tone={active ? 'primary' : 'secondary'}>
                  {option === 'expense' ? 'Expense' : 'Income'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input
          label="Name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          placeholder={type === 'expense' ? 'Coffee' : 'Freelance'}
          autoCapitalize="words"
          maxLength={40}
          error={errors.name}
          containerClassName="mt-5"
        />

        <Text variant="label" className="mt-6">
          Colour
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-3">
          {COLORS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Colour ${option}`}
              accessibilityState={{ selected: option === color }}
              onPress={() => setColor(option)}
              className="h-10 w-10 items-center justify-center rounded-pill"
              style={{ backgroundColor: `${option}26` }}
            >
              <View
                className="h-7 w-7 items-center justify-center rounded-pill"
                style={{ backgroundColor: option }}
              >
                {option === color ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
            </Pressable>
          ))}
        </View>

        <Text variant="label" className="mt-6">
          Icon
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {ICONS.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Icon ${option}`}
              accessibilityState={{ selected: option === icon }}
              onPress={() => setIcon(option)}
              className={cn(
                'rounded-md border px-3 py-2',
                option === icon ? 'border-primary bg-primarySoft' : 'border-border bg-card',
              )}
            >
              <Text variant="caption" tone={option === icon ? 'primary' : 'secondary'}>
                {option.replace(/-/g, ' ')}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-7">
          <InlineError message={createCategory.error?.message} />
          <Button
            label="Create category"
            size="lg"
            onPress={() => void handleSubmit()}
            loading={createCategory.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}