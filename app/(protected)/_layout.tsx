import Header from "@/components/layout/header";
import { apiClient } from "@/services/api";
import { useStore } from "@/store";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import i18n from "i18next";
import { useCallback, useEffect, useMemo } from "react";
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
