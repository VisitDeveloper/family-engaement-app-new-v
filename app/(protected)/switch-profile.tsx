import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import type { CurrentProfile, ProfileItem, SwitchProfileBody } from "@/types";
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

function profileToSwitchBody(profile: ProfileItem): SwitchProfileBody {
  return {
    role: profile.role,
    ...(profile.siteId != null && { siteId: profile.siteId }),
    ...(profile.organizationId != null && { organizationId: profile.organizationId }),
  };
}

function profileLabel(profile: ProfileItem): string {
  if (profile.role === "admin") return "Administrator";
  if (profile.siteName) return `${profile.role} · ${profile.siteName}`;
  if (profile.organizationName) return `Org manager · ${profile.organizationName}`;
  return profile.role;
}

function profileKey(profile: ProfileItem): string {
  return profile.id ?? `${profile.role}-${profile.siteId ?? ""}-${profile.organizationId ?? ""}`;
}

/** True when this profile is the active one (match by currentProfile.id from GET /auth/profile). */
function isActiveProfile(profile: ProfileItem, currentProfile: CurrentProfile | null): boolean {
  if (!currentProfile) return false;
  if (profile.id != null && profile.id !== "") return profile.id === currentProfile.id;
  return (
    profile.role === currentProfile.role &&
    (profile.organizationId ?? null) === currentProfile.organizationId &&
    (profile.siteId ?? null) === currentProfile.siteId
  );
}

