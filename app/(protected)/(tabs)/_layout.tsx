import { HapticTab } from '@/components/haptic-tab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { DashboardIcon, MessagesIcon, ResourcesIcon, TimelineIcon } from '@/components/ui/icons/tab-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStore } from '@/store';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = useStore(state => state.theme);
  const role = useStore(state => state.role);
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
            fontSize: 12,        // 🔹 Size of text under icon
            fontWeight: '600',
            paddingBottom: 2
          },
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
              height: 90,          // 🔹 Total tab bar height
              paddingBottom: 10,   // 🔹 Spacing from bottom
              paddingTop: 5,
              borderTopWidth: 1,
              paddingHorizontal: 8,
              borderTopColor: theme.border,
            },
            default: {
              height: 90,          // 🔹 Total tab bar height
              paddingBottom: 10,   // 🔹 Spacing from bottom
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
            title: t('tabs.tabBarMessages'),
            tabBarIcon: ({ color }) => <MessagesIcon color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            title: t('tabs.tabBarTimeline'),
            tabBarIcon: ({ color }) => <TimelineIcon color={color} size={24} />,
          }}
        />

        <Tabs.Screen
          name={"dashboard"}
          options={{
            title: t('tabs.tabBarDashboard'),
            tabBarIcon: ({ color }) => <DashboardIcon color={color} size={24} />,
          }}
        />

        <Tabs.Screen
          name="resources"
          options={{
            title: t('tabs.tabBarResources'),
            tabBarIcon: ({ color }) => <ResourcesIcon color={color} size={24} />,
          }}
        />
      </Tabs>
    </View>
  );
}
