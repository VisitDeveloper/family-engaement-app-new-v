import RoleGuard from "@/components/check-permisions";
import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import SearchContainer from "@/components/reptitive-component/search-container";
import { AnnouncementIcon, EmergencyIcon, FileIcon, MediaIcon, NewIcon, PollIcon, VoiceIcon } from "@/components/ui/icons/messages-icons";
import {
  ConversationResponseDto,
  messagingService,
} from "@/services/messaging.service";
import { useStore } from "@/store";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Contact {
  id: string;
  name: string;
}

type LastMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "poll"
  | "announcement";

interface Messages extends Contact {
  message: string;
  time: string;
  unread: number;
  avatar: string | null;
  online: boolean;
  group?: boolean;
  admin?: boolean;
  lastMessageType?: LastMessageType;
  lastMessageFileName?: string | null;
  lastMessageThumbnailUrl?: string | null;
  lastMessageMediaUrl?: string | null;
}

// File type icon for last message preview
const FileTypeIcon = ({
  type,
  size = 18,
  color,
}: {
  type: LastMessageType;
  size?: number;
  color: string;
}) => {
  switch (type) {
    case "image":
      return <MediaIcon size={size} color={color} />;
    case "video":
      return <MediaIcon size={size} color={color} />;
    case "audio":
      return <VoiceIcon size={size} color={color} />;
    case "file":
      return <FileIcon size={size} color={color} />;
    case "poll":
      return <PollIcon size={size} color={color} />;
    case "announcement":
      return <AnnouncementIcon size={size} color={color} />;
    default:
      return null;
  }
};

