import Header from "@/components/layout/header";
import { apiClient } from "@/services/api";
import { authService } from "@/services/auth.service";
import type { StoreUser } from "@/store";
import { useStore } from "@/store";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import i18n from "i18next";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Appearance } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);
  const colorScheme = useStore((state) => state.colorScheme);
  const isHighContrast = useStore((state) => state.isHighContrast);
  const setColorScheme = useStore((state) => state.setColorScheme);
  const getAcceptLanguage = useStore((state) => state.getAcceptLanguage);
  const appLanguage = useStore((state) => state.appLanguage);

  // Sync stored language with i18n (after store rehydration)
  useEffect(() => {
    if (appLanguage && i18n.language !== appLanguage) {
      i18n.changeLanguage(appLanguage);
    }
  }, [appLanguage]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) setColorScheme(colorScheme as "light" | "dark");
    });

    return () => subscription.remove();
  }, [setColorScheme]);

  // Set language getter for API client
  useEffect(() => {
    apiClient.setLanguageGetter(() => getAcceptLanguage());
  }, [getAcceptLanguage]);

  // After login / app load: fetch profile and hydrate user + settings (per User Settings API)
  const profileFetchedRef = useRef(false);
  useEffect(() => {
    if (!user?.id || profileFetchedRef.current) return;
    let cancelled = false;
    profileFetchedRef.current = true;
    authService
      .getProfile()
      .then((response) => {
        if (cancelled) return;
        const store = useStore.getState();
        const name =
          response.firstName || response.lastName
            ? `${response.firstName ?? ""} ${response.lastName ?? ""}`.trim()
            : response.email?.split("@")[0] ?? "";
        const userData: StoreUser = {
          id: response.id,
          name,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          role: response.role,
          organizationId: response.organizationId ?? undefined,
          siteId: response.siteId ?? undefined,
          phoneNumber: response.phoneNumber,
          profilePicture: response.profilePicture,
          subjects: response.subjects,
          childName: response.childName,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
        };
        store.setUser(userData);
        if (response.currentProfile) {
          store.setCurrentProfile(response.currentProfile);
        }

        store.setUserSettingsFromProfile(response.settings);
        if (response.settings?.appLanguage) {
          store.setAppLanguage(response.settings.appLanguage);
        }
      })
      .catch(() => {
        profileFetchedRef.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Memoize userImage to prevent unnecessary re-renders
  const userImage = useMemo(() => {
    if (user?.profilePicture) {
      return { uri: user.profilePicture };
    }
    return { uri: "" };
  }, [user?.profilePicture]);

  // Memoize the header component to prevent infinite re-renders
  const renderHeader = useCallback(() => {
    return (
      <Header
        link={"/setting"}
        userImage={userImage}
        logo={
          colorScheme === "dark"
            ? require("./../../assets/images/LOGO-light.png")
            : require("./../../assets/images/LOGO-primary.png")
        }
      />
    );
  }, [userImage, colorScheme]);

  // Memoize screenOptions to prevent re-renders
  const screenOptions = useMemo(
    () => ({
      header: renderHeader,
    }),
    [renderHeader]
  );

  return (
    <SafeAreaProvider>
      <ThemeProvider
        value={{
          dark: true, // or true if you want dark mode
          colors: {
            primary: theme.tint,
            background: theme.bg,
            card: theme.bg,
            text: theme.text,
            border: theme.border,
            notification: theme.emergencyColor,
          },
          fonts: DefaultTheme.fonts,
        }}
      // value={colorScheme === 'dark' ? DarkTheme : MyTheme}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.bg }}
          edges={["right", "top", "left"]}
        >
          {/* <Stack>

                        <Stack.Screen name="(tabs)"
                            options={{
                                headerShown: true,
                                header: () => <Header
                                    link={'/setting'}
                                    userImage={require('./../../assets/images/user.jpeg')}
                                    logo={require('./../../assets/images/LOGO.jpeg')} />
                            }} />

                        <Stack.Screen name="resource/[id]" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="resource/[id]/rating" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />


                        <Stack.Screen name="timeline/[id]" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="sampleTimeline" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="chat/[chatID]" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="blocklist" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="ai-assisstant" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="emergency" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="new" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="create-or-edit-post" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="create-or-edit-event" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="create-group" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />



                        <Stack.Screen name="setting" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="user-profile" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="change-password" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="data-privacy" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="profile" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="event" options={{
                            headerShown: true,
                            header: () => <Header
                                link={'/setting'}
                                userImage={require('./../../assets/images/user.jpeg')}
                                logo={require('./../../assets/images/LOGO.jpeg')} />
                        }} />

                        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                        <Stack.Screen name="+not-found" options={{ headerShown: true, header: () => <Header link={'/setting'} userImage={require('./../../assets/images/user.jpeg')} logo={require('./../../assets/images/LOGO.jpeg')} /> }} />

                    </Stack> */}
          <Stack screenOptions={screenOptions} />
          <StatusBar
            style={colorScheme === "dark" || isHighContrast ? "light" : "dark"}
            animated={true}
            hideTransitionAnimation="slide"
            backgroundColor={theme.bg}
          />
        </SafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
