import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import StatCard from "@/components/reptitive-component/stat-card-admin";
import { ThemedText } from "@/components/themed-text";
import { ChartLineUptrendIcon, Person2FillIcon } from "@/components/ui/icons/dashboard.icons";
import { MediaIcon } from "@/components/ui/icons/messages-icons";
import { DownloadIcon } from "@/components/ui/icons/settings-icons";
import { MessagesIcon } from "@/components/ui/icons/tab-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store"; // The same Zustand store that returns theme
import { Redirect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Dashboard() {
  const { t } = useTranslation();
  const { theme } = useStore((state) => state);
  const role = useStore((state) => state.role);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Dashboard data is static for now; replace with API call when available
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const teachers = [
    { name: "Ms. Alvarez", posts: 23, responses: 18, rate: 95 },
    { name: "Mr. Rodriguez", posts: 19, responses: 16, rate: 88 },
    { name: "Ms. Chen", posts: 21, responses: 19, rate: 92 },
    { name: "Mr. Thompson", posts: 15, responses: 12, rate: 85 },
  ];

  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
      paddingHorizontal: 0,
      backgroundColor: theme.bg,
      marginBottom: Platform.OS === "ios" ? 90 : 0,
    },
    containerScrollView: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingVertical: 15,
      paddingHorizontal: 10,
    },
    headerWrap: {
      borderBottomWidth: 1,
      paddingBottom: 5,
      paddingHorizontal: 10,
      //   marginBottom: 10,
    },
    row: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    card: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "700",
    },
    statLabel: {
      fontSize: 14,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
    },
    teacherRow: {
      marginBottom: 12,
    },
    teacherName: {
      fontWeight: "600",
      fontSize: 14,
    },
    teacherStats: {
      fontSize: 12,
      marginBottom: 4,
    },
    progressBar: {
      height: 6,
      borderRadius: 6,
      overflow: "hidden",
    },
    progressFill: {
      height: 6,
      borderRadius: 6,
    },
  }));

  if (role === "parent") {
    return <Redirect href="/(protected)/(tabs)/dashboard/parent-dashboard" />;
  }

  return (
    <View style={styles.container}>
      {/* <View style={[styles.headerWrap, { borderBottomColor: theme.border }]}>
        <HeaderTabItem
          title="Dashboard"
          subTitle="Family engagement analytics"
        />
      </View> */}

      <HeaderTabItem
        title={t("tabs.dashboard")}
        subTitle={t("tabs.dashboardSubTitle")}
        addstyles={[styles.headerWrap, { borderBottomColor: theme.border }]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={styles.containerScrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.tint}
          />
        }
      >
        <View style={{ flexGrow: 1 }}>
          {/* Top Stats */}
          <View style={styles.row}>
            <StatCard
              label="Active Families"
              value="22"
              sub="of 24 total families"
              icon={<Person2FillIcon size={30} color={theme.iconDash} />}
            />

            <StatCard
              label="Engagement Rate"
              value="92%"
              sub="↑ 5% from last month"
              positive
              icon={
                <ChartLineUptrendIcon
                  size={30}
                  color={theme.iconDash}
                />
              }
            />
          </View>

          <View style={styles.row}>
            <StatCard
              label="Posts Shared"
              value="120"
              sub="↓ 4% from last month"
              negative
              icon={
                <MediaIcon size={30} color={theme.iconDash} />
              }
            />

            <StatCard
              label="Messages Sent"
              value="340"
              sub="Same as last month"
              icon={
                <MessagesIcon size={24} color={theme.iconDash} />
              }
            />
          </View>

          {/* Teacher Engagement */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Teacher Engagement
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  borderWidth: 1,
                  borderColor: theme.tint,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <DownloadIcon size={15} color={theme.tint} />
                <Text style={{ color: theme.tint }}>{t("buttons.export")}</Text>
              </TouchableOpacity>
            </View>

            {teachers.map((t, i) => (
              <View key={i} style={styles.teacherRow}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <Text style={[styles.teacherName, { color: theme.text }]}>
                    {t.name}
                  </Text>
                  <View
                    style={{
                      backgroundColor: theme.passDesc,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <ThemedText type="subText" style={{ color: theme.bg }}>
                      {t.rate}%
                    </ThemedText>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    paddingTop: 5,
                  }}
                >
                  <Text style={[styles.teacherStats, { color: theme.subText }]}>
                    {t.posts} posts
                  </Text>
                  <Text style={[styles.teacherStats, { color: theme.subText }]}>
                    {t.responses} responses
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: theme.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${t.rate}%`, backgroundColor: theme.tint },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Average Response Time */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: Platform.OS === "ios" ? 10 : 30 },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Average Response Time
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: theme.iconDash,
                marginTop: 20,
              }}
            >
              2.3 hours
            </Text>
            <Text style={{ color: theme.passDesc, marginTop: 5 }}>
              ↑ 15% faster than last month
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
