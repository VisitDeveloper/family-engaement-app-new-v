import RoleGuard from "@/components/check-permisions";
import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import { Colors } from "@/constants/theme";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

// const { width: screenWidth } = Dimensions.get("window");
// const CONTENT_WIDTH = Math.min(420, screenWidth - 32); // responsive central column

const LANGUAGE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "Spanish", value: "es" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const theme = useStore((state) => state.theme);
  const isHighContrast = useStore((state) => state.isHighContrast);
  const toggleHighContrast = useStore((state) => state.toggleHighContrast);
  const colorScheme = useStore((state) => state.colorScheme);
  const setColorScheme = useStore((state) => state.setColorScheme);
  const user = useStore((state) => state.user);

  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [textMessages, setTextMessages] = useState(false);
  const [urgentAlerts, setUrgentAlerts] = useState(true);

  const isLargeFont = useStore((state) => state.isLargeFont);
  const toggleLargeFont = useStore((state) => state.toggleLargeFont);

  const voiceEnabled = useStore((state) => state.voiceNarrationEnabled);
  const toggleVoice = useStore((state) => state.toggleVoiceNarration);
  const speak = useStore((state) => state.speak);
  const setLoggedIn = useStore((s) => s.setLoggedIn);
  const setRole = useStore((s) => s.setRole);
  const setUser = useStore((s) => s.setUser);
  const appLanguage = useStore((state) => state.appLanguage);
  const setAppLanguage = useStore((state) => state.setAppLanguage);
  const [tone, setTone] = useState("Default");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [lang, setLang] = useState<OptionsList[]>(() => {
    const opt = LANGUAGE_OPTIONS.find((o) => o.value === (appLanguage || "en"));
    return opt ? [opt] : [LANGUAGE_OPTIONS[0]];
  });

  // Sync lang with appLanguage from store
  useEffect(() => {
    if (appLanguage) {
      const selectedOption = LANGUAGE_OPTIONS.find(
        (opt) => opt.value === appLanguage
      );
      if (selectedOption) {
        setLang([selectedOption]);
      }
    }
  }, [appLanguage]);

  const handleLogout = async () => {
    Alert.alert(
      t("settings.logoutConfirmTitle"),
      t("settings.logoutConfirmMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.logout"),
        style: "destructive",
        onPress: async () => {
          setLogoutLoading(true);
          try {
            // Call logout service to clear token
            await authService.logout();

            // Clear state
            setLoggedIn(false);
            setRole(null);
            setUser(null);

            // Redirect to login page
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Logout error:", error);
            // Even if an error occurs, clear the state
            setLoggedIn(false);
            setRole(null);
            setUser(null);
            router.replace("/(auth)/login");
          } finally {
            setLogoutLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container]}>
      <HeaderInnerPage
        title={t("settings.title")}
        subTitle={t("settings.subTitle")}
        addstyles={{ marginBottom: 0 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: 10,
          paddingTop: 20,
        }}
      >
        {/* Profile Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.bg, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push("/user-profile")}
            style={styles.profileRow}
          >
            <Image
              source={{
                uri: user?.profilePicture ? user.profilePicture : "",
              }}
              style={styles.avatar}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText type="subtitle" style={{ color: theme.text }}>
                {user?.firstName + " " + user?.lastName || "User"}
              </ThemedText>

              {user?.childName ? (
                <ThemedText
                  type="subText"
                  style={[styles.role, { color: theme.subText }]}
                >
                  {user?.childName ? user.childName : ""}
                </ThemedText>
              ) : (
                ""
              )}
            </View>
            <View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.subText}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.bg, borderColor: theme.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Feather name="bell" size={20} color={theme.text} />
            <ThemedText
              type="middleTitle"
              style={[styles.cardTitle, { color: theme.text }]}
            >
              {t("settings.notifications")}
            </ThemedText>
          </View>

          {/* Push */}
          <View style={[styles.row]}>
            <View style={{ flex: 1 }}>
              <ThemedText type="middleTitle" style={{ color: theme.text }}>
                {t("settings.pushNotifications")}
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.rowSubtitle, { color: theme.subText }]}
              >
                {t("settings.pushNotificationsDesc")}
              </ThemedText>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={pushNotifs ? "#fff" : "#fff"}
            />
          </View>

          {/* Email */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText type="middleTitle" style={{ color: theme.text }}>
                {t("settings.emailNotifications")}
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.rowSubtitle, { color: theme.subText }]}
              >
                {t("settings.emailNotificationsDesc")}
              </ThemedText>
            </View>
            <Switch
              value={emailNotifs}
              onValueChange={setEmailNotifs}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={emailNotifs ? "#fff" : "#fff"}
            />
          </View>

          {/* Text Messages */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText type="middleTitle" style={{ color: theme.text }}>
                {t("settings.textMessages")}
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.rowSubtitle, { color: theme.subText }]}
              >
                {t("settings.textMessagesDesc")}
              </ThemedText>
            </View>
            <Switch
              value={textMessages}
              onValueChange={setTextMessages}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={textMessages ? "#fff" : "#fff"}
            />
          </View>

          <View style={styles.separator} />

          {/* Urgent Alerts */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons
                  name="error-outline"
                  size={18}
                  color={theme.emergencyColor}
                />
                <ThemedText
                  type="middleTitle"
                  style={{ color: theme.text, marginLeft: 8 }}
                >
                  {t("settings.urgentAlerts")}
                </ThemedText>
              </View>
              <ThemedText
                type="subText"
                style={[styles.rowSubtitle, { color: theme.subText }]}
              >
                {t("settings.urgentAlertsDesc")}
              </ThemedText>
            </View>
            <Switch
              value={urgentAlerts}
              onValueChange={setUrgentAlerts}
              trackColor={{ false: "#ccc", true: theme.emergencyColor }}
              thumbColor={urgentAlerts ? "#fff" : "#fff"}
            />
          </View>

          {/* Alert tone select (styled like a dropdown) */}
          <View style={[styles.selectRow]}>
            <ThemedText
              type="middleTitle"
              style={[styles.selectLabel, { color: theme.text }]}
            >
              {t("settings.alertTone")}
            </ThemedText>

            <SelectBox
              options={[
                {
                  label: "Tone 1",
                  value: "1",
                },
                {
                  label: "Tone 2",
                  value: "2",
                },
              ]}
              value={tone}
              onChange={setTone}
              title={t("settings.listOfAlertTone")}
            />

            {/* <Dropdown
                                options={["Default", "Tone 1", "Tone 2", "Tone 3"]}
                                value={tone}
                                onChange={setTone} /> */}
          </View>
        </View>

        {/* Language & Accessibility Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.bg, borderColor: theme.border },
          ]}
        >
          <View style={[styles.cardHeaderSmall]}>
            <Feather name="globe" size={20} color={theme.text} />
            <ThemedText
              type="middleTitle"
              style={[styles.cardTitle, { color: theme.text }]}
            >
              {t("settings.languageAndAccessibility")}
            </ThemedText>
          </View>

          {/* App Language */}
          <View style={[styles.selectRow]}>
            <ThemedText
              type="middleTitle"
              style={[styles.selectLabel, { color: theme.text }]}
            >
              {t("settings.appLanguage")}
            </ThemedText>

            <SelectBox
              options={LANGUAGE_OPTIONS.map((o) => ({
                label: t(`languages.${o.value}`),
                value: o.value,
              }))}
              value={appLanguage || lang[0].value}
              onChange={(val) => {
                const selectedOption = LANGUAGE_OPTIONS.find(
                  (opt) => opt.value === val
                );
                if (selectedOption) {
                  setLang([{ ...selectedOption, label: t(`languages.${selectedOption.value}`) }]);
                  setAppLanguage(selectedOption.value);
                  i18n.changeLanguage(selectedOption.value);
                }
              }}
              title={t("settings.listOfLanguage")}
            />
          </View>

          <View style={styles.separatorSmall} />

          {/* Dark Mode */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText type="middleTitle" style={{ color: theme.text }}>
                {t("settings.darkMode")}
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.rowSubtitle, { color: theme.subText }]}
              >
                {t("settings.darkModeDesc")}
              </ThemedText>
            </View>
            <Switch
              value={colorScheme === "dark"}
              onValueChange={(value) => {
                setColorScheme(value ? "dark" : "light");
              }}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={colorScheme === "dark" ? "#fff" : "#fff"}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText
                type="middleTitle"
                style={{ color: theme.text }}
                readString="Change Font Size"
              >
                {t("settings.largeFont")}
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.rowSubtitle, { color: theme.subText }]}
                readString="Increase text size for better readability"
              >
                {t("settings.largeFontDesc")}
              </ThemedText>
            </View>
            <Switch
              value={isLargeFont}
              onValueChange={toggleLargeFont}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={isLargeFont ? "#fff" : "#fff"}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText type="middleTitle" style={{ color: theme.text }}>
                {t("settings.highContrastMode")}
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.rowSubtitle, { color: theme.subText }]}
              >
                {t("settings.highContrastModeDesc")}
              </ThemedText>
            </View>
            <Switch
              value={isHighContrast}
              onValueChange={toggleHighContrast}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={isHighContrast ? "#fff" : "#fff"}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText type="middleTitle" style={{ color: theme.text }}>
                {t("settings.voiceNarration")}
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.rowSubtitle, { color: theme.subText }]}
              >
                {t("settings.voiceNarrationDesc")}
              </ThemedText>
            </View>

            <Switch
              value={voiceEnabled}
              onValueChange={toggleVoice}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={voiceEnabled ? "#fff" : "#fff"}
            />
          </View>
        </View>

        {/* Data Security */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.bg, borderColor: theme.border },
          ]}
        >
          <View style={[styles.cardHeaderSmall]}>
            <MaterialIcons name="security" size={20} color={theme.text} />
            <ThemedText
              type="middleTitle"
              style={[styles.cardTitle, { color: theme.text }]}
            >
              {t("settings.privacyAndSecurity")}
            </ThemedText>
          </View>

          <View
            style={[styles.dataSecuritySection, { borderColor: theme.border }]}
          >
            <AntDesign
              name="lock"
              size={16}
              color={theme.text}
              style={{ paddingTop: 2 }}
            />
            <ThemedText
              type="subText"
              style={[
                styles.dataSecurityDescription,
                { color: theme.text, flex: 1, paddingVertical: 0 },
              ]}
            >
              {t("settings.privacyDescription")}
            </ThemedText>
          </View>

          <RoleGuard roles={["admin", "teacher"]}>
            <TouchableOpacity
              style={[
                styles.dataSecurityLink,
                { borderColor: theme.border, backgroundColor: theme.panel },
              ]}
            >
              {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
              <ThemedText
                type="subText"
                style={{
                  color: theme.text,
                  fontWeight: "bold",
                  paddingHorizontal: 10,
                }}
              >
                {t("settings.familyMemberPermissions")}
              </ThemedText>
              <AntDesign name="right" size={16} color={theme.text} />
            </TouchableOpacity>
          </RoleGuard>

          <TouchableOpacity
            onPress={() => router.push("/data-privacy")}
            style={[
              styles.dataSecurityLink,
              { borderColor: theme.border, backgroundColor: theme.panel },
            ]}
          >
            {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
            <ThemedText
              type="subText"
              style={{
                color: theme.text,
                fontWeight: "bold",
                paddingHorizontal: 10,
              }}
            >
              {t("settings.dataAndPrivacyPolicy")}
            </ThemedText>
            <AntDesign name="right" size={16} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/blocklist")}
            style={[
              styles.dataSecurityLink,
              { borderColor: theme.border, backgroundColor: theme.panel },
            ]}
          >
            {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
            <ThemedText
              type="subText"
              style={{
                color: theme.text,
                fontWeight: "bold",
                paddingHorizontal: 10,
              }}
            >
              {t("settings.blockUnblockContacts")}
            </ThemedText>
            <AntDesign name="right" size={16} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* accont manager  */}
        <RoleGuard roles={["admin", "teacher"]}>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <View style={[styles.cardHeaderSmall]}>
              <Feather name="users" size={20} color={theme.text} />
              <ThemedText
                type="middleTitle"
                style={[styles.cardTitle, { color: theme.text }]}
              >
                {t("settings.accountManagement")}
              </ThemedText>
            </View>

            <TouchableOpacity
              onPress={() => speak(t("settings.addFamilyMember"))}
              style={[
                styles.dataSecurityLink,
                { borderColor: theme.border, backgroundColor: theme.panel },
              ]}
            >
              {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
              <ThemedText
                type="subText"
                style={{
                  color: theme.text,
                  fontWeight: "bold",
                  paddingHorizontal: 10,
                }}
              >
                {t("settings.addFamilyMember")}
              </ThemedText>
              <AntDesign name="right" size={16} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dataSecurityLink,
                { borderColor: theme.border, backgroundColor: theme.panel },
              ]}
            >
              {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
              <ThemedText
                type="subText"
                style={{
                  color: theme.text,
                  fontWeight: "bold",
                  paddingHorizontal: 10,
                }}
              >
                {t("settings.manageChildren")}
              </ThemedText>
              <AntDesign name="right" size={16} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dataSecurityLink,
                { borderColor: theme.border, backgroundColor: theme.panel },
              ]}
            >
              {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
              <ThemedText
                type="subText"
                style={{
                  color: theme.text,
                  fontWeight: "bold",
                  paddingHorizontal: 10,
                }}
              >
                {t("settings.exportData")}
              </ThemedText>
              <AntDesign name="download" size={16} color={theme.text} />
            </TouchableOpacity>
          </View>
        </RoleGuard>

        {/* Copyright */}
        <View
          style={{
            height: 120,
            backgroundColor: theme.bg,
            borderColor: theme.border,
            borderWidth: 1,
            padding: 10,
            borderRadius: 10,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText
            type="middleTitle"
            style={[styles.cardTitle, { color: theme.text }]}
          >
            {t("settings.familyConnect")}
          </ThemedText>
          <ThemedText type="subText" style={{ color: theme.subText }}>
            {t("settings.version")} 2.1.0
          </ThemedText>
          <View
            style={{
              width: "80%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 5,
              marginTop: 15,
            }}
          >
            <ThemedText
              type="default"
              style={{ color: theme.subText, fontWeight: "600" }}
            >
              {t("common.support")}
            </ThemedText>
            <ThemedText
              type="default"
              style={{ color: theme.subText, fontWeight: "600" }}
            >
              {t("common.termsOfService")}{" "}
            </ThemedText>
          </View>
        </View>

        <View>
          <TouchableOpacity
            style={{
              gap: 10,
              borderColor: Colors.light.tint,
              marginTop: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
              borderWidth: 1,
              // borderColor: theme.emergencyColor,
              borderRadius: 10,
              backgroundColor: logoutLoading
                ? theme.subText
                : Colors.light.tint,
              opacity: logoutLoading ? 0.6 : 1,
            }}
            onPress={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="logout" size={20} color="#fff" />
            )}
            <ThemedText
              type="text"
              style={{
                color: "#fff",
                fontWeight: "bold",
                paddingHorizontal: 10,
              }}
            >
              {logoutLoading ? t("common.loggingOut") : t("common.logout")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  headerRow: {
    paddingVertical: 16,
    // paddingHorizontal:-10,
    borderBottomWidth: 1,
    marginBottom: 18,
    // borderRadius: 8,
  },
  headerLeft: {
    position: "absolute",
    left: 8,
    top: 28,
  },
  headerTitleWrap: {
    // alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: 50,
    paddingHorizontal: 12,
  },
  headerSubtitle: {
    marginTop: 6,
  },

  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 2,
    borderWidth: 1,
    // Fix: Remove reference to undefined 'theme', use a safe default color.
    borderColor: "#ccc",
  },
  role: { marginTop: 4 },

  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12 },

  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardHeaderSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  cardTitle: { marginLeft: 10 },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowSubtitle: { marginTop: 6 },

  dataSecuritySection: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
    padding: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  dataSecurityDescription: {
    lineHeight: 15,
    // paddingHorizontal: 5,
    textAlign: "justify",
    // marginHorizontal: 20,
  },
  dataSecurityLink: {
    paddingVertical: 10,
    borderWidth: 1,
    marginVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
  },

  separator: {
    height: 1,
    backgroundColor: "#e6e6e6",
    marginVertical: 12,
    borderRadius: 1,
  },
  separatorSmall: { height: 1, backgroundColor: "#e9e9e9", marginVertical: 8 },

  selectRow: {
    marginTop: 12,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  selectLabel: { marginBottom: 6 },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#eee",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#333",
  },
});
