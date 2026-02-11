import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { SmallUsersIcon } from "@/components/ui/icons/messages-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { messagingService } from "@/services/messaging.service";
import { userService } from "@/services/user.service";
import { useStore } from "@/store";
import type { ConversationResponseDto, ProfileResponseDto } from "@/types";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContactProfileScreen() {
  const router = useRouter();
  const theme = useStore((state) => state.theme);
  const addConversation = useStore((state: any) => state.addConversation);
  const { userId, name: nameParam = "", role: roleParam = "", image: imageParam } = useLocalSearchParams<{
    userId: string;
    name?: string;
    role?: string;
    image?: string;
  }>();

  const [userProfile, setUserProfile] = useState<ProfileResponseDto | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [commonGroups, setCommonGroups] = useState<
    { id: string; name: string; imageUrl?: string | null }[]
  >([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [sending, setSending] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  // Use fetched profile data, fallback to URL params if available
  const displayName = userProfile
    ? `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() || userProfile.email?.split("@")[0] || "User"
    : nameParam || "User";
  const displayRole = userProfile?.role || roleParam || "";
  const avatarUri = userProfile?.profilePicture || (imageParam && imageParam !== "" ? imageParam : null);
  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const loadUserProfile = useCallback(async () => {
    if (!userId) return;
    setLoadingProfile(true);
    try {
      const profile = await userService.getProfileById(userId);
      setUserProfile(profile);
    } catch (error: any) {
      console.error("Error loading user profile:", error);
      // Don't show error alert, just use fallback params if available
      setUserProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  const loadCommonGroups = useCallback(async () => {
    if (!userId) return;
    setLoadingGroups(true);
    try {
      const { groups } = await messagingService.getGroups({ limit: 100 });
      const withUser = (groups || []).filter((g: ConversationResponseDto) =>
        g.participants?.some((p) => p.user?.id === userId)
      );
      const mapped = withUser.map((g) => ({
        id: g.id,
        name:
          typeof g.name === "string"
            ? g.name
            : g.name && typeof g.name === "object"
              ? (Object.values(g.name)[0] as string) || "Group"
              : "Group",
        imageUrl: g.imageUrl ?? null,
      }));
      setCommonGroups(mapped);
    } catch {
      setCommonGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    loadCommonGroups();
  }, [loadCommonGroups]);

  // محاسبه اینکه آیا محتوا کمتر از ارتفاع ScrollView است
  // اگر محتوا + دکمه (حدود 80px) کمتر از ارتفاع ScrollView باشد، دکمه را fixed نشان می‌دهیم
  const buttonHeight = 80;
  const showFixedButton = contentHeight > 0 && scrollViewHeight > 0 && (contentHeight + buttonHeight) <= scrollViewHeight;

  const handleSendMessage = useCallback(async () => {
    if (!userId) return;
    setSending(true);
    try {
      const { conversations } = await messagingService.getConversations();
      const existing = conversations.find(
        (conv) =>
          conv.type === "direct" &&
          conv.participants?.some((p) => p.user?.id === userId)
      );

      if (existing) {
        router.replace({
          pathname: "/chat/[chatID]",
          params: { chatID: existing.id },
        });
      } else {
        const newConversation = await messagingService.createConversation({
          type: "direct",
          memberIds: [userId],
        });
        addConversation(newConversation);
        router.replace({
          pathname: "/chat/[chatID]",
          params: { chatID: newConversation.id },
        });
      }
    } catch (error: any) {
      console.error("Error creating/opening conversation:", error);
      Alert.alert("Error", error.message || "Failed to open conversation");
    } finally {
      setSending(false);
    }
  }, [userId, router, addConversation]);

  const styles = useThemedStyles(
    (t) =>
    ({
      container: {
        flex: 1,
        backgroundColor: t.bg,
      },
      scrollContent: {
        padding: 16,
      },
      buttonContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 32,
        backgroundColor: theme.bg,
        // borderTopWidth: 1,
        // borderTopColor: theme.border,
      },
      card: {
        backgroundColor: t.bg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: t.border,
      },
      avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignSelf: "center",
        marginBottom: 12,
        backgroundColor: t.border,
      },
      avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignSelf: "center",
        marginBottom: 12,
        backgroundColor: t.border,
        alignItems: "center",
        justifyContent: "center",
      },
      avatarInitials: {
        fontSize: 24,
        fontWeight: "600",
        color: t.text,
      },
      name: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
        color: t.text,
      },
      role: {
        fontSize: 14,
        color: t.subText,
        textAlign: "center",
        marginBottom: 8,
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        color: t.text,
      },
      item: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
      },
      itemAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: t.border,
      },
      itemText: {
        fontSize: 14,
        flex: 1,
        color: t.text,
      },
      groupTag: {
        backgroundColor: t.border,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
      },
      groupTagText: {
        fontSize: 12,
        color: t.subText,
      },
      separator: {
        height: 1,
        backgroundColor: t.border,
        marginVertical: 4,
      },
      button: {
        flexDirection: "row",
        backgroundColor: theme.tint,
        padding: 16,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 24,
      },
      buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
        marginLeft: 8,
      },
    } as const)
  );

  return (
    <View style={styles.container}>
      <HeaderInnerPage title="Profile" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          showFixedButton 
            ? { flexGrow: 1, paddingBottom: 100 }
            : { paddingBottom: 32 }
        ]}
        showsVerticalScrollIndicator={false}
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;
          setScrollViewHeight(height);
        }}
        scrollEventThrottle={16}
      >
        <View
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            setContentHeight(height);
          }}
        >
          {/* User Info Card */}
          <View style={styles.card}>
            {loadingProfile ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="small" color={theme.tint} />
              </View>
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            {loadingProfile ? (
              <View style={{ alignItems: "center", marginTop: 12 }}>
                <ActivityIndicator size="small" color={theme.tint} />
              </View>
            ) : (
              <>
                <Text style={styles.name}>{displayName}</Text>
                {displayRole ? (
                  <Text style={styles.role}>{displayRole}</Text>
                ) : null}
              </>
            )}
          </View>

          {/* Classrooms Attached */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Classrooms Attached</Text>
            {loadingProfile ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color={theme.tint} />
              </View>
            ) : !userProfile?.classrooms || userProfile.classrooms.length === 0 ? (
              <View style={styles.item}>
                <Text style={[styles.itemText, { color: theme.subText }]}>
                  No classrooms
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                {
                  userProfile.classrooms.map((classroom, index) => {
                    const classroomName =
                      typeof classroom.name === "string"
                        ? classroom.name
                        : classroom.name && typeof classroom.name === "object"
                          ? (Object.values(classroom.name)[0] as string) || "Classroom"
                          : "Classroom";
                    return (
                      <View key={classroom.id}>
                        {index > 0 && <View style={styles.separator} />}
                        <View style={styles.item}>
                          <View style={{ position: "relative" }}>
                            <Image
                              source={classroom.imageUrl ? { uri: classroom.imageUrl } : require("@/assets/images/classroom-placeholder.png")}
                              style={styles.itemAvatar}
                            />
                            <View style={{ position: "absolute", bottom: -4, right: 6, backgroundColor: theme.bg, borderRadius: 50, width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
                              <View style={{ backgroundColor: "#2B7FFF", borderRadius: 50, width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
                                <SmallUsersIcon color="#fff" size={8} />
                              </View>
                            </View>
                          </View>
                          <Text style={styles.itemText}>{classroomName}</Text>
                        </View>
                      </View>
                    );
                  })
                }
              </View>
            )}
          </View>

          {/* Common Groups */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Common Groups</Text>
            {loadingGroups ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color={theme.tint} />
              </View>
            ) : commonGroups.length === 0 ? (
              <View style={styles.item}>
                <Text style={[styles.itemText, { color: theme.subText }]}>
                  No common groups
                </Text>
              </View>
            ) : (
              commonGroups.map((group, index) => (
                <View key={group.id}>
                  {index > 0 && <View style={styles.separator} />}
                  <View style={styles.item}>
                    {group.imageUrl ? (
                      <Image
                        source={{ uri: group.imageUrl }}
                        style={styles.itemAvatar}
                      />
                    ) : (
                      <View style={[styles.itemAvatar, { alignItems: "center", justifyContent: "center" }]}>
                        <Ionicons name="people-outline" size={20} color={theme.subText} />
                      </View>
                    )}
                    <Text style={styles.itemText}>{group.name}</Text>
                    <View style={styles.groupTag}>
                      <Text style={styles.groupTagText}>Group</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Send Message Button - inside scroll if content is long */}
          {!showFixedButton && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="send" size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>Send Message</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Send Message Button - fixed at bottom if content is short */}
      {showFixedButton && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendMessage}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
            <Text style={styles.buttonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
