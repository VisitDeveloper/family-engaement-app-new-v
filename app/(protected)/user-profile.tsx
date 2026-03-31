import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import EditNameBottomSheet from "@/components/ui/edit-name-bottom-sheet";
import { PencilIcon } from "@/components/ui/icons/messages-icons";
import { PasswordIcon, PhoneIcon } from "@/components/ui/icons/settings-icons";
import { KeyboardAwareScrollViewPlatform } from "@/components/ui/keyboard-aware-scroll-view";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ApiError } from "@/services/api";
import { authService, UserProfile } from "@/services/auth.service";
import { useStore } from "@/store";
import { getDisplayName } from "@/utils/user-name";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const router = useRouter();
  const setUser = useStore((s) => s.setUser);
  const setUserSettingsFromProfile = useStore((s) => s.setUserSettingsFromProfile);
  const setAppLanguage = useStore((s) => s.setAppLanguage);
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [requestingPhoneOtp, setRequestingPhoneOtp] = useState<boolean>(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [phoneOtpCode, setPhoneOtpCode] = useState<string>("");
  const [phoneOtpRequested, setPhoneOtpRequested] = useState<boolean>(false);
  const [phoneOtpCooldownSeconds, setPhoneOtpCooldownSeconds] = useState<number>(0);
  const [countryCode, setCountryCode] = useState<CountryCode>("US");
  const [callingCode, setCallingCode] = useState<string>("1");
  const [showNameSheet, setShowNameSheet] = useState<boolean>(false);

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
    nameEditRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 8,
      marginBottom: 4,
    },
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
        setFirstName(profileData.firstName || "");
        setLastName(profileData.lastName || "");
        setPhoneInput(profileData.phoneNumber || profileData.phone || "");
        // Update user in store
        const userData = {
          ...profileData,
          name: getDisplayName(
            profileData.firstName,
            profileData.lastName,
            profileData.email?.split("@")[0] || ""
          ),
        };
        setUser(userData);
        if (response.settings) {
          setUserSettingsFromProfile(response.settings);
          if (response.settings.appLanguage) {
            setAppLanguage(response.settings.appLanguage);
          }
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.message || t("userProfile.failedLoadProfile");
      setError(errorMessage);

      // If error is 401 or 403, token is invalid
      if (apiError.status === 401 || apiError.status === 403) {
        Alert.alert(
          t("userProfile.sessionExpired"),
          t("userProfile.sessionExpiredMessage"),
          [
            {
              text: t("common.ok"),
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
  }, [setUser, setUserSettingsFromProfile, setAppLanguage, router, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (phoneOtpCooldownSeconds <= 0) return;
    const timeout = setTimeout(() => {
      setPhoneOtpCooldownSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [phoneOtpCooldownSeconds]);

  const handleUpdateProfilePicture = useCallback(async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("userProfile.permissionRequired"),
          t("userProfile.cameraRollPermissionMessage")
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
        setFirstName(profileData.firstName || "");
        setLastName(profileData.lastName || "");
        setPhoneInput(profileData.phoneNumber || profileData.phone || "");

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
        setFirstName(updatedProfile.firstName || "");
        setLastName(updatedProfile.lastName || "");
        setPhoneInput(updatedProfile.phoneNumber || updatedProfile.phone || "");

        // Update user in store
        const userData = {
          ...updatedProfile,
          name: getDisplayName(
            updatedProfile.firstName,
            updatedProfile.lastName,
            updatedProfile.email?.split("@")[0] || ""
          ),
        };
        setUser(userData);
      }

      // For assurance, fetch profile one more time
      // This ensures everything is updated everywhere
      await fetchProfile();

      Alert.alert(t("common.success"), t("userProfile.profilePictureUpdatedSuccess"));
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.message ||
        t("userProfile.failedUpdateProfilePicture");
      Alert.alert(t("common.error"), errorMessage);

      // If error is 401 or 403, token is invalid
      if (apiError.status === 401 || apiError.status === 403) {
        Alert.alert(
          t("userProfile.sessionExpired"),
          t("userProfile.sessionExpiredMessage"),
          [
            {
              text: t("common.ok"),
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
  }, [profile, setUser, router, fetchProfile, t]);

  const handleUpdateProfileInfo = useCallback(async () => {
    if (!profile) return;

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName && !trimmedLastName) {
      Alert.alert(t("common.error"), t("userProfile.nameRequired"));
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });

      const updatedProfile: UserProfile = {
        ...profile,
        ...updated,
        phone: updated.phoneNumber || profile.phone,
      };
      setProfile(updatedProfile);
      setFirstName(updatedProfile.firstName || "");
      setLastName(updatedProfile.lastName || "");

      const userData = {
        ...updatedProfile,
        name: getDisplayName(
          updatedProfile.firstName,
          updatedProfile.lastName,
          updatedProfile.email?.split("@")[0] || ""
        ),
      };
      setUser(userData);

      Alert.alert(t("common.success"), t("userProfile.profileUpdatedSuccess"));
      setShowNameSheet(false);
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert(
        t("common.error"),
        apiError.message || t("userProfile.failedUpdateProfile")
      );
    } finally {
      setSavingProfile(false);
    }
  }, [firstName, lastName, profile, setUser, t]);

  const normalizePhoneNumber = useCallback((rawPhone: string): string => {
    const trimmed = rawPhone.trim();
    if (!trimmed) return "";

    let normalized = trimmed.replace(/[\s\-()]/g, "");
    if (normalized.startsWith("00")) {
      normalized = `+${normalized.slice(2)}`;
    }
    if (!normalized.startsWith("+")) {
      normalized = `+${normalized}`;
    }
    return normalized;
  }, []);

  const buildInternationalPhone = useCallback(
    (rawPhone: string): string => {
      const trimmed = rawPhone.trim();
      if (!trimmed) return "";

      // If user already typed country prefix (+...), keep it.
      if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
        return normalizePhoneNumber(trimmed);
      }

      const localDigits = trimmed.replace(/\D/g, "");
      if (!localDigits) return "";
      return `+${callingCode}${localDigits}`;
    },
    [callingCode, normalizePhoneNumber]
  );

  const isValidInternationalPhone = useCallback((phone: string): boolean => {
    return /^\+[1-9]\d{6,14}$/.test(phone);
  }, []);

  const handlePhoneInputChange = useCallback((value: string) => {
    setPhoneInput(value);
    setPhoneOtpRequested(false);
    setPhoneOtpCode("");
    setPhoneOtpCooldownSeconds(0);
  }, []);

  const handleRequestPhoneOtp = useCallback(async () => {
    if (!profile) return;

    const normalizedPhone = buildInternationalPhone(phoneInput);
    const currentPhone = normalizePhoneNumber(profile.phoneNumber || profile.phone || "");

    if (!normalizedPhone) {
      Alert.alert(t("common.error"), t("userProfile.phoneRequired"));
      return;
    }

    if (!isValidInternationalPhone(normalizedPhone)) {
      Alert.alert(t("common.error"), t("userProfile.invalidPhoneNumber"));
      return;
    }

    if (normalizedPhone === currentPhone) {
      Alert.alert(t("common.error"), t("userProfile.phoneNoChanges"));
      return;
    }

    if (phoneOtpCooldownSeconds > 0) {
      Alert.alert(
        t("common.error"),
        t("userProfile.phoneOtpResendCooldown", { seconds: phoneOtpCooldownSeconds })
      );
      return;
    }

    setRequestingPhoneOtp(true);
    try {
      const response = await authService.requestPhoneChangeOtp({
        phoneNumber: normalizedPhone,
      });
      setPhoneOtpRequested(true);
      setPhoneOtpCooldownSeconds(60);
      Alert.alert(
        t("common.success"),
        response.message || t("userProfile.phoneOtpSent")
      );
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 409) {
        Alert.alert(t("common.error"), t("userProfile.phoneAlreadyInUse"));
      } else {
        Alert.alert(
          t("common.error"),
          apiError.message || t("userProfile.failedUpdatePhone")
        );
      }
    } finally {
      setRequestingPhoneOtp(false);
    }
  }, [
    buildInternationalPhone,
    isValidInternationalPhone,
    normalizePhoneNumber,
    phoneInput,
    phoneOtpCooldownSeconds,
    profile,
    t,
  ]);

  const handleVerifyPhoneOtp = useCallback(async () => {
    if (!profile) return;

    const normalizedOtp = phoneOtpCode.trim();
    if (!normalizedOtp || normalizedOtp.length !== 6) {
      Alert.alert(t("common.error"), t("userProfile.phoneOtpInvalid"));
      return;
    }

    setVerifyingPhoneOtp(true);
    try {
      const response = await authService.verifyPhoneChangeOtp({
        code: normalizedOtp,
      });

      const updatedProfile: UserProfile = {
        ...profile,
        phoneNumber: response.phoneNumber,
        phone: response.phoneNumber,
      };
      setProfile(updatedProfile);
      setPhoneInput(response.phoneNumber);
      setPhoneOtpCode("");
      setPhoneOtpRequested(false);
      setPhoneOtpCooldownSeconds(0);

      const userData = {
        ...updatedProfile,
        name: getDisplayName(
          updatedProfile.firstName,
          updatedProfile.lastName,
          updatedProfile.email?.split("@")[0] || ""
        ),
      };
      setUser(userData);

      Alert.alert(t("common.success"), t("userProfile.phoneUpdatedSuccess"));
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 409) {
        Alert.alert(t("common.error"), t("userProfile.phoneAlreadyInUse"));
      } else {
        Alert.alert(
          t("common.error"),
          apiError.message || t("userProfile.phoneOtpInvalid")
        );
      }
    } finally {
      setVerifyingPhoneOtp(false);
    }
  }, [phoneOtpCode, profile, setUser, t]);

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
      ? getDisplayName(
        profile.firstName,
        profile.lastName,
        profile.email?.split("@")[0] || t("userProfile.user")
      )
      : profile?.email?.split("@")[0] || t("userProfile.user");
  const hasNameChanges =
    (firstName.trim() !== (profile?.firstName || "").trim()) ||
    (lastName.trim() !== (profile?.lastName || "").trim());

  return (
    <View style={styles.container}>
      <HeaderInnerPage
        title={t("profile.title")}
        addstyles={{ marginBottom: 0 }}
      />

      <KeyboardAwareScrollViewPlatform
        style={styles.containerScrollView}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "android" ? 56 : 24),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={Platform.OS === "android" ? 28 : 0}
      >
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
          <View style={styles.nameEditRow}>
            <ThemedText type="subtitle" style={styles.name}>
              {displayName}
            </ThemedText>
            <TouchableOpacity
              onPress={() => {
                setFirstName(profile?.firstName || "");
                setLastName(profile?.lastName || "");
                setShowNameSheet(true);
              }}
              disabled={savingProfile}
            >
              <PencilIcon size={14} color={theme.tint} />
            </TouchableOpacity>
          </View>
          <ThemedText type="subText" style={styles.subText}>
            {profile?.role === "parent" && profile.childName
              ? `${t("userProfile.parentPrefix")}${profile.childName}`
              : profile?.role === "teacher"
                ? t("userProfile.teacher")
                : ""}
          </ThemedText>
          <View style={[styles.tagsContainer, { borderBottomColor: theme.border, borderBottomWidth: 1, paddingBottom: 10 }]}>
            {profile?.subjects && profile.subjects.length > 0 && (
              <View style={styles.tag}>
                <ThemedText style={styles.tagText}>
                  {profile.subjects[0]}
                </ThemedText>
              </View>
            )}
            {/* TODO: Add classroom tag when classroom data is available from API */}
          </View>
          <TouchableOpacity
            onPress={() => router.push("/switch-profile")}
            style={[
              styles.changeBtn,
              { borderColor: theme.border, marginTop: 12 },
            ]}
          >
            <ThemedText
              type="middleTitle"
              style={{ color: theme.text, fontWeight: "500" }}
            >
              {t("userProfile.switchProfile")}
            </ThemedText>
            <Feather name="chevron-right" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <View style={styles.row}>
            <PhoneIcon size={18} color={theme.text} />
            <ThemedText type="middleTitle" style={styles.sectionTitle}>
              {t("userProfile.contact")}
            </ThemedText>
          </View>
          <ThemedText type="subText" style={styles.label}>
            {t("userProfile.email")}
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                height: 44,
                paddingVertical: 0,
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
            {t("userProfile.phone")}
          </ThemedText>
          <View
            style={[
              styles.input,
              {
                height: 44,
                paddingVertical: 0,
                flexDirection: "row",
                alignItems: "center",
                borderColor: theme.border,
                backgroundColor: theme.panel,
              },
            ]}
          >
            <View style={{ marginRight: 4, transform: [{ scale: 0.85 }] }}>
              <CountryPicker
                countryCode={countryCode}
                withFilter
                withFlag
                withCallingCode
                withCallingCodeButton
                onSelect={(country: Country) => {
                  setCountryCode(country.cca2);
                  setCallingCode(country.callingCode?.[0] || "1");
                }}
              />
            </View>
            <TextInput
              style={{ flex: 1, color: theme.text, paddingVertical: 0 }}
              value={phoneInput}
              onChangeText={handlePhoneInputChange}
              editable={!requestingPhoneOtp && !verifyingPhoneOtp}
              keyboardType="phone-pad"
              placeholder={t("userProfile.noPhoneNumberAvailable")}
              placeholderTextColor={theme.subText}
            />
          </View>
          <TouchableOpacity
            onPress={handleRequestPhoneOtp}
            style={[styles.changeBtn, { borderColor: theme.border }]}
            disabled={requestingPhoneOtp || verifyingPhoneOtp || phoneOtpCooldownSeconds > 0}
          >
            <ThemedText
              type="middleTitle"
              style={{ color: theme.text, fontWeight: "500" }}
            >
              {requestingPhoneOtp
                ? t("common.loading")
                : phoneOtpCooldownSeconds > 0
                  ? t("userProfile.resendPhoneOtpIn", { seconds: phoneOtpCooldownSeconds })
                  : t("userProfile.sendPhoneOtp")}
            </ThemedText>
            {requestingPhoneOtp ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <Feather name="mail" size={18} color={theme.text} />
            )}
          </TouchableOpacity>
          {phoneOtpRequested && (
            <>
              <ThemedText type="subText" style={styles.label}>
                {t("userProfile.phoneOtpCode")}
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
                value={phoneOtpCode}
                onChangeText={setPhoneOtpCode}
                editable={!verifyingPhoneOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder={t("userProfile.phoneOtpPlaceholder")}
                placeholderTextColor={theme.subText}
              />
              <TouchableOpacity
                onPress={handleVerifyPhoneOtp}
                style={[styles.changeBtn, { borderColor: theme.border }]}
                disabled={verifyingPhoneOtp}
              >
                <ThemedText
                  type="middleTitle"
                  style={{ color: theme.text, fontWeight: "500" }}
                >
                  {verifyingPhoneOtp ? t("common.loading") : t("userProfile.verifyPhoneOtp")}
                </ThemedText>
                {verifyingPhoneOtp ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Feather name="check-circle" size={18} color={theme.text} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRequestPhoneOtp}
                style={[styles.changeBtn, { borderColor: theme.border }]}
                disabled={requestingPhoneOtp || verifyingPhoneOtp || phoneOtpCooldownSeconds > 0}
              >
                <ThemedText
                  type="middleTitle"
                  style={{ color: theme.text, fontWeight: "500" }}
                >
                  {phoneOtpCooldownSeconds > 0
                    ? t("userProfile.resendPhoneOtpIn", { seconds: phoneOtpCooldownSeconds })
                    : t("userProfile.resendPhoneOtp")}
                </ThemedText>
                <Feather name="refresh-cw" size={18} color={theme.text} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Manage Password */}
        <View style={styles.card}>
          <View style={styles.row}>
            <PasswordIcon size={20} color={theme.text} />
            <ThemedText type="middleTitle" style={styles.sectionTitle}>
              {t("userProfile.managePasswords")}
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
              {t("changePassword.title")}
            </ThemedText>
            <Feather name="chevron-right" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewPlatform>
      <EditNameBottomSheet
        visible={showNameSheet}
        onClose={() => {
          setShowNameSheet(false);
          setFirstName(profile?.firstName || "");
          setLastName(profile?.lastName || "");
        }}
        firstName={firstName}
        lastName={lastName}
        onChangeFirstName={setFirstName}
        onChangeLastName={setLastName}
        onSubmit={handleUpdateProfileInfo}
        canSubmit={hasNameChanges}
        isSubmitting={savingProfile}
      />
    </View>
  );
}
