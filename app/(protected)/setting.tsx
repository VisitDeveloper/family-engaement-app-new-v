import RoleGuard from "@/components/check-permisions";
import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const CONTENT_WIDTH = Math.min(420, screenWidth - 32); // responsive central column

export default function SettingsScreen() {
  const router = useRouter();

  const theme = useStore((state) => state.theme);
  const isHighContrast = useStore((state) => state.isHighContrast);
  const toggleHighContrast = useStore((state) => state.toggleHighContrast);
  const colorScheme = useStore((state) => state.colorScheme);
  const setColorScheme = useStore((state) => state.setColorScheme);
  const user = useStore((state) => state.user);
  const role = useStore((state) => state.role);

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
  const [lang, setLang] = useState<OptionsList[]>([
    {
      label: "English",
      value: appLanguage || "en",
    },
  ]);

  // همگام‌سازی lang با appLanguage از store
  useEffect(() => {
    if (appLanguage) {
      const languageOptions = [
        { label: "English", value: "en" },
        { label: "فارسی", value: "fa" },
      ];
      const selectedOption = languageOptions.find(
        (opt) => opt.value === appLanguage
      );
      if (selectedOption) {
        setLang([selectedOption]);
      }
    }
  }, [appLanguage]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLogoutLoading(true);
          try {
            // فراخوانی سرویس logout برای پاک کردن token
            await authService.logout();

            // پاک کردن state
            setLoggedIn(false);
            setRole(null);
            setUser(null);

            // هدایت به صفحه login
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Logout error:", error);
            // حتی اگر خطا رخ دهد، state را پاک می‌کنیم
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
    <View style={[styles.page, { backgroundColor: theme.bg }]}>
      <View style={[styles.container, { width: CONTENT_WIDTH }]}>
        <HeaderInnerPage
          title="Settings"
          subTitle="Manage your app preferences and account"
          addstyles={{ marginBottom: 20 }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
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
                <ThemedText
                  type="subText"
                  style={[styles.role, { color: theme.subText }]}
                >
                  {role
                    ? `${role.charAt(0).toUpperCase() + role.slice(1)}`
                    : "No role assigned"}{" "}
                  {user?.childName ? ` - ${user.childName}` : ""}
                </ThemedText>
                {user?.subjects && user.subjects.length > 0 ? (
                  <View style={styles.tagsContainer}>
                    {user.subjects.map((subject, index) => (
                      <View key={index} style={styles.tag}>
                        <ThemedText type="subText" style={styles.tagText}>
                          {subject}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
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
                Notifications
              </ThemedText>
            </View>

            {/* Push */}
            <View style={[styles.row]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="middleTitle" style={{ color: theme.text }}>
                  Push Notifications
                </ThemedText>
                <ThemedText
                  type="subText"
                  style={[styles.rowSubtitle, { color: theme.subText }]}
                >
                  Receive notifications on your device
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
                  Email Notifications
                </ThemedText>
                <ThemedText
                  type="subText"
                  style={[styles.rowSubtitle, { color: theme.subText }]}
                >
                  Get updates via email
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
                  Text Messages
                </ThemedText>
                <ThemedText
                  type="subText"
                  style={[styles.rowSubtitle, { color: theme.subText }]}
                >
                  SMS alerts for important updates
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
                    Urgent Alerts
                  </ThemedText>
                </View>
                <ThemedText
                  type="subText"
                  style={[styles.rowSubtitle, { color: theme.subText }]}
                >
                  Emergency broadcasts & safety alerts
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
                Alert Tone
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
                title="List of Alert Tone"
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
                Language & Accessibility
              </ThemedText>
            </View>

            {/* App Language */}
            <View style={[styles.selectRow]}>
              <ThemedText
                type="middleTitle"
                style={[styles.selectLabel, { color: theme.text }]}
              >
                App Language
              </ThemedText>

              <SelectBox
                options={[
                  { label: "English", value: "en" },
                  { label: "French", value: "fr" },
                  { label: "Spanish", value: "es" },
                ]}
                value={appLanguage || lang[0].value} // استفاده از زبان از store
                onChange={(val) => {
                  const selectedOption = [
                    { label: "English", value: "en" },
                    { label: "French", value: "fr" },
                    { label: "Spanish", value: "es" },
                  ].find((opt) => opt.value === val);

                  if (selectedOption) {
                    setLang([selectedOption]); // برای نمایش محلی
                    setAppLanguage(selectedOption.value); // ذخیره در store
                  }
                }}
                title="List of Language"
              />
            </View>

            <View style={styles.separatorSmall} />

            {/* Dark Mode */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <ThemedText type="middleTitle" style={{ color: theme.text }}>
                  Dark Mode
                </ThemedText>
                <ThemedText
                  type="subText"
                  style={[styles.rowSubtitle, { color: theme.subText }]}
                >
                  Switch between light and dark theme
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
                  Large Font
                </ThemedText>
                <ThemedText
                  type="subText"
                  style={[styles.rowSubtitle, { color: theme.subText }]}
                  readString="Increase text size for better readability"
                >
                  Increase text size for better readability
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
                  High Contrast Mode
                </ThemedText>
                <ThemedText
                  type="subText"
                  style={[styles.rowSubtitle, { color: theme.subText }]}
                >
                  Enhanced visibility for better reading
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
                  Voice Narration
                </ThemedText>
                <ThemedText
                  type="subText"
                  style={[styles.rowSubtitle, { color: theme.subText }]}
                >
                  Read messages and content aloud
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
                Privacy & Security
              </ThemedText>
            </View>

            <View
              style={[
                styles.dataSecuritySection,
                { borderColor: theme.border },
              ]}
            >
              <AntDesign name="lock" size={16} color={theme.text} />
              <ThemedText
                type="subText"
                style={[styles.dataSecurityDescription, { color: theme.text }]}
              >
                his app does not intend to collect PII or securing sensitive
                personal data. All communications are for educational purposes
                only.
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
                  Family Member Permissions
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
                {" "}
                Data & Privacy Policy
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
                Block/Unblock Contacts
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
                  Account Management
                </ThemedText>
              </View>

              <TouchableOpacity
                onPress={() => speak(`Add Family Member`)}
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
                  Add Family Member
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
                  Manage Children
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
                  Export Data
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
              Family Connect
            </ThemedText>
            <ThemedText type="subText" style={{ color: theme.subText }}>
              Version 2.1.0
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
                Support
              </ThemedText>
              <ThemedText
                type="default"
                style={{ color: theme.subText, fontWeight: "600" }}
              >
                Terms of Service{" "}
              </ThemedText>
            </View>
          </View>

          <View>
            <TouchableOpacity
              style={{
                marginTop: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: theme.emergencyColor,
                borderRadius: 10,
                backgroundColor: logoutLoading
                  ? theme.subText
                  : theme.emergencyColor,
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
                {logoutLoading ? "Logging out..." : "Logout"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 10, paddingTop: 0 },
  container: {
    alignSelf: "center",
    marginBottom: 30,
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
    padding: 5,
    flexDirection: "row",
    gap: 5,
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  dataSecurityDescription: {
    lineHeight: 15,
    paddingHorizontal: 5,
    textAlign: "justify",
    marginHorizontal: 20,
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
