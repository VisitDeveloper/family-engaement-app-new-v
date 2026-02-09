import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { PasswordIcon } from "@/components/ui/icons/settings-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useValidation } from "@/hooks/use-validation";
import { ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import {
  AntDesign,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChangePassword() {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const router = useRouter();
  const setLoggedIn = useStore((s) => s.setLoggedIn);
  const setUser = useStore((s) => s.setUser);
  const setRole = useStore((s) => s.setRole);

  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [oldPassClosed, setOldPassClosed] = useState(true);
  const [NewPassClosed, setNewPassClosed] = useState(true);
  const [RetypeNewClosed, setRetypeNewClosed] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check password requirements
  // null = gray (not typed yet), true = green (correct), false = red (incorrect)
  const passwordRequirements = (() => {
    // If field is empty, return all requirements as null (gray)
    if (!newPassword || newPassword.trim().length === 0) {
      return {
        minLength: null,
        hasUpperLower: null,
        hasNumber: null,
        hasSpecial: null,
      };
    }

    // If field is filled, check each requirement
    return {
      minLength: newPassword.length >= 8,
      hasUpperLower: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    };
  })();

  // Check if passwords match
  const passwordsMismatch =
    newPassword && confirmPassword && newPassword !== confirmPassword;

  const { errors, validate } = useValidation({
    oldPassword: { required: true, minLength: 6 },
    newPassword: { required: true, minLength: 8 },
    confirmPassword: { required: true, minLength: 8, equalTo: newPassword },
  });

  const styles = useThemedStyles((theme) => ({
    container: { flex: 1, padding: 0, backgroundColor: theme.bg },
    containerScrollView: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 10, paddingTop: 20, paddingBottom: 100 },
    card: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      backgroundColor: theme.bg,
      borderColor: theme.border,
    },
    inputSection: {
      flexDirection: "column",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 10,
      marginBottom: 10,
    },
    label: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginVertical: 10,
    },
    btn: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 16,
      marginBottom: 60,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.emergencyColor,
      borderColor: theme.border,
    },
    subText: { fontSize: 14, textAlign: "center", marginBottom: 6 },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 5 },
    input: {
      padding: 10,
      marginBottom: 10,
      borderRadius: 10,
      color: theme.text,
      backgroundColor: theme.panel,
    },
    eyeCatch: {
      position: "absolute",
      right: 10,
      top: 10,
    },
    desc: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 10,
    },
  }));

  const handleChangePassword = async () => {
    setError(null);

    // Check new password match
    if (newPassword !== confirmPassword) {
      setError(t("changePassword.passwordMismatchMessage"));
      return;
    }

    const isValid = validate({ oldPassword, newPassword, confirmPassword });
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.changePassword({
        oldPassword,
        newPassword,
        // confirmPassword,
      });

      console.log("response", response);

      Alert.alert(t("common.success"), t("changePassword.passwordChangedSuccess"), [
        {
          text: t("common.ok"),
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (err) {
      const apiError = err as ApiError;
      let errorMessage =
        apiError.message || t("changePassword.failedChangePassword");

      // If error is 401 or 403, token is invalid and we need to login again
      if (apiError.status === 401 || apiError.status === 403) {
        errorMessage = t("changePassword.sessionExpiredMessageNewPassword");

        // Clear state and redirect to login page
        setLoggedIn(false);
        setUser(null);
        setRole(null);

        Alert.alert(t("userProfile.sessionExpired"), errorMessage, [
          {
            text: t("common.ok"),
            onPress: () => {
              router.replace("/(auth)/login");
            },
          },
        ]);
        return;
      }

      setError(errorMessage);
      Alert.alert(t("common.error"), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderInnerPage
        title={t("changePassword.title")}
        addstyles={{ marginBottom: 0 }}
      />

      <ScrollView
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.containerScrollView}
      >
        {/* Contact */}
        <View style={styles.card}>
          <View style={styles.row}>
            <PasswordIcon size={24} color={theme.text} />
            <ThemedText
              type="subtitle"
              style={{ color: theme.text, marginLeft: 18 }}
            >
              {t("changePassword.managePassword")}
            </ThemedText>
          </View>

          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>{t("changePassword.oldPassword")}</ThemedText>
            <View style={{ position: "relative" }}>
              <TextInput
                placeholder={t("placeholders.oldPassword")}
                secureTextEntry={oldPassClosed}
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholderTextColor={theme.subText}
              />
              {oldPassClosed ? (
                <TouchableOpacity
                  onPress={() => setOldPassClosed(false)}
                  style={styles.eyeCatch}
                >
                  <Octicons name="eye-closed" size={20} color={theme.text} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setOldPassClosed(true)}
                  style={styles.eyeCatch}
                >
                  <Octicons name="eye" size={20} color={theme.text} />
                </TouchableOpacity>
              )}
            </View>
            {errors.oldPassword && (
              <ThemedText type="error" style={{ marginTop: 5 }}>
                {errors.oldPassword}
              </ThemedText>
            )}
          </View>

          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>{t("changePassword.newPassword")}</ThemedText>
            <View style={{ position: "relative" }}>
              <TextInput
                placeholder={t("placeholders.newPassword")}
                secureTextEntry={NewPassClosed}
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholderTextColor={theme.subText}
              />
              {NewPassClosed ? (
                <TouchableOpacity
                  onPress={() => setNewPassClosed(false)}
                  style={styles.eyeCatch}
                >
                  <Octicons name="eye-closed" size={20} color={theme.text} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setNewPassClosed(true)}
                  style={styles.eyeCatch}
                >
                  <Octicons name="eye" size={20} color={theme.text} />
                </TouchableOpacity>
              )}
            </View>
            {errors.newPassword && (
              <ThemedText type="error" style={{ marginTop: 5 }}>
                {errors.newPassword}
              </ThemedText>
            )}
          </View>

          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>{t("changePassword.retypeNewPassword")}</ThemedText>
            <View style={{ position: "relative" }}>
              <TextInput
                placeholder={t("placeholders.confirmPassword")}
                secureTextEntry={RetypeNewClosed}
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor={theme.subText}
              />
              {RetypeNewClosed ? (
                <TouchableOpacity
                  onPress={() => setRetypeNewClosed(false)}
                  style={styles.eyeCatch}
                >
                  <Octicons name="eye-closed" size={20} color={theme.text} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setRetypeNewClosed(true)}
                  style={styles.eyeCatch}
                >
                  <Octicons name="eye" size={20} color={theme.text} />
                </TouchableOpacity>
              )}
            </View>
            {errors.confirmPassword && (
              <ThemedText type="error" style={{ marginTop: 5 }}>
                {errors.confirmPassword}
              </ThemedText>
            )}
          </View>

          <View style={styles.desc}>
            <MaterialCommunityIcons
              name={
                passwordRequirements.minLength === true
                  ? "check"
                  : passwordRequirements.minLength === false
                    ? "close"
                    : "check"
              }
              size={16}
              color={
                passwordRequirements.minLength === null
                  ? theme.subText
                  : passwordRequirements.minLength === true
                    ? "#4caf50"
                    : theme.emergencyColor
              }
            />
            <ThemedText
              type="subText"
              style={{
                color:
                  passwordRequirements.minLength === null
                    ? theme.subText
                    : passwordRequirements.minLength === true
                      ? "#4caf50"
                      : theme.emergencyColor,
                marginLeft: 10,
              }}
            >
              {t("changePassword.passwordRequirements.minLength")}
            </ThemedText>
          </View>
          <View style={styles.desc}>
            <MaterialCommunityIcons
              name={
                passwordRequirements.hasUpperLower === true
                  ? "check"
                  : passwordRequirements.hasUpperLower === false
                    ? "close"
                    : "check"
              }
              size={16}
              color={
                passwordRequirements.hasUpperLower === null
                  ? theme.subText
                  : passwordRequirements.hasUpperLower === true
                    ? "#4caf50"
                    : theme.emergencyColor
              }
            />
            <ThemedText
              type="subText"
              style={{
                color:
                  passwordRequirements.hasUpperLower === null
                    ? theme.subText
                    : passwordRequirements.hasUpperLower === true
                      ? "#4caf50"
                      : theme.emergencyColor,
                marginLeft: 10,
              }}
            >
              {t("changePassword.passwordRequirements.hasUpperLower")}
            </ThemedText>
          </View>
          <View style={styles.desc}>
            <MaterialCommunityIcons
              name={
                passwordRequirements.hasNumber === true
                  ? "check"
                  : passwordRequirements.hasNumber === false
                    ? "close"
                    : "check"
              }
              size={16}
              color={
                passwordRequirements.hasNumber === null
                  ? theme.subText
                  : passwordRequirements.hasNumber === true
                    ? "#4caf50"
                    : theme.emergencyColor
              }
            />
            <ThemedText
              type="subText"
              style={{
                color:
                  passwordRequirements.hasNumber === null
                    ? theme.subText
                    : passwordRequirements.hasNumber === true
                      ? "#4caf50"
                      : theme.emergencyColor,
                marginLeft: 10,
              }}
            >
              {t("changePassword.passwordRequirements.hasNumber")}
            </ThemedText>
          </View>
          <View style={styles.desc}>
            <MaterialCommunityIcons
              name={
                passwordRequirements.hasSpecial === true
                  ? "check"
                  : passwordRequirements.hasSpecial === false
                    ? "close"
                    : "check"
              }
              size={16}
              color={
                passwordRequirements.hasSpecial === null
                  ? theme.subText
                  : passwordRequirements.hasSpecial === true
                    ? "#4caf50"
                    : theme.emergencyColor
              }
            />
            <ThemedText
              type="subText"
              style={{
                color:
                  passwordRequirements.hasSpecial === null
                    ? theme.subText
                    : passwordRequirements.hasSpecial === true
                      ? "#4caf50"
                      : theme.emergencyColor,
                marginLeft: 10,
              }}
            >
              {t("changePassword.passwordRequirements.hasSpecial")}
            </ThemedText>
          </View>
          <View style={styles.desc}>
            <MaterialCommunityIcons
              name="check"
              size={16}
              color={theme.passDesc}
            />
            <ThemedText
              type="subText"
              style={{ color: theme.passDesc, marginLeft: 10 }}
            >
              {t("changePassword.passwordRequirements.noPersonalInfo")}
            </ThemedText>
          </View>

          {passwordsMismatch && (
            <View style={styles.desc}>
              <AntDesign name="close" size={16} color={theme.emergencyColor} />
              <ThemedText
                type="subText"
                style={{ color: theme.emergencyColor, marginLeft: 10 }}
              >
                {t("changePassword.passwordMismatch")}
              </ThemedText>
            </View>
          )}

          {/* {error && (
            <View
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: "#ffebee",
                borderRadius: 5,
              }}
            >
              <ThemedText type="error" style={{ textAlign: "center" }}>
                {error}
              </ThemedText>
            </View>
          )} */}
        </View>

        <TouchableOpacity
          style={[styles.btn, { opacity: loading ? 0.6 : 1 }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={{ color: "#fff" }}>{t("changePassword.changePasswordButton")}</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
