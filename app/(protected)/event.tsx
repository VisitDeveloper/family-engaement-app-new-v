// app/school-calendar.tsx (یا هر مسیری که می‌خوای)
import HeaderThreeSections from '@/components/reptitive-component/header-three-sections';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { AntDesign, Feather, FontAwesome, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type EventKind = 'Conference' | 'Fieldtrip' | 'Event' | 'Holiday';

type CalendarItem = {
    id: string;
    title: string;
    kind: EventKind;
    dateText: string;        // e.g. Jan 28  or  Feb 2
    timeText: string;        // e.g. 3:00 PM - 3:30 PM  or  All Day
    placeText: string;       // e.g. Room 5B
    description: string;     // paragraph
};

const eventsSeed: CalendarItem[] = [
    {
        id: '1',
        title: 'Parent-Teacher Conference',
        kind: 'Conference',
        dateText: 'Jan 28',
        timeText: '3:00 PM - 3:30 PM',
        placeText: 'Room 5B',
        description: "Individual conference to discuss Sarah's progress and development goals.",
    },
    {
        id: '2',
        title: 'Field Trip - Science Museum',
        kind: 'Fieldtrip',
        dateText: 'Feb 2',
        timeText: 'All Day',
        placeText: 'Downtown Science Museum',
        description:
            'Interactive science exhibits and planetarium show. Lunch will be provided.',
    },
    {
        id: '3',
        title: 'Art Show Presentation',
        kind: 'Event',
        dateText: 'Feb 8',
        timeText: '6:00 PM - 8:00 PM',
        placeText: 'School Auditorium',
        description:
            'Students will showcase their artwork from the semester. Families are invited to attend.',
    },
    {
        id: '4',
        title: 'Presidents Day Holiday',
        kind: 'Holiday',
        dateText: 'Feb 19',
        timeText: 'All Day',
        placeText: '',
        description: 'No school in observance of Presidents Day.',
    },
    {
        id: '5',
        title: 'Reading Assessment Week',
        kind: 'Event',
        dateText: 'Feb 26',
        timeText: '9:00 AM - 12:00 PM',
        placeText: 'Classroom',
        description:
            'Individual reading assessments will be conducted throughout the week.',
    },
];

const kindChip = (k: EventKind) => {
    switch (k) {
        case 'Conference':
            return { label: 'Conference', bg: '#E6F0FF', text: '#1D4ED8', icon: <Feather name="users" size={15} color="#1D4ED8" /> }; // آبی
        case 'Fieldtrip':
            return { label: 'Fieldtrip', bg: '#F3E8FF', text: '#7C3AED', icon: <FontAwesome6 name="bus" size={15} color="#7C3AED" /> };  // بنفش
        case 'Event':
            return { label: 'Event', bg: '#EAFCEF', text: '#16A34A', icon: <MaterialIcons name="event-note" size={15} color="#16A34A" /> };      // سبز
        case 'Holiday':
            return { label: 'Holiday', bg: '#FEE2E2', text: '#DC2626', icon: <AntDesign name="gift" size={15} color="#DC2626" /> };    // قرمز
    }
};

const SchoolCalendarScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useStore((s) => s.theme);
    const [monthIndex, setMonthIndex] = useState(1); // 0=Jan, 1=Feb...

    const monthTitle = useMemo(() => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
            'August', 'September', 'October', 'November', 'December'];
        return `${months[monthIndex]} 2024`;
    }, [monthIndex]);

    const styles = useThemedStyles((t) => ({
        container: { flex: 1, backgroundColor: t.bg, paddingHorizontal: 10 },

        monthBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: t.border,
            marginBottom: 20
        },
        monthSelector: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '95%',
        },
        chevronBtn: {
            borderWidth: 1,
            borderColor: t.border,
            padding: 6,
            borderRadius: 8,
            backgroundColor: t.bg,
        },
        monthText: { color: t.text },
        list: { paddingBottom: insets.bottom + 40, },
        card: {
            backgroundColor: t.bg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.border,
            padding: 14,
            margin: 10,
        },
        row: { flexDirection: 'row', alignItems: 'center' },
        chip: {
            flexDirection: 'row',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            marginTop: 8,
        },
        metaRow: {
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
        },
        desc: { marginTop: 10, color: t.text },
        endmessage: {
            flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20
        }

    }) as const);

    const handlePrev = () => setMonthIndex((m) => (m - 1 + 12) % 12);
    const handleNext = () => setMonthIndex((m) => (m + 1) % 12);

    return (
        <ThemedView style={styles.container}>

            <HeaderThreeSections
                title='School Calendar'
                desc='Upcoming events and important dates'
                icon={<Ionicons name="add-circle-outline" size={24} color={theme.tint} />}
                colorDesc={theme.subText}
                onPress={() => router.push('/create-new-event')}

            />

            {/* Month Selector */}
            <View style={styles.monthBar}>
                <View style={styles.monthSelector}>
                    <TouchableOpacity onPress={handlePrev} style={styles.chevronBtn}>
                        <AntDesign name="left" size={16} color={theme.text} />
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={styles.monthText}>
                        {monthTitle}
                    </ThemedText>
                    <TouchableOpacity onPress={handleNext} style={styles.chevronBtn}>
                        <AntDesign name="right" size={16} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                {eventsSeed.map((ev) => {
                    const chip = kindChip(ev.kind);
                    return (
                        <ThemedView key={ev.id} style={styles.card}>
                            <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>{ev.title}</ThemedText>

                            {/* Kind Chip */}
                            <View style={[styles.chip, { backgroundColor: chip.bg }]}>
                                {chip.icon}
                                <ThemedText type="subText" style={{ color: chip.text }}>
                                    {chip.label}
                                </ThemedText>
                            </View>


                            {/* Meta */}
                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <Feather name="calendar" size={16} color={theme.text} />
                                    <ThemedText type="subText" style={{ color: theme.subText }}>{ev.dateText}</ThemedText>
                                </View>
                                <View style={styles.metaItem}>
                                    <Feather name="clock" size={16} color={theme.text} />
                                    <ThemedText type="subText" style={{ color: theme.subText }}>{ev.timeText}</ThemedText>
                                </View>
                                {!!ev.placeText && (
                                    <View style={styles.metaItem}>
                                        <Feather name="map-pin" size={16} color={theme.text} />
                                        <ThemedText type="subText" style={{ color: theme.subText }}>{ev.placeText}</ThemedText>
                                    </View>
                                )}
                            </View>

                            {/* Description */}
                            <ThemedText type="default" style={styles.desc}>
                                {ev.description}
                            </ThemedText>
                        </ThemedView>
                    );
                })}
                <View style={styles.endmessage}>
                    <FontAwesome name="calendar" size={24} color={theme.subText} />
                    <ThemedText type="subtitle" style={{ color: theme.text }}>
                        That's all for now!
                    </ThemedText>
                    <ThemedText type="subText" style={{ color: theme.subText }}>
                        Check back later for new events and announcements.
                    </ThemedText>
                </View>
            </ScrollView>

        </ThemedView>
    );
};

export default SchoolCalendarScreen;
