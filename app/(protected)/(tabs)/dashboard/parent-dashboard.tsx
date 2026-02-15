import RecentActivityCard, { ActivityItem } from "@/components/reptitive-component/activities-parent-dashboard";
import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import StatCardParent from "@/components/reptitive-component/state-card-parent";
import UpcomingEventsCard, { EventsProps } from "@/components/reptitive-component/upcominf-events-parent";
import { ArrowUpRightSquareIcon } from "@/components/ui/icons/dashboard.icons";
import { MediaIcon } from "@/components/ui/icons/messages-icons";
import { MessagesIcon } from "@/components/ui/icons/tab-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { dashboardService, isParentDashboardResponse } from "@/services/dashboard.service";
import { eventService } from "@/services/event.service";
import { useStore } from "@/store";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";

export default function ParentDashboard() {
    const { t } = useTranslation();
    const { theme } = useStore(state => state);
    const role = useStore(state => state.role);
    const router = useRouter();

    const [events, setEvents] = useState<EventsProps[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState<Awaited<ReturnType<typeof dashboardService.getDashboard>> | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    const formatDate = useCallback((dateString: string): string => {
        const date = new Date(dateString);
        const monthKey = `event.monthShort${date.getMonth()}`;
        return `${t(monthKey)} ${date.getDate()}`;
    }, [t]);

    const formatTime = useCallback((time: Record<string, unknown> | string | null | undefined, allDay: boolean): string => {
        if (allDay) return t("event.allDay");
        let timeString: string | null = null;
        if (typeof time === 'string') timeString = time;
        else if (time && typeof time === 'object') {
            const t = time as Record<string, unknown>;
            timeString = (t.time ?? t.value ?? t.startTime) as string ?? null;
        }
        if (!timeString) return t("event.allDay");
        const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = timeMatch[2];
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            return `${displayHours}:${minutes} ${period}`;
        }
        try {
            const date = new Date(timeString);
            if (!isNaN(date.getTime())) return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        } catch {
            // ignore
        }
        return timeString;
    }, [t]);

    // Fetch dashboard; if parent and no upcoming events from API, fetch events from events API
    const fetchDashboard = useCallback(async () => {
        setDashboardLoading(true);
        setDashboardError(null);
        try {
            const data = await dashboardService.getDashboard();
            setDashboardData(data);
            if (isParentDashboardResponse(data) && data.upcomingEvents?.length) {
                const formatted: EventsProps[] = data.upcomingEvents.slice(0, 5).map(ev => ({
                    title: ev.title,
                    time: ev.allDay === true ? t("event.allDay") : formatTime(ev.timeDisplay ?? null, false),
                    date: formatDate(ev.date),
                }));
                setEvents(formatted);
            } else {
                // Fallback: parent with no events, or non-parent response
                try {
                    const response = await eventService.getAll({
                        page: 1,
                        limit: 5,
                        filter: 'upcoming',
                    });
                    const formattedEvents: EventsProps[] = response.events.map(event => ({
                        title: event.title,
                        time: formatTime(event.startTime, event.allDay),
                        date: formatDate(event.startDate),
                    }));
                    setEvents(formattedEvents);
                } catch {
                    setEvents([]);
                }
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setDashboardError((err as { message?: string })?.message ?? t("dashboard.failedLoad"));
            setDashboardData(null);
            setEvents([]);
        } finally {
            setDashboardLoading(false);
        }
    }, [formatDate, formatTime, t]);

    // Only use useFocusEffect: one call on first focus (tab open), one on each return to tab
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

    const parentData = dashboardData && isParentDashboardResponse(dashboardData) ? dashboardData : null;
    const newPosts = parentData?.newPosts ?? { count: 0, postsViewed: 0 };
    const unreadMessages = parentData?.unreadMessages ?? { count: 0, messagesRead: 0 };
    const activities: ActivityItem[] = (parentData?.recentActivity ?? []).map(a => ({
        title: a.title ?? '',
        time: a.timeAgo ?? '',
        active: a.type === 'message',
    })) ?? [];

    const styles = useThemedStyles((t) => ({
        container: {
            flex: 1,
            marginBottom: 90,
            backgroundColor: t.bg
        },
        headerWrap: {
            borderBottomWidth: 1, paddingBottom: 5, marginBottom: 10
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

    if (role === 'admin' || role === 'organization_manager' || role === 'site_manager') {
        return <Redirect href="/(protected)/(tabs)/dashboard" />;
    }

    const newPostsRate = newPosts.count > 0
        ? Math.round((newPosts.count / (newPosts.postsViewed + newPosts.count)) * 100)
        : 0;
    const unreadRate = (unreadMessages.messagesRead + unreadMessages.count) > 0
        ? Math.round((unreadMessages.messagesRead / (unreadMessages.messagesRead + unreadMessages.count)) * 100)
        : 0;

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg, padding: 10 }}>
            <View style={[styles.headerWrap, { borderBottomColor: theme.border }]}>
                <HeaderTabItem
                    title={t("tabs.dashboard")}
                    subTitle={t("tabs.dashboardSubTitleParent")}
                />
            </View>

            {/* {dashboardError && (
                <View style={{ padding: 8, backgroundColor: theme.border, borderRadius: 8, marginBottom: 8 }}>
                    <ThemedText type="default" style={{ color: theme.subText }}>{dashboardError}</ThemedText>
                </View>
            )} */}

            {dashboardLoading && !dashboardData ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.container}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.tint}
                        />
                    }
                >
                    <View style={styles.row}>
                        <StatCardParent
                            labelIcon={<ArrowUpRightSquareIcon size={12} color={theme.iconDash} />}
                            label={t("dashboard.newPosts")}
                            value={(newPosts.count)}
                            sub={t("dashboard.postsInScope", { count: newPosts.postsViewed + newPosts.count })}
                            icon={<MediaIcon size={30} color={theme.iconDash} />}
                            rate={newPostsRate}
                        />
                        <StatCardParent
                            label={t("dashboard.unread")}
                            labelIcon={<ArrowUpRightSquareIcon size={12} color={theme.iconDash} />}
                            value={String(unreadMessages.count)}
                            sub={t("dashboard.messagesRead", { read: unreadMessages.messagesRead })}
                            positive={unreadMessages.count > unreadMessages.messagesRead}
                            icon={<MessagesIcon size={30} color={theme.iconDash} />}
                            rate={unreadRate}
                        />
                    </View>

                    <UpcomingEventsCard
                        events={events}
                        onPressAllEvents={() => router.push('/event')}
                    />

                    <RecentActivityCard activities={activities} />
                </ScrollView>
            )}
        </View>
    );
}




