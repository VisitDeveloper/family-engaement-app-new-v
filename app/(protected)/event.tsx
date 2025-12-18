// app/school-calendar.tsx (یا هر مسیری که می‌خوای)
import HeaderThreeSections from '@/components/reptitive-component/header-three-sections';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { EventResponseDto, eventService } from '@/services/event.service';
import { useStore } from '@/store';
import { AntDesign, Feather, FontAwesome, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Helper function to format date
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
};

// Helper function to extract string from time field (can be object or string)
const extractTimeString = (time: Record<string, any> | string | null | undefined): string | null => {
    if (!time) return null;
    if (typeof time === 'string') return time;
    // If it's an object, try to extract a time string (adjust based on actual API structure)
    if (typeof time === 'object' && time !== null) {
        // Try common time field names
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

// Helper function to format time
const formatTime = (time: Record<string, any> | string | null | undefined): string => {
    const timeString = extractTimeString(time);
    if (!timeString) return 'All Day';
    return formatTimeString(timeString);
};

// Helper function to format time range
const formatTimeRange = (startTime: Record<string, any> | string | null | undefined, endTime: Record<string, any> | string | null | undefined, allDay: boolean): string => {
    if (allDay) return 'All Day';
    const start = formatTime(startTime);
    const end = formatTime(endTime);
    if (start === 'All Day' || end === 'All Day') return 'All Day';
    return `${start} - ${end}`;
};

// Helper function to extract string from description/location (can be object or string)
const extractString = (value: Record<string, any> | string | null | undefined): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
        // Try common field names for localized strings
        return (value as any).en || (value as any).fa || (value as any).text || (value as any).value || JSON.stringify(value);
    }
    return String(value);
};

type EventKind = 'Conference' | 'Fieldtrip' | 'Event' | 'Holiday';

// Map type string (lowercase) to EventKind for display
const mapEventTypeToKind = (type: string): EventKind => {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
        case 'conference':
        case 'meeting':
            return 'Conference';
        case 'fieldtrip':
            return 'Fieldtrip';
        case 'classevent':
        case 'familyworkshop':
        case 'schoolwideevent':
        case 'assessment':
        case 'servicesandscreenings':
            return 'Event';
        default:
            return 'Event';
    }
};

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
        default:
            return { label: 'Event', bg: '#EAFCEF', text: '#16A34A', icon: <MaterialIcons name="event-note" size={15} color="#16A34A" /> };
    }
};

const SchoolCalendarScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useStore((s) => s.theme);
    const currentDate = new Date();
    const [monthIndex, setMonthIndex] = useState(currentDate.getMonth()); // Current month
    const [year, setYear] = useState(currentDate.getFullYear()); // Current year
    const [events, setEvents] = useState<EventResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const monthTitle = useMemo(() => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
            'August', 'September', 'October', 'November', 'December'];
        return `${months[monthIndex]} ${year}`;
    }, [monthIndex, year]);

    // Fetch events
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // monthIndex is 0-based (0-11), API expects 1-based (1-12)
            const month = monthIndex + 1;

            const response = await eventService.getAll({
                page: 1,
                limit: 100,
                filter: 'upcoming',
                month,
                year
            });

            setEvents(response.events);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to load events. Please try again.';
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    }, [monthIndex, year]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

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

    const handlePrev = () => {
        setMonthIndex((m) => {
            const newMonth = (m - 1 + 12) % 12;
            if (newMonth === 11) {
                setYear((y) => y - 1);
            }
            return newMonth;
        });
    };
    const handleNext = () => {
        setMonthIndex((m) => {
            const newMonth = (m + 1) % 12;
            if (newMonth === 0) {
                setYear((y) => y + 1);
            }
            return newMonth;
        });
    };

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
                {loading ? (
                    <View style={styles.endmessage}>
                        <ThemedText type="subtitle" style={{ color: theme.text }}>
                            Loading events...
                        </ThemedText>
                    </View>
                ) : error ? (
                    <View style={styles.endmessage}>
                        <ThemedText type="subtitle" style={{ color: theme.text }}>
                            {error}
                        </ThemedText>
                    </View>
                ) : events.length === 0 ? (
                    <View style={styles.endmessage}>
                        <FontAwesome name="calendar" size={24} color={theme.subText} />
                        <ThemedText type="subtitle" style={{ color: theme.text }}>
                            No events found
                        </ThemedText>
                        <ThemedText type="subText" style={{ color: theme.subText }}>
                            Check back later for new events and announcements.
                        </ThemedText>
                    </View>
                ) : (
                    events.map((ev) => {
                        const kind = mapEventTypeToKind(ev.type);
                        const chip = kindChip(kind);
                        const dateText = formatDate(ev.startDate);
                        const timeText = formatTimeRange(ev.startTime, ev.endTime, ev.allDay);
                        const locationText = extractString(ev.location);
                        const descriptionText = extractString(ev.description);
                        
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
                                        <ThemedText type="subText" style={{ color: theme.subText }}>{dateText}</ThemedText>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Feather name="clock" size={16} color={theme.text} />
                                        <ThemedText type="subText" style={{ color: theme.subText }}>{timeText}</ThemedText>
                                    </View>
                                    {!!locationText && (
                                        <View style={styles.metaItem}>
                                            <Feather name="map-pin" size={16} color={theme.text} />
                                            <ThemedText type="subText" style={{ color: theme.subText }}>{locationText}</ThemedText>
                                        </View>
                                    )}
                                </View>

                                {/* Description */}
                                {!!descriptionText && (
                                    <ThemedText type="default" style={styles.desc}>
                                        {descriptionText}
                                    </ThemedText>
                                )}
                            </ThemedView>
                        );
                    })
                )}
                {!loading && events.length > 0 && (
                    <View style={styles.endmessage}>
                        <FontAwesome name="calendar" size={24} color={theme.subText} />
                        <ThemedText type="subtitle" style={{ color: theme.text }}>
                            That&apos;s all for now!
                        </ThemedText>
                        <ThemedText type="subText" style={{ color: theme.subText }}>
                            Check back later for new events and announcements.
                        </ThemedText>
                    </View>
                )}
            </ScrollView>

        </ThemedView>
    );
};

export default SchoolCalendarScreen;
