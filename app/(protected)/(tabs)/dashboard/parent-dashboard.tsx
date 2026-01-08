import RecentActivityCard, { ActivityItem } from "@/components/reptitive-component/activities-parent-dashboard";
import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import StatCardParent from "@/components/reptitive-component/state-card-parent";
import UpcomingEventsCard, { EventsProps } from "@/components/reptitive-component/upcominf-events-parent";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { eventService } from "@/services/event.service";
import { useStore } from "@/store"; // The same Zustand store that returns theme
import { AntDesign, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";



export default function ParentDashboard() {
    const { theme } = useStore(state => state);
    const role = useStore(state => state.role);
    const router = useRouter();

    const [events, setEvents] = useState<EventsProps[]>([]);

    // Format date helper
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    };

    // Helper function to extract string from time field (can be object or string)
    const extractTimeString = (time: Record<string, any> | string | null | undefined): string | null => {
        if (!time) return null;
        if (typeof time === 'string') return time;
        if (typeof time === 'object' && time !== null) {
            return (time as any).time || (time as any).value || (time as any).startTime || null;
        }
        return null;
    };

    // Helper function to format time string (HH:mm:ss or HH:mm) to readable format
    const formatTimeString = (timeString: string): string => {
        if (!timeString) return 'All Day';
        
        // Handle time string format like "15:00:00" or "15:00"
        const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = timeMatch[2];
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            return `${displayHours}:${minutes} ${period}`;
        }
        
        // If it's a full datetime string, try to parse it
        try {
            const date = new Date(timeString);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            }
        } catch {
            // Ignore parsing errors
        }
        
        return timeString; // Return as-is if can't parse
    };

    // Format time helper
    const formatTime = (time: Record<string, any> | string | null | undefined, allDay: boolean): string => {
        if (allDay) return 'All Day';
        const timeString = extractTimeString(time);
        if (!timeString) return 'All Day';
        return formatTimeString(timeString);
    };

    // Fetch upcoming events
    const fetchUpcomingEvents = useCallback(async () => {
        try {
            const response = await eventService.getAll({
                page: 1,
                limit: 3,
                filter: 'upcoming'
            });

            const formattedEvents: EventsProps[] = response.events.map(event => ({
                title: event.title,
                time: formatTime(event.startTime, event.allDay),
                date: formatDate(event.startDate)
            }));

            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
            // Keep empty array on error
            setEvents([]);
        }
    }, []);

    useEffect(() => {
        fetchUpcomingEvents();
    }, [fetchUpcomingEvents]);

    // Refresh events when screen comes into focus (e.g., after creating an event)
    useFocusEffect(
        useCallback(() => {
            fetchUpcomingEvents();
        }, [fetchUpcomingEvents])
    );

    const activities: ActivityItem[] = [
        {
            title: "Ms. Alvarez shared a new photo",
            time: "2 hours ago",
            active: true,
        },
        {
            title: "New message from Mr. Rodriguez",
            time: "4 hours ago",
        },
        {
            title: "Reading assessment available",
            time: "1 day ago",
        },
    ];

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

    if (role === 'teacher' || role === 'admin') {
        return <Redirect href="/(protected)/(tabs)/dashboard" />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg, padding: 10 }}>

            <View style={[styles.headerWrap, { borderBottomColor: theme.border }]}>
                <HeaderTabItem
                    title="Dashboard"
                    subTitle="Your family engagement overview"
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.container}>

                {/* Top Stats */}
                <View style={styles.row}>

                    <StatCardParent
                        labelIcon={<Ionicons name="arrow-up-right-box-outline" size={18} color={theme.iconDash} />}
                        label="New Posts"
                        value="3"
                        sub="15 posts viewed"
                        icon={<AntDesign name="picture" size={30} color={theme.iconDash} />}
                        rate={90}
                    />


                    <StatCardParent
                        label="Unread"
                        labelIcon={<Ionicons name="arrow-up-right-box-outline" size={18} color={theme.iconDash} />}
                        value="2"
                        sub="8 messages read"
                        positive
                        icon={<FontAwesome6 name="message" size={30} color={theme.iconDash} />}
                        rate={95}
                    />

                </View>

                <UpcomingEventsCard 
                    events={events} 
                    onPressAllEvents={() => router.push('/event')}
                />

                <RecentActivityCard activities={activities} />
            </ScrollView>
        </View>
    );
}




