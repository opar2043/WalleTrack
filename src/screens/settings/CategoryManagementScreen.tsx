import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react-native";
import { CategoryIcon } from "@components/common/CategoryListItem";
import { Button } from "@components/ui/Button";
import { useAuthStore } from "@stores/authStore";
import { useCategoriesStore } from "@stores/categoriesStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { cn } from "@utils/cn";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@constants/index";
import type { Category, CategoryType } from "@t/index";

interface CategoryManagementScreenProps {
  navigation: { goBack: () => void };
}

export default function CategoryManagementScreen({ navigation }: CategoryManagementScreenProps) {
  const { userId } = useAuthStore();
  const { categories, loadCategories, addCategory, deleteCategory } = useCategoriesStore();
  const isDark = useThemeStore((s) => s.isDark);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [icon, setIcon] = useState("utensils");
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) loadCategories(userId);
  }, [userId]);

  const incomeCats = useMemo(() => categories.filter((c) => c.type === "income"), [categories]);
  const expenseCats = useMemo(() => categories.filter((c) => c.type === "expense"), [categories]);

  const openAdd = (t: CategoryType) => {
    setEditingId(null);
    setType(t);
    setName("");
    setIcon("utensils");
    setColor(CATEGORY_COLORS[0]);
    setShowModal(true);
  };

  const openEdit = (cat: (typeof categories)[number]) => {
    setEditingId(cat.$id);
    setType(cat.type);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!name.trim()) {
      toast.error(i18n.t("errors.nameRequired"));
      return;
    }
    if (editingId) {
      await useCategoriesStore.getState().updateCategory(editingId, { name: name.trim(), icon, color });
    } else {
      await addCategory(userId, { name: name.trim(), type, icon, color });
    }
    toast.success(editingId ? i18n.t("categories.updated") : i18n.t("categories.added"));
    setShowModal(false);
  };

  const handleDelete = (cat: (typeof categories)[number]) => {
    Alert.alert(
      i18n.t("common.deleteTitle"),
      i18n.t("categories.deleteConfirm"),
      [
        { text: i18n.t("common.cancel"), style: "cancel" },
        {
          text: i18n.t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await deleteCategory(cat.$id);
            toast.success(i18n.t("categories.deleted"));
          },
        },
      ]
    );
  };

  const renderCategoryList = (cats: Category[]) => (
    <View className="gap-2">
      {cats.length === 0 ? (
        <Text className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
          {i18n.t("categories.none")}
        </Text>
      ) : (
        cats.map((c) => (
          <View key={c.$id} className={cn("flex-row items-center rounded-2xl px-4 py-3", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <CategoryIcon icon={c.icon} color={c.color} size={36} />
            <Text className={cn("ml-3 flex-1 text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {c.name}
            </Text>
            <Pressable onPress={() => openEdit(c)} className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-[#6C5CE7]/10">
              <Pencil size={14} color="#6C5CE7" />
            </Pressable>
            <Pressable onPress={() => handleDelete(c)} className="h-8 w-8 items-center justify-center rounded-full bg-[#EF4444]/10">
              <Trash2 size={14} color="#EF4444" />
            </Pressable>
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10">
          <ArrowLeft size={20} color="#6C5CE7" />
        </Pressable>
        <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("categories.title")}
        </Text>
        <Pressable onPress={() => openAdd("expense")} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]">
          <Plus size={20} color="white" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className={cn("text-base font-bold capitalize", isDark ? "text-white" : "text-[#1E1E2D]")}>
            {i18n.t("transactions.expense")}
          </Text>
          <Pressable onPress={() => openAdd("expense")} className="flex-row items-center">
            <Plus size={14} color="#6C5CE7" />
            <Text className="ml-1 text-xs font-semibold text-[#6C5CE7]">{i18n.t("common.add")}</Text>
          </Pressable>
        </View>
        {renderCategoryList(expenseCats)}

        <View className="mb-3 mt-6 flex-row items-center justify-between">
          <Text className={cn("text-base font-bold capitalize", isDark ? "text-white" : "text-[#1E1E2D]")}>
            {i18n.t("transactions.income")}
          </Text>
          <Pressable onPress={() => openAdd("income")} className="flex-row items-center">
            <Plus size={14} color="#6C5CE7" />
            <Text className="ml-1 text-xs font-semibold text-[#6C5CE7]">{i18n.t("common.add")}</Text>
          </Pressable>
        </View>
        {renderCategoryList(incomeCats)}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className={cn("rounded-t-3xl p-6", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-300" />
            <Text className={cn("mb-4 text-xl font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {editingId ? i18n.t("categories.edit") : i18n.t("categories.add")}
            </Text>

            <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
              {i18n.t("categories.type")}
            </Text>
            <View className="mb-4 flex-row gap-2">
              {(["expense", "income"] as CategoryType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  className={cn(
                    "flex-1 rounded-xl border py-2.5",
                    type === t ? "border-[#6C5CE7] bg-[#6C5CE7]" : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
                  )}
                >
                  <Text className={cn("text-center text-sm font-semibold capitalize", type === t ? "text-white" : isDark ? "text-gray-300" : "text-gray-600")}>
                    {i18n.t(`transactions.${t}` as never)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
              {i18n.t("common.name")}
            </Text>
            <View className={cn("mb-4 rounded-2xl border px-4", isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]")}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={i18n.t("categories.namePlaceholder")}
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                className={cn("py-3 text-base", isDark ? "text-white" : "text-[#1E1E2D]")}
              />
            </View>

            <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
              {i18n.t("categories.icon")}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {[...CATEGORY_ICONS]
                  .sort((a, b) => (a === icon ? -1 : b === icon ? 1 : 0))
                  .slice(0, 12)
                  .map((ic) => (
                    <Pressable
                      key={ic}
                      onPress={() => setIcon(ic)}
                      className={cn(
                        "rounded-xl border p-2",
                        icon === ic ? "border-[#6C5CE7] bg-[#6C5CE7]/10" : isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]"
                      )}
                    >
                      <CategoryIcon icon={ic} color={color} size={32} outline={false} />
                    </Pressable>
                  ))}
              </View>
            </ScrollView>

            <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
              {i18n.t("categories.color")}
            </Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  className={cn("h-8 w-8 rounded-full border-2", color === c ? "border-[#6C5CE7]" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </View>

            <Button title={i18n.t("common.save")} onPress={handleSave} size="lg" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
