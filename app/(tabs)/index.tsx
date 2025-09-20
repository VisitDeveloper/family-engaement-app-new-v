import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import SearchContainer from "@/components/reptitive-component/search-container";
import { useStore } from "@/store";
import { AntDesign, Feather, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

const messages: Messages[] = [
  {
    id: "1",
    name: "Ms. Alvarez",
    message: "Sarah did wonderful work on her math worksheet!",
    time: "2:30 PM",
    unread: 2,
    avatar: null,
    online: true,
  },
  {
    id: "2",
    name: "Room 5B Class Updates",
    message: "Tomorrow is picture day! Please have children...",
    time: "11:45 AM",
    online: false,
    unread: 0,
    avatar: "https://i.pravatar.cc/150?img=32",
    group: true,
  },
  {
    id: "3",
    name: "Principal Johnson",
    message: "Parent-teacher conferences are scheduled...",
    time: "Yesterday",
    unread: 1,
    online: false,
    avatar: "https://i.pravatar.cc/150?img=12",
    admin: true,
  },
  {
    id: "4",
    name: "Mr. Rodriguez - Art",
    message: "Jason created a beautiful painting today!",
    time: "Yesterday",
    unread: 0,
    avatar: "https://i.pravatar.cc/150?img=5",
    online: false,
  },
];

// ✅ Message Item Component
const MessageItem = ({
  item,
  onPress,
  styles,
}: {
  item: Messages;
  onPress: (msg: Messages) => void;
  styles: any;
}) => (
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

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const addChat = useStore((state: any) => state.addChat);
  const theme = useStore((state: any) => state.theme);

  const [query, setQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<Messages[]>(messages);

  const handleDebouncedQuery = (value: string) => {
    if (!value) {
      setFilteredContacts(messages);
      return;
    }

    const lowerQuery = value.toLowerCase();
    const results = messages.filter(
      msg =>
        msg.name.toLowerCase().includes(lowerQuery) ||
        msg.message.toLowerCase().includes(lowerQuery)
    );

    setFilteredContacts(results);
  };

  const openChat = useCallback(
    (ITEM: Messages) => {
      addChat(ITEM);
      router.push({
        pathname: "/chat/[chatID]",
        params: { chatID: ITEM.id },
      });
    },
    [addChat, router]
  );

  // ✅ Styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, padding: 10, backgroundColor: theme.bg },
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
          marginVertical: 10,
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
        buttonLink="/new"
        buttonTtitle="New"
      />

      <SearchContainer
        query={query}
        onChangeQuery={setQuery}
        onDebouncedQuery={handleDebouncedQuery}
        placeholder="Search Conversations..."
      />

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          onPress={() => router.push("/ai-assisstant")}
          style={[styles.filterBtn, { borderColor: theme.tint }]}
        >
          <FontAwesome5 name="robot" size={15} color={theme.tint} />
          <Text style={{ color: theme.tint }}>AI Assistant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/emergency")}
          style={[styles.filterBtn, { borderColor: theme.emergencyColor }]}
        >
          <AntDesign name="warning" size={15} color={theme.emergencyColor} />
          <Text style={{ color: theme.emergencyColor }}>Emergency</Text>
        </TouchableOpacity>
      </View>

      {/* Message List */}
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
      />
    </View>
  );
}
