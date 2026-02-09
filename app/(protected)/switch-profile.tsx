import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import type { UserRole } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

interface ProfileItem {
  id: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  role: UserRole;
  childName?: string;
  classroom?: string;
  isActive: boolean;
}

export default function SwitchProfileScreen() {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const router = useRouter();
  const user = useStore((state) => state.user);
  const role = useStore((state) => state.role);
  const setUser = useStore((s) => s.setUser);
  const setRole = useStore((s) => s.setRole);

  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [switching, setSwitching] = useState<string | null>(null);

  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 20,
    },
    profileCard: {
      backgroundColor: theme.bg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },

    profileContent: {
      alignItems: "center",
    },
    profileContentRow: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: theme.border,
      marginBottom: 12,
    },
    avatarRow: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 12,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.panel,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.border,
      marginBottom: 12,
    },
    avatarPlaceholderRow: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.panel,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 12,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: "600",
      color: theme.text,
    },
    avatarTextRow: {
      fontSize: 24,
      fontWeight: "600",
      color: theme.text,
    },
    userName: {
      fontSize: 14,
      color: theme.subText,
      marginBottom: 4,
      textAlign: "center",
    },
    profileTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
      textAlign: "center",
    },
    profileTitleRow: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      // flex: 1,

    },
    badgesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: 8,
      marginBottom: 8,
    },
    badge: {
      backgroundColor: theme.panel,
      paddingHorizontal: 10,
      paddingVertical: 0,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.panel,
    },
    badgeText: {
      fontSize: 10,
      color: theme.text,
    },
    activeBadge: {
      backgroundColor: "#DCFCE7",
      borderColor: "#DCFCE7",
    },
    activeBadgeText: {
      color: "#016630",
      fontSize: 10,
      fontWeight: "500",
    },
    activeBadgeIcon: {
      marginRight: 4,
    },
    tapToSwitch: {
      fontSize: 14,
      color: theme.subText,
      // marginTop: 8,
      textAlign: "center",
    },
    profileInfo: {
      flex: 1,
    },
  }));

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const second = lastName?.charAt(0) || "";
    return (first + second).toUpperCase() || "U";
  };

  const getProfileDisplayName = (profile: ProfileItem) => {
    if (profile.role === "parent" && profile.childName) {
      return `${t("switchProfile.parentPrefix")}${profile.childName}`;
    } else if (profile.role === "teacher" && profile.classroom) {
      return `${t("switchProfile.teacherPrefix")}${profile.classroom}`;
    } else if (profile.role === "teacher") {
      return t("switchProfile.teacher");
    } else {
      return profile.childName || t("switchProfile.parent");
    }
  };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      // Get current profile
      const currentProfile = await authService.getProfile();

      // TODO: Replace with actual API call to get all user profiles/roles
      // For now, we'll create a mock list with the current profile as active
      // In a real implementation, you would call something like:
      // const allProfiles = await authService.getAllProfiles();

      const currentProfileItem: ProfileItem = {
        id: currentProfile.id,
        firstName: currentProfile.firstName,
        lastName: currentProfile.lastName,
        profilePicture: currentProfile.profilePicture,
        role: currentProfile.role,
        childName: currentProfile.childName,
        classroom: "Classroom 1A", // This should come from API
        isActive: true,
      };

      // Mock additional profiles - replace with actual API call
      const mockProfiles: ProfileItem[] = [
        currentProfileItem,
        // Example: Another parent profile for a different child
        ...(currentProfile.role === "parent"
          ? [
            {
              id: `${currentProfile.id}-2`,
              firstName: currentProfile.firstName,
              lastName: currentProfile.lastName,
              profilePicture: currentProfile.profilePicture,
              role: "parent" as UserRole,
              childName: "Mike Rodriguez",
              classroom: "Classroom 1A",
              isActive: false,
            },
          ]
          : []),
        // Example: Teacher profile if user can be a teacher
        ...(currentProfile.role === "parent" || currentProfile.role === "teacher"
          ? [
            {
              id: `${currentProfile.id}-teacher`,
              firstName: currentProfile.firstName,
              lastName: currentProfile.lastName,
              profilePicture: currentProfile.profilePicture,
              role: "teacher" as UserRole,
              classroom: "Classroom 1A",
              isActive: false,
            },
          ]
          : []),
      ];

      setProfiles(mockProfiles);
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert(
        t("common.error"),
        apiError.message || t("switchProfile.failedLoadProfiles")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSwitchProfile = useCallback(
    async (profile: ProfileItem) => {
      if (profile.isActive || switching) {
        return;
      }

      setSwitching(profile.id);

      try {
        // TODO: Replace with actual API call to switch profile
        // Example: await authService.switchProfile(profile.id);

        // For now, update the store with the selected profile
        const updatedUser = {
          ...user!,
          role: profile.role as any,
          childName: profile.childName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          profilePicture: profile.profilePicture,
        };

        setUser(updatedUser);
        setRole(profile.role);

        // Update profiles to reflect the new active profile
        setProfiles((prev) =>
          prev.map((p) => ({
            ...p,
            isActive: p.id === profile.id,
          }))
        );

        Alert.alert(t("common.success"), t("switchProfile.profileSwitchedSuccess"), [
          {
            text: t("common.ok"),
            onPress: () => {
              router.back();
            },
          },
        ]);
      } catch (err) {
        const apiError = err as ApiError;
        Alert.alert(
          t("common.error"),
          apiError.message || t("switchProfile.failedSwitchProfile")
        );
      } finally {
        setSwitching(null);
      }
    },
    [user, setUser, setRole, router, switching, t]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderInnerPage title={t("switchProfile.title")} />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderInnerPage title={t("switchProfile.title")} />
      <ScrollView style={styles.scrollContent}>
        {profiles.map((profile) => {
          const displayName = getProfileDisplayName(profile);
          const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
          const initials = getInitials(profile.firstName, profile.lastName);
          const isRowLayout = !profile.isActive;

          return (
            <TouchableOpacity
              key={profile.id}
              style={styles.profileCard}
              onPress={() => handleSwitchProfile(profile)}
              disabled={profile.isActive || !!switching}
            >
              {isRowLayout ? (
                <View style={styles.profileContentRow}>
                  {profile.profilePicture ? (
                    <Image
                      source={{ uri: profile.profilePicture }}
                      style={styles.avatarRow}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholderRow}>
                      <ThemedText style={styles.avatarTextRow}>
                        {initials}
                      </ThemedText>
                    </View>
                  )}
                  <View style={[styles.profileInfo, { alignItems: "flex-start", justifyContent: "center", gap: 6 }]}>
                    <ThemedText type="subtitle" style={[styles.profileTitleRow]}>
                      {displayName}
                    </ThemedText>
                    {/* {fullName && (
                      <ThemedText type="subText" style={[styles.userName]}>
                        {fullName}
                      </ThemedText>
                    )} */}
                    <ThemedText type="subText" style={styles.tapToSwitch}>
                      {t("switchProfile.tapToSwitch")}
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <View style={styles.profileContent}>
                  {profile.profilePicture ? (
                    <Image
                      source={{ uri: profile.profilePicture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <ThemedText style={styles.avatarText}>
                        {initials}
                      </ThemedText>
                    </View>
                  )}
                  {fullName && (
                    <ThemedText type="subText" style={styles.userName}>
                      {fullName}
                    </ThemedText>
                  )}
                  <ThemedText type="subtitle" style={styles.profileTitle}>
                    {displayName}
                  </ThemedText>
                  <View style={styles.badgesContainer}>
                    {profile.classroom && (
                      <View style={styles.badge}>
                        <ThemedText style={styles.badgeText}>
                          {profile.classroom}
                        </ThemedText>
                      </View>
                    )}
                    {profile.isActive && (
                      <View style={[styles.badge, styles.activeBadge, { flexDirection: "row", alignItems: "center", gap: 0 }]}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#016630"
                          style={styles.activeBadgeIcon}
                        />
                        <ThemedText style={styles.activeBadgeText}>
                          {t("switchProfile.currentlyActive")}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
