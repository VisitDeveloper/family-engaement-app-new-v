import RoleGuard from "@/components/check-permisions";
import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import SearchContainer from "@/components/reptitive-component/search-container";
import {
  ConversationResponseDto,
  messagingService,
} from "@/services/messaging.service";
import { useStore } from "@/store";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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

interface Messages extends Contact {
  message: string;
  time: string;
  unread: number;
  avatar: string | null;
  online: boolean;
  group?: boolean;
  admin?: boolean;
}

// ✅ Message Item Component
const MessageItem = ({
  item,
  onPress,
  styles,
}: {
  item: Messages;
  onPress: (msg: Messages) => void;
  styles: any;
}) => {
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
          <Text numberOfLines={1} style={styles.messageText}>
            {item.message}
          </Text>
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
          const fullName = `${otherParticipant.user.firstName || ""} ${
            otherParticipant.user.lastName || ""
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

      const lastMessage = conv.lastMessage?.content || "";
      const time = conv.lastMessage
        ? formatTime(conv.lastMessage.createdAt)
        : formatTime(conv.updatedAt);

      return {
        id: conv.id,
        name,
        message: lastMessage,
        time,
        unread: conv.unreadCount || 0,
        avatar,
        online: false, // You might want to add online status from participants
        group: conv.type === "group",
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
          justifyContent: "space-between",
          alignItems: "center",
          gap: 15,
          marginVertical: 5,
          paddingHorizontal: 10,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
        },
        filterBtn: {
          flex: 1,
          flexDirection: "row",
          justifyContent: "center",
          gap: 10,
          alignItems: "center",
          borderWidth: 1,
          borderRadius: 8,
          padding: 8,
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
        messageText: { color: theme.subText },
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
        title="Messages"
        subTitle="Conversations and notices"
        buttonIcon={<Feather name="edit" size={16} color={theme.tint} />}
        buttonLink="/new-message"
        buttonTtitle="New"
        buttonRoles={["admin", "teacher", "parent"]}
        addstyles={{ paddingHorizontal: 10, paddingTop: 10 }}
      />

      <View style={{ paddingHorizontal: 10 }}>
        <SearchContainer
          query={query}
          onChangeQuery={setQuery}
          onDebouncedQuery={handleDebouncedQuery}
          placeholder="Search Conversations..."
        />
      </View>

      <RoleGuard roles={["admin", "teacher"]}>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => router.push("/emergency")}
            style={[styles.filterBtn, { borderColor: theme.emergencyColor }]}
          >
            <AntDesign name="warning" size={15} color={theme.emergencyColor} />
            <Text style={{ color: theme.emergencyColor }}>Emergency</Text>
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
          renderItem={({ item }) => (
            <MessageItem item={item} onPress={openChat} styles={styles} />
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
