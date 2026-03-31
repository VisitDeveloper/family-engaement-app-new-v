import AuthLanguageSwitcher from "@/components/ui/auth-language-switcher";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useValidation } from "@/hooks/use-validation";
import { ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import { trackAuthEvent } from "@/utils/analytics";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function LoginScreen() {
  const { t } = useTranslation();
  const setLoggedIn = useStore((s) => s.setLoggedIn);
  const router = useRouter();
  const theme = useStore((state) => state.theme);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useStore((state) => state.colorScheme);

  const { errors, validate } = useValidation({
    email: {
      required: true,
      maxLength: 100,
      minLength: 5,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { required: true, maxLength: 100, minLength: 6 },
    confirmPassword: {},
  });

  useEffect(() => {
    trackAuthEvent("login_screen_view");
  }, []);

  const handleLogin = async () => {
    setError(null);
    const isValid = validate({ email, password, confirmPassword: "" });

    if (!isValid) return;

    setLoading(true);
    trackAuthEvent("login_attempt", { hasEmail: Boolean(email.trim()) });

    try {
      const response = await authService.login({ email, password });

      // Determine role from API response or from email (fallback)
      let detectedRole: "admin" | "organization_manager" | "site_manager" | "teacher" | "parent" | "student" | null = null;
      if (response.user?.role) {
        detectedRole = response.user.role;
      } else {
        detectedRole = "parent";
      }

      // Save user and role - save all user information from API
      if (response.user) {
        useStore.getState().setUser({
          // @ts-ignore
          id: response.user.id,
          name:
            // response.user.name ||
            response.user.firstName || response.user.lastName
              ? `${response.user.firstName || ""} ${response.user.lastName || ""
                }`.trim()
              : email.split("@")[0],
          // @ts-ignore
          email: response.user.email || email,
          // role: response.user.role || detectedRole || null,
          profilePicture: response.user.profilePicture,
          childName: response.user.childName,
          ...response.user, // Save all additional fields
        });
      } else {
        // If API doesn't return user, save at least initial information
        useStore.getState().setUser({
          id: email,
          name: email.split("@")[0],
          email: email,
          role: detectedRole || null,
        });
      }

      if (detectedRole) {
        useStore.getState().setRole(detectedRole);
      }

      setLoggedIn(true);
      trackAuthEvent("login_success", { role: detectedRole ?? "unknown" });
      router.replace("/(protected)/(tabs)");
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.message || t("auth.login.genericError");
      setError(errorMessage);
      trackAuthEvent("login_failed", { status: apiError.status ?? null });
      Alert.alert(t("common.error"), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      justifyContent: "center"
    },
    contentWrapper: {
      width: "100%",
      maxWidth: 450,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    card: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 16,
      backgroundColor: t.panel,
      padding: 18,
    },
    logo: {
      width: "82%",
      maxWidth: 220,
      height: 56,
      alignSelf: "center",
      marginTop: 4,
    },
    heading: {
      marginTop: 14,
      textAlign: "center",
      color: t.text,
      fontWeight: "700",
    },
    subtitle: {
      marginTop: 6,
      textAlign: "center",
      color: t.subText,
    },
    badge: {
      alignSelf: "center",
      marginTop: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: t.bg,
      borderWidth: 1,
      borderColor: t.border,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: t.subText,
    },
    fieldGroup: {
      marginTop: 16,
    },
    fieldLabel: {
      marginBottom: 8,
      color: t.text,
      fontWeight: "600",
    },
    input: {
      borderRadius: 10,
      borderColor: t.border,
      backgroundColor: t.bg,
      height: 46,
      paddingHorizontal: 12,
      flex: 1,
      color: t.text,
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
    passwordToggle: {
      padding: 6,
      marginLeft: 2,
    },
    forgotRow: {
      marginTop: 8,
      alignItems: "flex-end",
    },
    forgotButton: {
      paddingVertical: 2,
      paddingHorizontal: 2,
    },
    forgotText: {
      color: t.tint,
      fontSize: 13,
      fontWeight: "700",
    },
    inlineError: {
      marginTop: 4,
    },
    errorBox: {
      marginTop: 14,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: t.emergencyBackground,
      borderWidth: 1,
      borderColor: t.emergencyColor,
    },
    submitButton: {
      marginTop: 20,
      width: "100%",
      borderRadius: 10,
      minHeight: 46,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.tint,
      flexDirection: "row",
      gap: 8,
    },
    submitText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    helperText: {
      marginTop: 10,
      textAlign: "center",
      color: t.subText,
    },
  }));

  const scrollContent = (
    <View style={styles.contentWrapper}>
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

        <ThemedText type="middleTitle" style={styles.heading}>
          {t("auth.login.title")}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {t("auth.login.subtitle")}
        </ThemedText>



        <View style={styles.fieldGroup}>
          <ThemedText type="middleTitle" style={styles.fieldLabel}>
            {t("auth.fields.email")}
          </ThemedText>
          <View style={styles.inputRow}>
            <Feather
              name="mail"
              size={18}
              style={styles.inputIcon}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t("placeholders.email")}
              placeholderTextColor={theme.subText}
              accessibilityLabel="Email"
              accessibilityHint="Enter your email address"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>
          {errors.email && (
            <ThemedText type="error" style={styles.inlineError}>
              {errors.email}
            </ThemedText>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="middleTitle" style={styles.fieldLabel}>
            {t("auth.fields.password")}
          </ThemedText>
          <View style={styles.inputRow}>
            <Feather
              name="lock"
              size={18}
              style={styles.inputIcon}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <TextInput
              secureTextEntry={!isPasswordVisible}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t("placeholders.password")}
              placeholderTextColor={theme.subText}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password"
              textContentType="password"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setIsPasswordVisible((prev) => !prev)}
              style={styles.passwordToggle}
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
            >
              <Feather
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={18}
                style={styles.inputIcon}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <ThemedText type="error" style={styles.inlineError}>
              {errors.password}
            </ThemedText>
          )}
          <View style={styles.forgotRow}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(auth)/forgot-password",
                  params: { email: email.trim() },
                })
              }
              style={styles.forgotButton}
              accessibilityRole="button"
              accessibilityLabel={t("auth.login.forgotPassword")}
              accessibilityHint={t("auth.login.openForgotPasswordHint")}
            >
              <Text style={styles.forgotText}>{t("auth.login.forgotPassword")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <View
            style={styles.errorBox}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <ThemedText type="error" style={{ textAlign: "center", color: theme.emergencyColor }}>
              {error}
            </ThemedText>
          </View>
        )}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={loading ? t("auth.login.loggingIn") : t("auth.login.submit")}
          accessibilityState={{ disabled: loading }}
          accessibilityHint={t("auth.login.submitHint")}
          style={[
            styles.submitButton,
            { opacity: loading ? 0.7 : 1, backgroundColor: loading ? theme.subText : theme.tint },
          ]}
        >
          {loading && <ActivityIndicator size="small" color="#fff" />}
          <Text style={styles.submitText}>
            {loading
              ? t("auth.login.loggingIn")
              : t("auth.login.submit")}
          </Text>
        </TouchableOpacity>

        <ThemedText type="subText" style={styles.helperText}>
          {t("auth.login.helper")}
        </ThemedText>
      </View>
      <View>
        <AuthLanguageSwitcher />
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: theme.bg }}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.container,
              { backgroundColor: theme.bg, flexGrow: 1 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {scrollContent}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: theme.bg }}
          contentContainerStyle={[
            styles.container,
            { backgroundColor: theme.bg, flexGrow: 1 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bottomOffset={24}
        >
          {scrollContent}
        </KeyboardAwareScrollView>
      )}
    </TouchableWithoutFeedback>
  );
}