// ✅ Message Item Component
const MessageItem = ({
  item,
  onPress,
  styles,
  theme,
}: {
  item: Messages;
  onPress: (msg: Messages) => void;
  styles: any;
  theme: any;
}) => {
  const isMediaWithThumbnail =
    (item.lastMessageType === "image" || item.lastMessageType === "video") &&
    (item.lastMessageThumbnailUrl || (item.lastMessageType === "image" && item.lastMessageMediaUrl));
  const thumbnailUri =
    item.lastMessageThumbnailUrl ||
    (item.lastMessageType === "image" ? item.lastMessageMediaUrl : null);
  const displayFileName =
    item.lastMessageType === "image"
      ? "Photo"
      : item.lastMessageType === "video"
        ? "Video"
        : item.lastMessageType === "audio"
          ? "Voice"
          : item.lastMessageType === "file"
            ? "File"
            : item.lastMessageType === "poll"
              ? "Poll"
              : null;
  const showThumbnail = isMediaWithThumbnail && thumbnailUri;
  const showFileRow =
    item.lastMessageType === "image" ||
    item.lastMessageType === "video" ||
    item.lastMessageType === "file" ||
    item.lastMessageType === "audio" ||
    item.lastMessageType === "poll";

  return (
    <TouchableOpacity onPress={() => onPress(item)}>
      <View style={styles.messageItem}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={{ color: "#fff" }}>
              {item.name[0]}
              {item.name.split(" ")[1] ? item.name.split(" ")[1][0] : ""}
            </Text>
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageName}>{item.name}</Text>
            <Text style={styles.messageTime}>{item.time}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 0, marginTop: 4 }}>
            {showThumbnail && (
              <Image
                source={{ uri: thumbnailUri! }}
                style={styles.lastMessageThumbnail}
              />
            )}
            {showFileRow && !showThumbnail && (
              <View style={styles.lastMessageIconWrap}>
                <FileTypeIcon
                  type={item.lastMessageType!}
                  size={12}
                  color={theme.subText}
                />
              </View>
            )}
            <Text numberOfLines={1} style={styles.messageText}>
              {showFileRow
                ? item.lastMessageType === "poll"
                  ? (item.message || "Poll")
                  : displayFileName
                : item.message}
            </Text>
          </View>
        </View>

        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={{ color: "#fff", fontSize: 12 }}>{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function MessagesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useStore((state: any) => state.theme);
  const conversations = useStore((state: any) => state.conversations);
  const setConversations = useStore((state: any) => state.setConversations);
  const setLoading = useStore((state: any) => state.setLoading);
  const loading = useStore((state: any) => state.loading);
  const currentUser = useStore((state: any) => state.user);
  const currentUserId = currentUser?.id || null;

  const [query, setQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<Messages[]>([]);

  // console.log(
  //   "conversations123",
  //   conversations.map((c) => c.participants?.map((p) => p.user))
  // );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const convertConversationToMessage = useCallback(
    (conv: ConversationResponseDto): Messages => {
      let name = "Chat";
      let avatar: string | null = null;
      if (
        conv.type === "direct" &&
        conv.participants &&
        conv.participants.length > 0
      ) {
        // For direct conversations, get name and avatar from the other participant
        const otherParticipant = conv.participants.find(
          (p) => p.user.id !== currentUserId
        );
        if (otherParticipant) {
          // Construct full name from firstName and lastName
          const fullName = `${otherParticipant.user.firstName || ""} ${otherParticipant.user.lastName || ""
            }`.trim();
          name = fullName || otherParticipant.user.email || "Unknown";
          avatar = otherParticipant.user.profilePicture || null;
        }
      } else {
        // For group conversations, use conversation name and imageUrl
        name =
          typeof conv.name === "string"
            ? conv.name
            : typeof conv.name === "object" && conv.name !== null
              ? (Object.values(conv.name)[0] as string) || "Group"
              : "Group";
        avatar = conv.imageUrl || null;
      }

      const last = conv.lastMessage;
      const lastMessage =
        last?.type === "text" || last?.type === "poll" || last?.type === "announcement"
          ? (last.content || "")
          : last?.type === "image"
            ? "Photo"
            : last?.type === "video"
              ? "Video"
              : last?.type === "audio"
                ? "Voice"
                : last?.type === "file"
                  ? "File"
                  : "";
      const time = last
        ? formatTime(last.createdAt)
        : formatTime(conv.updatedAt);

      return {
        id: conv.id,
        name,
        message: lastMessage,
        time,
        unread: conv.unreadCount || 0,
        avatar,
        online: false,
        group: conv.type === "group",
        lastMessageType: last?.type,
        lastMessageFileName: last?.originalFilename ?? last?.fileName ?? null,
        lastMessageThumbnailUrl: last?.thumbnailUrl ?? null,
        lastMessageMediaUrl: last?.mediaUrl ?? null,
      };
    },
    [currentUserId]
  );

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const convs = await messagingService.getConversations();
      setConversations(convs.conversations);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      Alert.alert("Error", error.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setConversations]);

  const filterConversations = useCallback(
    (searchQuery: string) => {
      if (conversations.length === 0) {
        setFilteredContacts([]);
        return;
      }

      const mappedMessages = conversations.map(convertConversationToMessage);

      if (!searchQuery) {
        setFilteredContacts(mappedMessages);
        return;
      }

      const lowerQuery = searchQuery.toLowerCase();
      const results = mappedMessages.filter(
        (msg: Messages) =>
          msg.name.toLowerCase().includes(lowerQuery) ||
          msg.message.toLowerCase().includes(lowerQuery)
      );

      setFilteredContacts(results);
    },
    [conversations, convertConversationToMessage]
  );

  const handleDebouncedQuery = useCallback(
    (debouncedValue: string) => {
      filterConversations(debouncedValue);
    },
    [filterConversations]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Refresh conversations when screen comes into focus (e.g., after creating a group or sending a message)
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  useEffect(() => {
    // Update filtered contacts when conversations change (use current query)
    // The SearchContainer will handle debounced updates via handleDebouncedQuery
    if (conversations.length > 0) {
      filterConversations(query);
    } else {
      setFilteredContacts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, convertConversationToMessage]);

  const openChat = useCallback(
    (ITEM: Messages) => {
      router.push({
        pathname: "/chat/[chatID]",
        params: { chatID: ITEM.id },
      });
    },
    [router]
  );

  // ✅ Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, padding: 0, backgroundColor: theme.bg },
        searchContainer: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.panel,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          paddingHorizontal: 10,
          marginVertical: 8,
        },
        searchInput: {
          flex: 1,
          marginLeft: 8,
          height: 40,
          color: theme.text,
        },

        filterContainer: {
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 12,
          marginVertical: 5,
          paddingHorizontal: 10,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
        },
        filterBtn: {
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          alignItems: "center",
          flex: 1,
          height: 56,
          minHeight: 56,
          borderWidth: 1,
          borderRadius: 8,
          paddingTop: 16,
          paddingRight: 32,
          paddingBottom: 16,
          paddingLeft: 32,
          backgroundColor: "#FFFFFF",
          borderColor: "#DADADA",
          marginBottom: 10,
        },

        messageItem: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
          paddingHorizontal: 10,
          borderBottomWidth: 1,
          borderColor: theme.border,
        },
        avatar: { width: 50, height: 50, borderRadius: 25 },
        avatarPlaceholder: {
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: theme.subText,
          justifyContent: "center",
          alignItems: "center",
        },
        messageHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 2,
        },
        messageName: { fontWeight: "bold", color: theme.text },
        messageTime: { color: theme.subText, fontSize: 12 },
        messageText: { color: theme.subText, flex: 1 },
        lastMessageThumbnail: {
          width: 16,
          height: 16,
          borderRadius: 4,
          marginRight: 6,
          backgroundColor: theme.border,
        },
        lastMessageIconWrap: {
          width: 24,
          alignItems: "center",
          justifyContent: "center",
        },
        unreadBadge: {
          backgroundColor: theme.tint,
          borderRadius: 12,
          paddingHorizontal: 6,
          paddingVertical: 2,
          marginLeft: 5,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container}>
      <HeaderTabItem
        title={t("tabs.messages")}
        subTitle={t("tabs.messagesSubTitle")}
        buttonIcon={<NewIcon size={16} color="#ffffff" />}
        buttonLink="/new-message"
        buttonTitle={t("tabs.newButton")}
        buttonRoles={["admin", "teacher", "parent"]}
        buttonVariant="primary"
        addstyles={{ paddingHorizontal: 10, paddingTop: 10 }}
      />

      <View style={{ paddingHorizontal: 10 }}>
        <SearchContainer
          query={query}
          onChangeQuery={setQuery}
          onDebouncedQuery={handleDebouncedQuery}
          placeholder={t("placeholders.searchConversations")}
        />
      </View>

      <RoleGuard roles={["admin", "teacher"]}>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>

          {/* <TouchableOpacity
            onPress={() => router.push("/ai-assisstant")}
            style={styles.filterBtn}
            disabled={true}
          >
            <AiAssistantIcon size={16} color={theme.tint} />
            <Text>{t("ai.buttonLabel")}</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            onPress={() => router.push("/emergency")}
            style={styles.filterBtn}
          >
            <EmergencyIcon size={16} color={theme.emergencyColor} />
            <Text>{t("buttons.emergency")}</Text>
          </TouchableOpacity>

        </View>

      </RoleGuard>

      {/* Message List */}
      {loading && filteredContacts.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          style={{ flex: 1, marginTop: -8 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadConversations}
              tintColor={theme.tint}
            />
          }
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              onPress={openChat}
              styles={styles}
              theme={theme}
            />
          )}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: theme.subText }}>
                No conversations found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
