import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useValidation } from "@/hooks/use-validation";
import { ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function LoginScreen() {
  const setLoggedIn = useStore((s) => s.setLoggedIn);
  const router = useRouter();
  const theme = useStore((state) => state.theme);

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const anim = useRef(new Animated.Value(0)).current; // 0 → login | 1 → register

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { errors, validate } = useValidation({
    email: {
      required: true,
      maxLength: 100,
      minLength: 5,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { required: true, maxLength: 100, minLength: 6 },
    // confirmPassword: { required: activeTab === "register", minLength: 6, equalTo: password, },
    confirmPassword:
      activeTab === "register"
        ? { required: true, minLength: 6, equalTo: password }
        : {},
  });

  const toggleSwitch = (tab: "login" | "register") => {
    setActiveTab(tab);

    Animated.timing(anim, {
      toValue: tab === "login" ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleLogin = async () => {
    setError(null);
    const isValid = validate({ email, password, confirmPassword });

    if (!isValid) return;

    setLoading(true);

    try {
      if (activeTab === "login") {
        const response = await authService.login({ email, password });

        // تعیین نقش از پاسخ API یا از ایمیل (fallback)
        let detectedRole: "admin" | "teacher" | "parent" | null = null;

        if (response.user?.role) {
          detectedRole = response.user.role;
        } else {
          detectedRole = "parent";
        }

        // ذخیره user و role - ذخیره تمام اطلاعات user از API
        if (response.user) {
          
          console.log("response.user", response.user);
          useStore.getState().setUser({
            // @ts-ignore
            id: response.user.id,
            name:
              // response.user.name ||
              response.user.firstName ||
              response.user.lastName
                ? `${response.user.firstName || ""} ${
                    response.user.lastName || ""
                  }`.trim()
                : email.split("@")[0],
            // @ts-ignore
            email: response.user.email || email,
            // role: response.user.role || detectedRole || null,
            profilePicture: response.user.profilePicture,
            childName: response.user.childName,
            ...response.user, // ذخیره تمام فیلدهای اضافی
          });
        } else {
          // اگر API user برنگرداند، حداقل اطلاعات اولیه را ذخیره می‌کنیم
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
        router.replace("/(protected)/(tabs)");
      } else {
        // Register
        const response = await authService.register({
          email,
          password,
          confirmPassword,
        });

        // بعد از ثبت‌نام موفق، کاربر را لاگین می‌کنیم
        let detectedRole: "admin" | "teacher" | "parent" | undefined = undefined;

        if (response.user?.role) {
          detectedRole = response.user.role;
        }

        // ذخیره user و role - ذخیره تمام اطلاعات user از API
        if (response.user) {
          useStore.getState().setUser({
            // @ts-ignore
            id: response.user.id,
            name:
              // response.user.name ||
              response.user.firstName ||
              response.user.lastName
                ? `${response.user.firstName || ""} ${
                    response.user.lastName || ""
                  }`.trim()
                : email.split("@")[0],
            // @ts-ignore
            email: response.user.email || email,
            // role: response.user.role || detectedRole || undefined,
            profilePicture: response.user.profilePicture,
            ...response.user, // ذخیره تمام فیلدهای اضافی
          });
        } else {
          // اگر API user برنگرداند، حداقل اطلاعات اولیه را ذخیره می‌کنیم
          useStore.getState().setUser({
            id: email,
            name: email.split("@")[0],
            email: email,
            role: detectedRole || undefined,
          });
        }

        if (detectedRole) {
          useStore.getState().setRole(detectedRole);
        }

        setLoggedIn(true);
        router.replace("/(protected)/(tabs)");
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.message || "An error occurred. Please try again.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // toggle translation
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150], // width of each side
  });

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    switchContainer: {
      width: 300,
      height: 45,
      borderRadius: 10,
      borderWidth: 2,
      flexDirection: "row",
      overflow: "hidden",
      marginBottom: 10,
    },
    switchThumb: {
      position: "absolute",
      width: 150,
      height: "100%",
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
    },
    switchZone: {
      width: 150,
      justifyContent: "center",
      alignItems: "center",
    },
    switchText: {
      fontSize: 18,
      fontWeight: "600",
      color: "#999",
    },
    hiddenText: {
      color: "transparent",
    },
    switchThumbText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "white",
    },
    element: {
      borderWidth: 1,
      width: "90%",
      height: "70%",
      padding: 20,
      borderRadius: 10,
      marginTop: 10,
    },
    messageBox: {
      flexDirection: "column",
      marginTop: 20,
    },
    messageInput: {
      backgroundColor: t.panel,
      borderRadius: 10,
      padding: 5,
      borderWidth: 1,
      borderColor: t.border,
      height: 40,
      textAlignVertical: "center",
      marginBottom: 5,
      color: t.text,
    },
    charCount: { color: theme.subText, textAlign: "right" },
  }));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* LOGIN BOX */}
        <View style={[styles.element, { borderColor: theme.border }]}>
          <View>
            <Image
              source={require("./../../assets/images/LOGO.jpeg")}
              style={{
                width: 100,
                height: 50,
                alignSelf: "center",
                marginBottom: 5,
              }}
              // resizeMode="contain"
            />
          </View>
          <View style={[styles.switchContainer, { borderColor: theme.border }]}>
            {/* MOVING TOGGLE */}
            <Animated.View
              style={[
                styles.switchThumb,
                {
                  backgroundColor: theme.tint,
                  transform: [{ translateX }],
                },
              ]}
            >
              <Text style={styles.switchThumbText}>
                {activeTab === "login" ? "Login" : "Register"}
              </Text>
            </Animated.View>

            {/* CLICKABLE ZONES */}
            <TouchableOpacity
              style={styles.switchZone}
              onPress={() => toggleSwitch("login")}
            >
              <Text
                style={[
                  styles.switchText,
                  activeTab === "login" && styles.hiddenText,
                ]}
              >
                Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchZone}
              onPress={() => toggleSwitch("register")}
            >
              <Text
                style={[
                  styles.switchText,
                  activeTab === "register" && styles.hiddenText,
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          <ThemedText
            type="middleTitle"
            style={{
              marginBottom: 5,
              fontWeight: 500,
              color: theme.text,
              textAlign: "center",
            }}
          >
            Where Families Come Together.
          </ThemedText>

          <View style={styles.messageBox}>
            <ThemedText
              type="middleTitle"
              style={{ marginBottom: 10, fontWeight: 500, color: theme.text }}
            >
              Email
            </ThemedText>

            <TextInput
              style={styles.messageInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Please insert your email"
              placeholderTextColor={theme.subText}
            />
            {errors.email && (
              <ThemedText type="error">{errors.email}</ThemedText>
            )}
          </View>

          <View style={styles.messageBox}>
            <ThemedText
              type="middleTitle"
              style={{ marginBottom: 10, fontWeight: 500, color: theme.text }}
            >
              Password
            </ThemedText>

            <TextInput
              secureTextEntry={true}
              style={styles.messageInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Please insert your password"
              placeholderTextColor={theme.subText}
            />
            {errors.password && (
              <ThemedText type="error">{errors.password}</ThemedText>
            )}
          </View>

          {activeTab === "register" && (
            <View style={styles.messageBox}>
              <ThemedText
                type="middleTitle"
                style={{ marginBottom: 10, fontWeight: 500, color: theme.text }}
              >
                Confirm Password
              </ThemedText>

              <TextInput
                secureTextEntry={true}
                style={styles.messageInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Please insert your confirm password"
                placeholderTextColor={theme.subText}
              />
              {errors.confirmPassword && (
                <ThemedText type="error">{errors.confirmPassword}</ThemedText>
              )}
            </View>
          )}

          {error && (
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
          )}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              paddingHorizontal: 30,
              paddingVertical: 12,
              backgroundColor: loading ? theme.subText : theme.tint,
              borderRadius: 10,
              marginTop: 40,
              alignSelf: "center",
              opacity: loading ? 0.6 : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            {loading && <ActivityIndicator size="small" color="#fff" />}
            <Text style={{ color: "#fff", fontSize: 18 }}>
              {loading
                ? activeTab === "login"
                  ? "Logging in..."
                  : "Registering..."
                : activeTab === "login"
                ? "Login"
                : "Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
