import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { ShareIcon } from "@/components/ui/icons/common-icons";
import { UsersIcon } from "@/components/ui/icons/messages-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { messagingService } from "@/services/messaging.service";
import { useStore } from "@/store";
import type { ConversationResponseDto } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

function getGroupDisplayName(conv: ConversationResponseDto | undefined): string {
  if (!conv) return "Group";
  const n = conv.name;
  if (typeof n === "string") return n || "Group";
  if (n && typeof n === "object") return (Object.values(n)[0] as string) || "Group";
  return "Group";
}

function getParticipantDisplayName(p: { user?: { firstName?: string | null; lastName?: string | null } }): string {
  const u = p?.user;
  if (!u) return "Member";
  const first = u.firstName?.trim() || "";
  const last = u.lastName?.trim() || "";
  return [first, last].filter(Boolean).join(" ") || "Member";
}

export default function GroupProfileScreen() {
  const { chatID } = useLocalSearchParams<{ chatID: string }>();
  const [conversation, setConversation] = useState<ConversationResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useStore((state: any) => state.theme);

  const loadGroup = useCallback(async () => {
    if (!chatID) return;
    setLoading(true);
    try {
      const conv = await messagingService.getConversationById(chatID);
      if (conv.type === "group") {
        setConversation(conv);
      } else {
        setConversation(null);
      }
    } catch (_) {
      setConversation(null);
    } finally {
      setLoading(false);
    }
  }, [chatID]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const inviteLink = chatID ? Linking.createURL(`chat/${chatID}`) : "";

  const handleShareInvite = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await Share.share({
        message: inviteLink,
        url: inviteLink,
        title: getGroupDisplayName(conversation || undefined) + " – Invite",
      });
    } catch (e) {
      // User cancelled or share not available
    }
  }, [conversation, inviteLink]);

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.bg },
    scrollContent: { padding: 16, paddingBottom: 24 },
    card: {
      backgroundColor: t.bg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignSelf: "center",
      marginBottom: 12,
      backgroundColor: t.border,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignSelf: "center",
      marginBottom: 12,
      backgroundColor: t.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: { fontSize: 28, fontWeight: "600", color: t.text },
    name: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 4,
      color: t.text,
    },
    groupType: { fontSize: 14, color: t.subText, textAlign: "center", marginBottom: 0 },
    sectionTitle: { fontSize: 16, fontWeight: "600", color: t.text },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    item: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
    itemAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
      backgroundColor: t.border,
    },
    itemAvatarWrap: { position: "relative" },
    itemBody: { flex: 1, gap: 4 },
    itemName: { fontSize: 15, fontWeight: "500", color: t.text, marginBottom: 2 },
    itemMeta: { fontSize: 12, color: t.subText },
    adminTag: {
      backgroundColor: "#FFEDD4",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: "flex-start",
      marginTop: 2,
    },
    adminTagText: { fontSize: 11, fontWeight: "600", color: "#9F2D00" },
    separator: { height: 1, backgroundColor: t.border, marginVertical: 4 },
    qrWrap: {
      alignSelf: "center",
      marginVertical: 12,
      padding: 12,
      backgroundColor: "#fff",
      borderRadius: 8,
    },
    inviteUrl: { fontSize: 12, color: t.text, textAlign: "center", marginTop: 8 },
    shareIcon: { padding: 8 },
  } as const));

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <Text style={{ color: theme.subText, textAlign: "center" }}>Group not found</Text>
      </View>
    );
  }

  const groupName = getGroupDisplayName(conversation);
  const groupImage = conversation.imageUrl;
  const participants = conversation.participants || [];
  const createdById = conversation.createdById || "";

  const initials = groupName
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <HeaderInnerPage title="Profile" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Overview Card */}
        <View style={styles.card}>
          {groupImage ? (
            <Image source={{ uri: groupImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="people" size={40} color={theme.subText} />
            </View>
          )}
          <Text style={styles.name}>{groupName}</Text>
          <Text style={styles.groupType}>Group</Text>
        </View>

        {/* Classrooms Attached - placeholder */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Classrooms Attached</Text>
          <View style={styles.item}>
            <Text style={[styles.itemName, { color: theme.subText }]}>No classrooms</Text>
          </View>
        </View>

        {/* Group Invite Link */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Group Invite Link</Text>
            <TouchableOpacity style={styles.shareIcon} onPress={handleShareInvite}>
              <ShareIcon size={20} color={theme.tint} />
            </TouchableOpacity>
          </View>
          <View style={styles.qrWrap}>
            <QRCode
              value={inviteLink}
              size={160}
              color="#000"
              backgroundColor="#fff"
            />
          </View>
          <Text style={styles.inviteUrl} numberOfLines={2}>
            {inviteLink}
          </Text>
        </View>

        {/* Group Members */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Group Members</Text>

            <View
              style={[
                {
                  flexDirection: "row",
                  gap: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 8,
                  paddingVertical: 1,
                  backgroundColor: theme.panel,
                  borderRadius: 6,
                },
              ]}
            >
              <UsersIcon
                size={16}
                color={theme.text}
              />
              <ThemedText
                style={{
                  color: theme.text,
                }}
                type="subText"
              >
                {participants.length}
              </ThemedText>
            </View>
          </View>
          {participants.map((p, index) => {
            const isAdmin = p.user?.id === createdById;
            const displayName = getParticipantDisplayName(p);
            const avatarUri = p.user?.profilePicture ?? null;
            const memberInitials = displayName
              .split(/\s+/)
              .map((s) => s[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <View key={p.id}>
                {index > 0 && <View style={styles.separator} />}
                <View style={styles.item}>
                  <View style={styles.itemAvatarWrap}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.itemAvatar} />
                    ) : (
                      <View style={[styles.itemAvatar, { alignItems: "center", justifyContent: "center" }]}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: theme.subText }}>
                          {memberInitials}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemBody}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.itemName}>{displayName}</Text>
                      {isAdmin && (
                        <View style={styles.adminTag}>
                          <Text style={styles.adminTagText}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemMeta}>Last Seen: 2 hours ago</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
