import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { messagingService } from "@/services/messaging.service";
import { userService } from "@/services/user.service";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface GroupItem {
  id: string;
  name: string;
  image?: string | null;
}

interface ContactItem {
  id: string;
  name: string;
  role?: string;
  lastSeen?: string;
  image?: string | null;
  initials?: string;
}

export default function NewMessageScreen() {
  const router = useRouter();
  const currentUser = useStore((state: any) => state.user);
  const currentUserId = currentUser?.id || null;
  const addConversation = useStore((state: any) => state.addConversation);

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMoreContacts, setLoadingMoreContacts] = useState(false);
  const [contactsPage, setContactsPage] = useState(1);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);

  const styles = useThemedStyles(
    (t) =>
      ({
        container: {
          flex: 1,
          backgroundColor: t.bg,
        },
        sectionTitle: {
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
          fontSize: 14,
          fontWeight: "600",
          color: t.text,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 8,
          paddingHorizontal: 12,
          minHeight: 60, // Minimum height for item
          maxHeight: 80, // Maximum height to control stretching
        },
        actionIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: t.subText,
          alignItems: "center",
          justifyContent: "center",
        },
        itemName: {
          marginLeft: 12,
          fontSize: 16,
          fontWeight: "500",
          color: t.text,
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
        },
        avatarPlaceholder: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: t.panel,
          alignItems: "center",
          justifyContent: "center",
        },
        avatarInitials: {
          fontSize: 16,
          fontWeight: "600",
          color: t.text,
        },
        itemContent: {
          marginLeft: 12,
          flex: 1,
        },
        itemHeader: {
          flexDirection: "row",
          alignItems: "center",
        },
        roleBadge: {
          marginLeft: 8,
          paddingHorizontal: 8,
          paddingVertical: 2,
          fontSize: 12,
          backgroundColor: "#fde68a",
          color: "#92400e",
          borderRadius: 6,
          overflow: "hidden",
        },
        lastSeen: {
          fontSize: 12,
          color: "#666",
          marginTop: 2,
        },
      } as const)
  );
  const theme = useStore((state) => state.theme);

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const { groups: groupsList } = await messagingService.getGroups({
        limit: 100,
      });
      console.log("groupsList", groupsList);
      const mappedGroups: GroupItem[] = groupsList.map((conv) => {
        const name =
          typeof conv.name === "string"
            ? conv.name
            : conv.name && typeof conv.name === "object"
            ? (Object.values(conv.name)[0] as string) || "Group"
            : "Group";
        return {
          id: conv.id,
          name: name,
          image: conv.imageUrl || null,
        };
      });
      setGroups(mappedGroups);
    } catch (error: any) {
      console.error("Error loading groups:", error);
      Alert.alert("Error", error.message || "Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const loadContacts = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (append) {
        setLoadingMoreContacts(true);
      } else {
        setLoadingContacts(true);
      }

      try {
        const currentUserRole = currentUser?.role;

        // Determine filter parameters based on user role
        let apiParams: {
          page: number;
          limit: number;
          role?:
            | "parent"
            | "teacher"
            | "student"
            | ("parent" | "teacher" | "student")[];
        } = {
          page,
          limit: 20,
        };

        // If teacher, only get parents
        if (currentUserRole === "teacher") {
          apiParams.role = ["parent"];
        }
        // If parent, only get teachers
        else if (currentUserRole === "parent") {
          apiParams.role = ["teacher"];
        }
        // If admin, get all roles (parent, teacher, student)
        else if (currentUserRole === "admin") {
          apiParams.role = ["parent", "teacher"];
        }

        // API itself filters admins
        const response = await userService.getAll(apiParams);

        // Filtering: remove current user and ensure no admins are displayed
        const mappedContacts: ContactItem[] = response.users
          .filter((user) => {
            // Remove current user
            if (user.id === currentUserId) return false;
            // Remove admins (as an additional security layer)
            if (user.role === "admin") return false;
            return true;
          })
          .map((user) => ({
            id: user.id,
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.email,
            role:
              user.role === "teacher"
                ? "Teacher"
                : user.role === "parent"
                ? "Parent"
                : "Student",
            image: user.profilePicture || null,
            initials:
              `${user.firstName?.[0] || ""}${
                user.lastName?.[0] || ""
              }`.toUpperCase() || user.email[0].toUpperCase(),
          }));

        if (append) {
          setContacts((prev) => [...prev, ...mappedContacts]);
        } else {
          setContacts(mappedContacts);
        }

        setContactsPage(page);
        setHasMoreContacts(
          page <
            (response.totalPages || Math.ceil(response.total / response.limit))
        );
      } catch (error: any) {
        console.error("Error loading contacts:", error);
        if (!append) {
          Alert.alert("Error", error.message || "Failed to load contacts");
        }
      } finally {
        setLoadingContacts(false);
        setLoadingMoreContacts(false);
      }
    },
    [currentUserId, currentUser?.role]
  );

  const loadMoreContacts = useCallback(() => {
    if (!loadingMoreContacts && hasMoreContacts && !loadingContacts) {
      loadContacts(contactsPage + 1, true);
    }
  }, [
    loadingMoreContacts,
    hasMoreContacts,
    loadingContacts,
    contactsPage,
    loadContacts,
  ]);

  useEffect(() => {
    loadGroups();
    loadContacts();
  }, [loadGroups, loadContacts]);

  const handleGroupPress = (group: GroupItem) => {
    router.push({
      pathname: "/chat/[chatID]",
      params: { chatID: group.id },
    });
  };

  const handleContactPress = async (contact: ContactItem) => {
    try {
      // Check if a direct conversation already exists
      const { conversations } = await messagingService.getConversations();
      const existingConversation = conversations.find(
        (conv) =>
          conv.type === "direct" &&
          conv.participants?.some((p) => p.id === contact.id)
      );

      if (existingConversation) {
        // Navigate to existing conversation
        router.push({
          pathname: "/chat/[chatID]",
          params: { chatID: existingConversation.id },
        });
      } else {
        // Create new direct conversation
        const newConversation = await messagingService.createConversation({
          type: "direct",
          memberIds: [contact.id],
        });
        // Add the new conversation to the store
        addConversation(newConversation);
        router.push({
          pathname: "/chat/[chatID]",
          params: { chatID: newConversation.id },
        });
      }
    } catch (error: any) {
      console.error("Error creating/opening conversation:", error);
      Alert.alert("Error", error.message || "Failed to open conversation");
    }
  };

  const renderGroupItem = ({ item }: { item: GroupItem }) => {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleGroupPress(item)}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {item.name[0]}
              {item.name.split(" ")[1] ? item.name.split(" ")[1][0] : ""}
            </Text>
          </View>
        )}
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContactItem = ({
    item,
  }: {
    item: ContactItem;
    index?: number;
  }) => {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleContactPress(item)}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{item.initials}</Text>
          </View>
        )}
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.role?.toLowerCase() === "teacher" && (
              <Text style={styles.roleBadge}>{item.role}</Text>
            )}
          </View>
          {item.lastSeen && (
            <Text style={styles.lastSeen}>Last Seen: {item.lastSeen}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderInnerPage title="New Message" />

      {/* Groups */}
      <Text style={styles.sectionTitle}>Groups</Text>
      {currentUser?.role !== "parent" && (
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/create-group")}
        >
          <View style={styles.actionIcon}>
            <Ionicons name={"people-outline"} size={24} color={theme.tint} />
          </View>
          <Text style={styles.itemName}>Create New Group</Text>
        </TouchableOpacity>
      )}

      {loadingGroups ? (
        <View style={{ padding: 20, alignItems: "center" }}>
          <ActivityIndicator size="small" color={theme.tint} />
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{ minHeight: 200, height: 200, maxHeight: 220 }}
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: theme.subText }}>No groups found</Text>
            </View>
          }
        />
      )}

      {/* Contacts */}
      <Text style={styles.sectionTitle}>Contacts</Text>
      {loadingContacts ? (
        <View style={{ padding: 20, alignItems: "center" }}>
          <ActivityIndicator size="small" color={theme.tint} />
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{ minHeight: 200, height: 200 }}
          data={contacts}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderContactItem}
          onEndReached={loadMoreContacts}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: theme.subText }}>No contacts found</Text>
            </View>
          }
          ListFooterComponent={
            loadingMoreContacts ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={theme.tint} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