export default function SwitchProfileScreen() {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const router = useRouter();
  const user = useStore((state) => state.user);
  const currentProfile = useStore((s) => s.currentProfile);
  const setUser = useStore((s) => s.setUser);
  const setRole = useStore((s) => s.setRole);
  const setCurrentProfile = useStore((s) => s.setCurrentProfile);

  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [switchingKey, setSwitchingKey] = useState<string | null>(null);

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
    profileCardActive: {
      borderColor: theme.border,
      borderWidth: 1,
      // backgroundColor: "#F0FDF4",
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
      // backgroundColor: theme.panel,
      backgroundColor: theme.panel,
      justifyContent: "center",
      alignItems: "center",
      // borderWidth: 2,
      // borderColor: theme.border,
      marginBottom: 12,
    },
    avatarPlaceholderRow: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.panel,
      justifyContent: "center",
      alignItems: "center",
      // borderWidth: 1,
      // borderColor: theme.border,
      marginRight: 12,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: "600",
      color: theme.text,
      paddingTop: 16,
    },
    avatarTextRow: {
      fontSize: 24,
      fontWeight: "600",
      color: theme.text,
      paddingTop: 4,
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

  const getProfileDisplayName = useCallback(
    (profile: ProfileItem) => {
      if (profile.role === "admin") return t("switchProfile.administrator", { defaultValue: "Administrator" });
      if (profile.role === "parent" && profile.siteName) return `${t("switchProfile.parentPrefix", { defaultValue: "Parent · " })}${profile.siteName}`;
      if (profile.role === "parent") return t("switchProfile.parent", { defaultValue: "Parent" });
      if (profile.role === "teacher" && profile.siteName) return `${t("switchProfile.teacherPrefix", { defaultValue: "Teacher · " })}${profile.siteName}`;
      if (profile.role === "teacher") return t("switchProfile.teacher", { defaultValue: "Teacher" });
      if (profile.role === "organization_manager" && profile.organizationName) return `${t("switchProfile.orgManagerPrefix", { defaultValue: "Org manager · " })}${profile.organizationName}`;
      if (profile.role === "site_manager" && profile.siteName) return `${t("switchProfile.siteManagerPrefix", { defaultValue: "Site manager · " })}${profile.siteName}`;
      return profileLabel(profile);
    },
    [t]
  );

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { profiles: list } = await authService.getProfiles();
      setProfiles(list);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        // Treat as logged out; caller/global handler may redirect to login
        Alert.alert(t("common.error"), apiError.message || t("switchProfile.failedLoadProfiles"));
      } else {
        Alert.alert(
          t("common.error"),
          apiError.message || t("switchProfile.failedLoadProfiles")
        );
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSwitchProfile = useCallback(
    async (profile: ProfileItem) => {
      const key = profileKey(profile);
      const active = isActiveProfile(profile, currentProfile);
      if (active || switchingKey) return;

      setSwitchingKey(key);

      try {
        const data = await authService.switchProfile(profileToSwitchBody(profile));

        const u = data.user;
        const name =
          u.firstName || u.lastName
            ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
            : u.email?.split("@")[0] ?? "";

        setUser({
          id: u.id,
          name,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          organizationId: u.organizationId ?? undefined,
          siteId: u.siteId ?? undefined,
          phoneNumber: u.phoneNumber,
          profilePicture: u.profilePicture,
          childName: u.childName,
          subjects: u.subjects,
        });
        setRole(u.role);
        setCurrentProfile({
          id: profile.id ?? `${profile.role}|${profile.organizationId ?? ""}|${profile.siteId ?? ""}`,
          role: profile.role,
          organizationId: profile.organizationId ?? null,
          siteId: profile.siteId ?? null,
        });

        Alert.alert(t("common.success"), t("switchProfile.profileSwitchedSuccess"), [
          { text: t("common.ok"), onPress: () => router.back() },
        ]);
      } catch (err) {
        const apiError = err as ApiError;
        Alert.alert(
          t("common.error"),
          apiError.message || t("switchProfile.failedSwitchProfile")
        );
      } finally {
        setSwitchingKey(null);
      }
    },
    [currentProfile, setUser, setRole, setCurrentProfile, router, switchingKey, t]
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

  const currentProfileItem =
    (currentProfile && profiles.find((p) => p.id === currentProfile.id)) ??
    (currentProfile
      ? {
        id: currentProfile.id,
        role: currentProfile.role,
        siteId: currentProfile.siteId,
        organizationId: currentProfile.organizationId,
        siteName: null as string | null,
        organizationName: null as string | null,
      }
      : null);

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials = getInitials(user?.firstName, user?.lastName);

  return (
    <View style={styles.container}>
      <HeaderInnerPage title={t("switchProfile.title")} />
      <ScrollView style={styles.scrollContent}>
        <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, paddingBottom: 0 }} >
          {currentProfileItem ? (
            <>
              {/* <ThemedText type="subtitle" style={{ fontSize: 14, marginBottom: 10, color: theme.subText }}>
              {t("switchProfile.currentProfile", { defaultValue: "Current profile" })}
            </ThemedText> */}
              <View style={[styles.profileCard, styles.profileCardActive]}>
                <View style={styles.profileContent}>
                  {user?.profilePicture ? (
                    <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <ThemedText style={styles.avatarText}>{initials}</ThemedText>
                    </View>
                  )}
                  {fullName ? (
                    <ThemedText type="subText" style={styles.userName}>
                      {fullName}
                    </ThemedText>
                  ) : null}
                  <ThemedText type="subtitle" style={styles.profileTitle}>
                    {getProfileDisplayName(currentProfileItem)}
                  </ThemedText>
                  <View style={styles.badgesContainer}>
                    {(currentProfileItem.siteName ?? currentProfileItem.organizationName) ? (
                      <View style={styles.badge}>
                        <ThemedText style={styles.badgeText}>
                          {currentProfileItem.siteName ?? currentProfileItem.organizationName}
                        </ThemedText>
                      </View>
                    ) : null}
                    <View style={[styles.badge, styles.activeBadge, { flexDirection: "row", alignItems: "center", gap: 0 }]}>
                      <Ionicons name="checkmark-circle" size={14} color="#016630" style={styles.activeBadgeIcon} />
                      <ThemedText style={styles.activeBadgeText}>
                        {t("switchProfile.currentlyActive")}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : null}


          <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 }} >
            {(() => {
              const otherProfiles = profiles.filter((p) => !isActiveProfile(p, currentProfile));
              if (otherProfiles.length === 0) {
                return (
                  <ThemedText type="subText">{t("switchProfile.noOtherProfiles", { defaultValue: "No other profiles to switch to." })}</ThemedText>
                );
              }
              return (
                <>
                  {/* <ThemedText type="subtitle" style={{ fontSize: 14, marginBottom: 10, marginTop: 8, color: theme.subText }}>
                {t("switchProfile.switchTo", { defaultValue: "Switch to" })}
              </ThemedText> */}

                  {otherProfiles.map((profile) => {
                    const displayName = getProfileDisplayName(profile);
                    const key = profileKey(profile);

                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.profileCard}
                        onPress={() => handleSwitchProfile(profile)}
                        disabled={!!switchingKey}
                      >
                        <View style={styles.profileContentRow}>
                          {user?.profilePicture ? (
                            <Image source={{ uri: user.profilePicture }} style={styles.avatarRow} />
                          ) : (
                            <View style={styles.avatarPlaceholderRow}>
                              <ThemedText style={styles.avatarTextRow}>{initials}</ThemedText>
                            </View>
                          )}
                          <View style={[styles.profileInfo, { alignItems: "flex-start", justifyContent: "center", gap: 6 }]}>
                            <ThemedText type="subtitle" style={styles.profileTitleRow}>
                              {displayName}
                            </ThemedText>
                            <ThemedText type="subText" style={styles.tapToSwitch}>
                              {t("switchProfile.tapToSwitch")}
                            </ThemedText>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              );
            })()}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
