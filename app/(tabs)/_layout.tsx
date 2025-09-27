import { HapticTab } from '@/components/haptic-tab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStore } from '@/store';
import { Feather, FontAwesome, FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useStore(state => state.theme);

  return (
    <View style={{ flex: 1, height: 80 }}>

      <Tabs
        screenOptions={{
          // lazy: false,
          animation: 'shift',
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarActiveBackgroundColor: colorScheme === 'dark' ? 'transparent' : Colors.light.tabActivationBackground,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarVisibilityAnimationConfig: {
            show: {
              animation: 'spring',
              config: {
                damping: 5,
              },
            },
            hide: {
              animation: 'spring',
              config: {
                damping: 5,
              },
            },
          },
          tabBarBadgeStyle: {
            padding: 2
          },
          tabBarItemStyle: {
            width: 60,
            height: 60,
            marginHorizontal: 4,
            borderRadius: 8,
            padding: 1,
            overflow: 'hidden',
            // borderWidth: 1,
            // borderColor: theme.tint 
          },
          tabBarLabelStyle: {
            fontSize: 12,        // 🔹 سایز نوشته زیر آیکن
            fontWeight: '600',
            paddingBottom: 2
          },
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
              height: 90,          // 🔹 ارتفاع کل tab bar
              paddingBottom: 10,   // 🔹 فاصله از پایین
              paddingTop: 5,
              borderTopWidth: 1,
              paddingHorizontal: 8,
              borderTopColor: theme.border,
            },
            default: {
              height: 90,          // 🔹 ارتفاع کل tab bar
              paddingBottom: 10,   // 🔹 فاصله از پایین
              paddingTop: 5,
              borderTopWidth: 1,
              paddingHorizontal: 8,
              borderTopColor: theme.border,
            },
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color }) => <FontAwesome6 name="message" size={24} color={color} />,
            // 
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            title: 'Timeline',
            tabBarIcon: ({ color }) => <FontAwesome name="picture-o" size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <Feather name="bar-chart" size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="resources"
          options={{
            title: 'Resources',
            tabBarIcon: ({ color }) => <Ionicons name="book-outline" size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
