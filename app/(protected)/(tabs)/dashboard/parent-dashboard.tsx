import RecentActivityCard, { ActivityItem } from "@/components/reptitive-component/activities-parent-dashboard";
import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import StatCardParent from "@/components/reptitive-component/state-card-parent";
import UpcomingEventsCard, { EventsProps } from "@/components/reptitive-component/upcominf-events-parent";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store"; // همون Zustand store که theme رو برمی‌گردونه
import { AntDesign, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { ScrollView, View } from "react-native";



export default function ParentDashboard() {
    const { theme } = useStore(state => state);
    const role = useStore(state => state.role);

    const teachers = [
        { name: "Ms. Alvarez", posts: 23, responses: 18, rate: 95 },
        { name: "Mr. Rodriguez", posts: 19, responses: 16, rate: 88 },
        { name: "Ms. Chen", posts: 21, responses: 19, rate: 92 },
        { name: "Mr. Thompson", posts: 15, responses: 12, rate: 85 },
    ];

    const events: Array<EventsProps> = [
        { title: 'Parent-Teacher Conference', time: '3:00 PM', date: 'Jan 28' },
        { title: 'Field Trip - Science Museum', time: 'All Day', date: 'Feb 2' },
        { title: 'Art Show Presentation', time: '6:00 PM', date: 'Feb 8' },
    ];

    const activities: Array<ActivityItem> = [
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


    if (role === 'teacher' || role === 'admin') {
        return <Redirect href="/(protected)/(tabs)/dashboard" />;
    }

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
    }))

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
                        label="Active Families"
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

                <UpcomingEventsCard events={events} />

                <RecentActivityCard activities={activities} />
            </ScrollView>
        </View>
    );
}




