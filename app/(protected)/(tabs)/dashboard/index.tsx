import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import StatCard from "@/components/reptitive-component/stat-card-admin";
import { ThemedText } from "@/components/themed-text";
import { ChartLineUptrendIcon, Person2FillIcon } from "@/components/ui/icons/dashboard.icons";
import { MediaIcon } from "@/components/ui/icons/messages-icons";
import { DownloadIcon } from "@/components/ui/icons/settings-icons";
import { MessagesIcon } from "@/components/ui/icons/tab-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { dashboardService, isAdminDashboardResponse } from "@/services/dashboard.service";
import { useStore } from "@/store";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DimensionValue } from "react-native";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Dashboard() {
  const { t } = useTranslation();
  const { theme } = useStore((state) => state);
  const role = useStore((state) => state.role);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<Awaited<ReturnType<typeof dashboardService.getDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError((err as { message?: string })?.message ?? t("dashboard.failedLoad"));
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      const csv = await dashboardService.exportCsv();
      await Share.share({
        message: csv,
        title: t("dashboard.exportTitle"),
      });
    } catch (err) {
      Alert.alert(
        t("common.error", "Error"),
        (err as { message?: string })?.message ?? t("dashboard.exportFailed")
      );
    } finally {
      setExporting(false);
    }
  }, [t]);

  const adminData = dashboardData && isAdminDashboardResponse(dashboardData) ? dashboardData : null;
  const summary = adminData?.summaryMetrics ?? [];
  const teachers = adminData?.teacherEngagement ?? [];

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

  if (role === "parent" || role === "teacher") {
    return <Redirect href="/(protected)/(tabs)/dashboard/parent-dashboard" />;
  }

  const engagementSub = summary?.find(metric => metric.label === "Engagement Rate")?.trend ?? "";
  const engagementPositive = summary?.find(metric => metric.label === "Engagement Rate")?.trendDirection === "up";
  const engagementNegative = summary?.find(metric => metric.label === "Engagement Rate")?.trendDirection === "down";
  const postsSub = summary?.find(metric => metric.label === "Posts Shared")?.trend ?? "";
  const postsNegative = summary?.find(metric => metric.label === "Posts Shared")?.trendDirection === "down";
  const postsPositive = summary?.find(metric => metric.label === "Posts Shared")?.trendDirection === "up";
  const messagesSub = summary?.find(metric => metric.label === "Messages Sent")?.trend ?? "";
  const messagesNegative = summary?.find(metric => metric.label === "Messages Sent")?.trendDirection === "down";
  const messagesPositive = summary?.find(metric => metric.label === "Messages Sent")?.trendDirection === "up";

  return (
    <View style={styles.container}>
      <HeaderTabItem
        title={t("tabs.dashboard")}
        subTitle={t("tabs.dashboardSubTitle")}
        addstyles={[styles.headerWrap, { borderBottomColor: theme.border }]}
      />

      {/* {error && (
        <View style={{ padding: 8, marginHorizontal: 10, backgroundColor: theme.border, borderRadius: 8, marginBottom: 8 }}>
          <ThemedText type="default" style={{ color: theme.subText }}>{error}</ThemedText>
        </View>
      )} */}

      {loading && !dashboardData ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
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
            <View style={styles.row}>
              <StatCard
                label={t("dashboard.activeFamilies")}
                value={summary ? String(summary.find(metric => metric.label === "Active Families")?.value ?? 0) : "—"}
                sub={summary ? t("dashboard.ofTotalFamilies", { total: summary.find(metric => metric.label === "Active Families")?.context ?? 0 }) : ""}
                icon={<Person2FillIcon size={30} color={theme.iconDash} />}
              />
              <StatCard
                label={t("dashboard.engagementRate")}
                value={summary ? `${summary.find(metric => metric.label === "Engagement Rate")?.value ?? 0}%` : "—"}
                sub={engagementSub || "—"}
                positive={engagementPositive}
                negative={engagementNegative}
                icon={<ChartLineUptrendIcon size={30} color={theme.iconDash} />}
              />
            </View>

            <View style={styles.row}>
              <StatCard
                label={t("dashboard.postsShared")}
                value={summary ? String(summary.find(metric => metric.label === "Posts Shared")?.value ?? 0) : "—"}
                sub={postsSub || "—"}
                negative={postsNegative}
                positive={postsPositive}
                icon={<MediaIcon size={30} color={theme.iconDash} />}
              />
              <StatCard
                label={t("dashboard.messagesSent")}
                value={summary ? String(summary.find(metric => metric.label === "Messages Sent")?.value ?? 0) : "—"}
                sub={messagesSub || "—"}
                negative={messagesNegative}
                positive={messagesPositive}
                icon={<MessagesIcon size={24} color={theme.iconDash} />}
              />
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.bg, borderColor: theme.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {t("dashboard.teacherEngagement")}
                </Text>
                <TouchableOpacity
                  onPress={onExport}
                  disabled={exporting}
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
                  <Text style={{ color: theme.tint }}>
                    {exporting ? "…" : t("buttons.export")}
                  </Text>
                </TouchableOpacity>
              </View>

              {teachers.length === 0 ? (
                <ThemedText type="subText">{t("dashboard.noTeacherData")}</ThemedText>
              ) : (
                teachers.map((teacher, i) => {
                  const pct = Math.min(100, teacher.engagementPercent);
                  return (
                    <View key={teacher.teacherId ?? i} style={styles.teacherRow}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                        }}
                      >
                        <Text style={[styles.teacherName, { color: theme.text }]}>
                          {teacher.displayName}
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
                            {teacher.engagementPercent + "%"}
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
                          {teacher.postsCount} {t("dashboard.posts")}
                        </Text>
                        <Text style={[styles.teacherStats, { color: theme.subText }]}>
                          {teacher.responsesCount} {t("dashboard.responses")}
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
                            {
                              width: (pct + "%") as DimensionValue,
                              backgroundColor: theme.tint,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.bg,
                  borderColor: theme.border,
                  marginBottom: Platform.OS === "ios" ? 10 : 30,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t("dashboard.averageResponseTime")}
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
                {t("dashboard.fasterThanLastMonth", { percent: 15 })}
              </Text>
            </View> */}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
