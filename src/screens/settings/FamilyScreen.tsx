import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { ArrowLeft, UserPlus, Users, Crown, Trash2 } from "lucide-react-native";
import { Avatar } from "@components/ui/Avatar";
import { Button } from "@components/ui/Button";
import { EmptyState } from "@components/ui/EmptyState";
import { useAuthStore } from "@stores/authStore";
import { useProfileStore } from "@stores/profileStore";
import { useThemeStore } from "@stores/themeStore";
import i18n from "@i18n/index";
import { toast } from "@utils/toast";
import { cn } from "@utils/cn";

interface FamilyScreenProps {
  navigation: { goBack: () => void };
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
}

const SAMPLE_MEMBERS: Member[] = [
  { id: "1", name: "John Smith", email: "john@family.com", role: "owner" },
];

export default function FamilyScreen({ navigation }: FamilyScreenProps) {
  const { name, email } = useAuthStore();
  const { profile } = useProfileStore();
  const isDark = useThemeStore((s) => s.isDark);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [members, setMembers] = useState<Member[]>(SAMPLE_MEMBERS);

  useEffect(() => {
    if (name && email && members.length === 1) {
      setMembers([{ id: "0", name: name, email, role: "owner" }, ...SAMPLE_MEMBERS]);
    }
  }, [name, email]);

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error(i18n.t("family.emailRequired"));
      return;
    }
    setMembers((prev) => [
      ...prev,
      { id: String(Date.now()), name: inviteEmail.split("@")[0], email: inviteEmail.trim(), role: "member" },
    ]);
    toast.success(i18n.t("family.inviteSent"));
    setInviteEmail("");
    setShowInvite(false);
  };

  const handleRemove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success(i18n.t("family.memberRemoved"));
  };

  return (
    <SafeAreaView className={cn("flex-1", isDark ? "bg-bg-dark" : "bg-bg-light")}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]/10">
          <ArrowLeft size={20} color="#6C5CE7" />
        </Pressable>
        <Text className={cn("text-lg font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
          {i18n.t("family.title")}
        </Text>
        <Pressable onPress={() => setShowInvite(true)} className="h-10 w-10 items-center justify-center rounded-full bg-[#6C5CE7]">
          <UserPlus size={20} color="white" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">
        <View className={cn("mb-6 rounded-3xl p-5", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
          <View className="flex-row items-center">
            <Users size={18} color="#6C5CE7" />
            <Text className={cn("ml-2 text-base font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("family.familyGroup")}
            </Text>
          </View>
          <Text className={cn("mt-2 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {i18n.t("family.groupDesc")} ({members.length})
          </Text>
        </View>

        {members.length === 0 ? (
          <EmptyState
            title={i18n.t("family.noMembers")}
            message={i18n.t("empty.family")}
            icon={<Users size={40} color={isDark ? "#6B7280" : "#9CA3AF"} />}
          />
        ) : (
          members.map((m) => (
            <View key={m.id} className={cn("mb-2 flex-row items-center rounded-2xl px-4 py-3", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
              <Avatar name={m.name} size={44} className="mr-3" />
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className={cn("text-sm font-semibold", isDark ? "text-white" : "text-[#1E1E2D]")}>
                    {m.name}
                  </Text>
                  {m.role === "owner" && <Crown size={14} color="#FFD700" className="ml-1" />}
                </View>
                <Text className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{m.email}</Text>
              </View>
              {m.role !== "owner" && (
                <Pressable onPress={() => handleRemove(m.id)} className="h-8 w-8 items-center justify-center rounded-full bg-[#EF4444]/10">
                  <Trash2 size={14} color="#EF4444" />
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showInvite} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className={cn("rounded-t-3xl p-6", isDark ? "bg-[#1E1E2D]" : "bg-white")}>
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-300" />
            <Text className={cn("mb-4 text-xl font-bold", isDark ? "text-white" : "text-[#1E1E2D]")}>
              {i18n.t("family.inviteMember")}
            </Text>
            <Text className={cn("mb-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
              {i18n.t("family.email")}
            </Text>
            <View className={cn("mb-6 rounded-2xl border px-4", isDark ? "border-[#2A2A3C]" : "border-[#E5E7EB]")}>
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="member@email.com"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                keyboardType="email-address"
                autoCapitalize="none"
                className={cn("py-3 text-base", isDark ? "text-white" : "text-[#1E1E2D]")}
              />
            </View>
            <Button title={i18n.t("family.sendInvite")} onPress={handleInvite} size="lg" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
