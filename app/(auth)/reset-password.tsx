import AuthLanguageSwitcher from "@/components/ui/auth-language-switcher";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useValidation } from "@/hooks/use-validation";
import { ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import { trackAuthEvent } from "@/utils/analytics";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const theme = useStore((state) => state.theme);

  const [token, setToken] = useState(typeof params.token === "string" ? params.token : "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const colorScheme = useStore((state) => state.colorScheme);

  const { errors, validate } = useValidation({
    token: { required: true, minLength: 8 },
    newPassword: { required: true, minLength: 6, maxLength: 100 },
    confirmPassword: { required: true, equalTo: newPassword },
  });

  const normalizedToken = useMemo(() => token.trim(), [token]);
  const hasTokenPrefill = useMemo(
    () => Boolean((typeof params.token === "string" ? params.token : "").trim()),
    [params.token]
  );
  const trimmedNewPassword = useMemo(() => newPassword.trim(), [newPassword]);
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (trimmedNewPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(trimmedNewPassword) && /[a-z]/.test(trimmedNewPassword)) score += 1;
    if (/\d/.test(trimmedNewPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(trimmedNewPassword)) score += 1;
    if (score <= 1) return "weak";
    if (score <= 3) return "medium";
    return "strong";
  }, [trimmedNewPassword]);

  useEffect(() => {
    trackAuthEvent("reset_password_screen_view", { hasTokenPrefill });
  }, [hasTokenPrefill]);

  const handleReset = async () => {
    const isValid = validate({
      token: normalizedToken,
      newPassword: trimmedNewPassword,
      confirmPassword: confirmPassword.trim(),
    });
    if (!isValid) return;

    setLoading(true);
    trackAuthEvent("reset_password_attempt");
    try {
      const response = await authService.resetPassword(normalizedToken, trimmedNewPassword);
      trackAuthEvent("reset_password_success");
      Alert.alert(
        t("auth.reset.successTitle"),
        response.message || t("auth.reset.successMessage"),
        [
          {
            text: t("auth.common.backToLogin"),
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (err) {
      const apiError = err as ApiError;
      const lowerMessage = (apiError.message || "").toLowerCase();
      const isInvalidOrExpired =
        apiError.status === 400 &&
        (lowerMessage.includes("invalid") || lowerMessage.includes("expired") || lowerMessage.includes("token"));

      trackAuthEvent("reset_password_failed", { status: apiError.status ?? null, invalidOrExpired: isInvalidOrExpired });

      if (isInvalidOrExpired) {
        Alert.alert(
          t("auth.reset.invalidTokenTitle"),
          t("auth.reset.invalidTokenMessage"),
          [
            {
              text: t("auth.reset.requestNewLink"),
              onPress: () => router.replace("/(auth)/forgot-password"),
            },
            {
              text: t("auth.common.cancel"),
              style: "cancel",
            },
          ]
        );
      } else {
        Alert.alert(t("auth.reset.failedTitle"), apiError.message || t("auth.common.tryAgain"));
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: t.bg,
    },
    card: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 16,
      padding: 18,
      backgroundColor: t.panel,
    },
    logo: {
      width: "82%",
      maxWidth: 220,
      height: 56,
      alignSelf: "center",
      marginTop: 4,
    },
    title: {
      color: t.text,
      fontWeight: "700",
      textAlign: "center",
    },
    subtitle: {
      marginTop: 8,
      color: t.subText,
      textAlign: "center",
    },
    fieldGroup: {
      marginTop: 16,
    },
    fieldLabel: {
      marginBottom: 8,
      color: t.text,
      fontWeight: "600",
    },
    inputRow: {
      borderWidth: 1,
      borderRadius: 10,
      borderColor: t.border,
      backgroundColor: t.bg,
      minHeight: 46,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      gap: 8,
    },
    inputIcon: {
      color: t.subText,
    },
    input: {
      flex: 1,
      height: 46,
      color: t.text,
      paddingHorizontal: 8,
    },
    toggleButton: {
      padding: 6,
    },
    helper: {
      marginTop: 10,
      color: t.subText,
      textAlign: "center",
      fontSize: 12,
    },
    button: {
      marginTop: 18,
      borderRadius: 10,
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.tint,
      flexDirection: "row",
      gap: 8,
    },
    secondary: {
      marginTop: 10,
      borderRadius: 10,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.bg,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={
            colorScheme === "dark"
              ? require("./../../assets/images/LOGO-light.png")
              : require("./../../assets/images/LOGO-primary.png")
          }
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Family App Logo"
        />
        <ThemedText type="middleTitle" style={styles.title}>
          {t("auth.reset.title")}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {t("auth.reset.subtitle")}
        </ThemedText>

        <View style={styles.fieldGroup}>
          <ThemedText type="middleTitle" style={styles.fieldLabel}>
            {t("auth.reset.tokenLabel")}
          </ThemedText>
          <View style={styles.inputRow}>
            <Feather name="key" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={setToken}
              placeholder={t("auth.reset.tokenPlaceholder")}
              placeholderTextColor={theme.subText}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel={t("auth.reset.tokenLabel")}
            />
          </View>
          {errors.token && <ThemedText type="error">{errors.token}</ThemedText>}
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="middleTitle" style={styles.fieldLabel}>
            {t("auth.reset.newPasswordLabel")}
          </ThemedText>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t("auth.reset.newPasswordPlaceholder")}
              placeholderTextColor={theme.subText}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              textContentType="newPassword"
              accessibilityLabel={t("auth.reset.newPasswordLabel")}
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowNewPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showNewPassword ? t("auth.reset.hideNewPassword") : t("auth.reset.showNewPassword")}
            >
              <Feather name={showNewPassword ? "eye-off" : "eye"} size={18} style={styles.inputIcon} />
            </TouchableOpacity>
          </View>
          {errors.newPassword && <ThemedText type="error">{errors.newPassword}</ThemedText>}
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="middleTitle" style={styles.fieldLabel}>
            {t("auth.reset.confirmPasswordLabel")}
          </ThemedText>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t("auth.reset.confirmPasswordPlaceholder")}
              placeholderTextColor={theme.subText}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              textContentType="newPassword"
              accessibilityLabel={t("auth.reset.confirmPasswordLabel")}
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? t("auth.reset.hideConfirmPassword") : t("auth.reset.showConfirmPassword")}
            >
              <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={18} style={styles.inputIcon} />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <ThemedText type="error">{errors.confirmPassword}</ThemedText>}
        </View>

        <ThemedText type="subText" style={styles.helper}>
          {t("auth.reset.passwordRule")} {t(`auth.reset.strength.${passwordStrength}`)}
        </ThemedText>

        <TouchableOpacity
          style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleReset}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={loading ? t("auth.reset.resetting") : t("auth.reset.submit")}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700" }}>{t("auth.reset.resetting")}</Text>
            </>
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>{t("auth.reset.submit")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          onPress={() => router.replace("/(auth)/login")}
          accessibilityRole="button"
          accessibilityLabel={t("auth.common.backToLogin")}
        >
          <Text style={{ color: theme.text, fontWeight: "700" }}>{t("auth.common.backToLogin")}</Text>
        </TouchableOpacity>
      </View>
      <View>
        <AuthLanguageSwitcher />
      </View>
    </View>
  );
}
