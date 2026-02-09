import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { PasswordIcon, PhoneIcon } from "@/components/ui/icons/settings-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ApiError } from "@/services/api";
import { authService, UserProfile } from "@/services/auth.service";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const router = useRouter();
  const setUser = useStore((s) => s.setUser);
  const role = useStore((state) => state.role);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const styles = useThemedStyles((theme) => ({
    container: { flex: 1, padding: 10, paddingTop: 0, paddingHorizontal: 0, backgroundColor: theme.bg },
    containerScrollView: { flex: 1, padding: 10, paddingTop: 20, backgroundColor: theme.bg },
    card: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      backgroundColor: theme.bg,
      borderColor: theme.border,
    },
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignSelf: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    cameraIcon: {
      position: "absolute",
      right: "38%",
      top: 65,
      backgroundColor: "#6200EE",
      padding: 6,
      borderRadius: 20,
    },
    name: { textAlign: "center", marginTop: 8, color: theme.text },
    subText: { textAlign: "center", marginBottom: 6, color: theme.subText },
    badge: {
      alignSelf: "center",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 6,
      backgroundColor: theme.panel,
      borderColor: theme.border,
      borderWidth: 1,
    },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    sectionTitle: { marginLeft: 6, color: theme.text },
    // fontSize: 14,
    label: { marginTop: 8, marginBottom: 4, color: theme.subText },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
      fontSize: 14,
    },
    changeBtn: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderRadius: 10,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: 8,
    },
    tag: {
      backgroundColor: theme.panel,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    tagText: {
      fontSize: 12,
      color: theme.text,
    },
  }));

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.getProfile();

      // API returns ProfileResponse directly
      if (response.id) {
        const profileData: UserProfile = {
          id: response.id,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          phoneNumber: response.phoneNumber,
          phone: response.phoneNumber, // backward compatibility
          profilePicture: response.profilePicture,
          role: response.role,
          subjects: response.subjects, // Array of subjects
          childName: response.childName, // Child's name
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
        };
        setProfile(profileData);
        // Update user in store
        const userData = {
          ...profileData,
          name:
            profileData.firstName || profileData.lastName
              ? `${profileData.firstName || ""} ${profileData.lastName || ""
                }`.trim()
              : profileData.email?.split("@")[0] || "",
        };
        setUser(userData);
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.message || "Failed to load profile. Please try again.";
      setError(errorMessage);

      // If error is 401 or 403, token is invalid
      if (apiError.status === 401 || apiError.status === 403) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(auth)/login");
              },
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  }, [role, setUser, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfilePicture = useCallback(async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to update your profile picture!"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const imageUri = result.assets[0].uri;
      setUploading(true);

      // Upload image
      const response = await authService.updateProfilePicture(imageUri);

      // If API returns the entire user, use it
      if (response.user) {
        const profileData: UserProfile = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phoneNumber: response.user.phoneNumber,
          phone: response.user.phoneNumber,
          profilePicture: response.user.profilePicture,
          role: response.user.role,
          subjects: response.user.subjects,
          childName: response.user.childName,
          createdAt: response.user.createdAt,
          updatedAt: response.user.updatedAt,
        };
        setProfile(profileData);

        // Update user in store
        const userData = {
          ...profileData,
          name:
            profileData.firstName || profileData.lastName
              ? `${profileData.firstName || ""} ${profileData.lastName || ""
                }`.trim()
              : profileData.email?.split("@")[0] || "",
        };
        setUser(userData);
      } else if (response.profilePicture) {
        // If only profilePicture is returned, update it
        const updatedProfile = {
          ...profile!,
          profilePicture: response.profilePicture,
        };
        setProfile(updatedProfile);

        // Update user in store
        const userData = {
          ...updatedProfile,
          name:
            updatedProfile.firstName || updatedProfile.lastName
              ? `${updatedProfile.firstName || ""} ${updatedProfile.lastName || ""
                }`.trim()
              : updatedProfile.email?.split("@")[0] || "",
        };
        setUser(userData);
      }

      // For assurance, fetch profile one more time
      // This ensures everything is updated everywhere
      await fetchProfile();

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.message ||
        "Failed to update profile picture. Please try again.";
      Alert.alert("Error", errorMessage);

      // If error is 401 or 403, token is invalid
      if (apiError.status === 401 || apiError.status === 403) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(auth)/login");
              },
            },
          ]
        );
      }
    } finally {
      setUploading(false);
    }
  }, [profile, setUser, router, fetchProfile]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.container}>
        <HeaderInnerPage
          title={t("profile.title")}
          addstyles={{ marginBottom: 20 }}
        />
        <View style={{ padding: 20, alignItems: "center" }}>
          <ThemedText
            type="error"
            style={{ textAlign: "center", marginBottom: 20 }}
          >
            {error}
          </ThemedText>
          <TouchableOpacity
            onPress={fetchProfile}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: theme.tint,
              borderRadius: 8,
            }}
          >
            <ThemedText style={{ color: "#fff" }}>{t("buttons.retry")}</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayName =
    profile?.name || profile?.firstName || profile?.lastName
      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
      : profile?.email?.split("@")[0] || "User";

  return (
    <View style={styles.container}>
      <HeaderInnerPage
        title={t("profile.title")}
        addstyles={{ marginBottom: 0 }}
      />

      <ScrollView style={styles.containerScrollView}>
        {/* User Info */}
        <View style={styles.card}>
          <Image
            source={
              profile?.profilePicture
                ? { uri: profile.profilePicture }
                : { uri: "" }
            }
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.cameraIcon}
            onPress={handleUpdateProfilePicture}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="camera" size={18} color="#fff" />
            )}
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.name}>
            {displayName}
          </ThemedText>
          <ThemedText type="subText" style={styles.subText}>
            {profile?.childName ? profile.childName : ""}
          </ThemedText>
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <View style={styles.row}>
            <PhoneIcon size={18} color={theme.text} />
            <ThemedText type="middleTitle" style={styles.sectionTitle}>
              Contact
            </ThemedText>
          </View>
          <ThemedText type="subText" style={styles.label}>
            Email
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.panel,
              },
            ]}
            value={profile?.email || ""}
            editable={false}
            placeholder={t("placeholders.noEmailAvailable")}
            placeholderTextColor={theme.subText}
          />
          <ThemedText type="subText" style={styles.label}>
            Phone
          </ThemedText>
          <View
            style={[
              styles.input,
              {
                flexDirection: "row",
                alignItems: "center",
                borderColor: theme.border,
                backgroundColor: theme.panel,
              },
            ]}
          >
            {profile?.phoneNumber || profile?.phone ? (
              <>
                <ThemedText style={{ color: theme.text, marginRight: 8 }}>
                  +1
                </ThemedText>
                <ThemedText style={{ color: theme.text }}>
                  {profile.phoneNumber || profile.phone}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={{ color: theme.subText }}>
                No phone number available
              </ThemedText>
            )}
          </View>
        </View>

        {/* Manage Password */}
        <View style={styles.card}>
          <View style={styles.row}>
            <PasswordIcon size={20} color={theme.text} />
            <ThemedText type="middleTitle" style={styles.sectionTitle}>
              Manage Passwords
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/change-password")}
            style={[styles.changeBtn, { borderColor: theme.border }]}
          >
            <ThemedText
              type="middleTitle"
              style={{ color: theme.text, fontWeight: "500" }}
            >
              Change Password
            </ThemedText>
            <Feather name="chevron-right" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
