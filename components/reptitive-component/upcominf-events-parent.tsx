import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import Card from './card';



export interface EventsProps {
    title?: string;
    time?: string;
    date?: string;
}

interface UpcomingEventsCardProps {
    events: EventsProps[];
    onPressAllEvents?: () => void;
}


export default function UpcomingEventsCard({ events, onPressAllEvents }: UpcomingEventsCardProps) {
    const theme = useStore((state) => state.theme);

    const styles = useThemedStyles((t) => ({

        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 15,
        },
        title: { fontSize: 16, fontWeight: '700' },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
        },
        eventTime: { color: t.subText },
        dateBadge: {
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
        },
        dateText: { fontSize: 12 },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            marginTop: 6,
        },
        footerText: {
            fontSize: 13,
            color: t.text,
            fontWeight: '600',
        },

    }));
    return (
        <Card>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Upcoming Events</Text>
                <Feather name="calendar" size={16} color={theme.iconDash} />
            </View>

            {/* Events */}
            {events.map((e: EventsProps, i) => (
                <View key={i} style={styles.row}>
                    <View>
                        <ThemedText >{e.title}</ThemedText>
                        <ThemedText type='subText' style={styles.eventTime}>{e.time}</ThemedText>
                    </View>

                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{e.date}</Text>
                    </View>
                </View>
            ))}

            {/* Footer */}
            <TouchableOpacity style={styles.footer} onPress={onPressAllEvents}>
                <Text style={styles.footerText}>All Events</Text>
                <Ionicons name="arrow-up-right-box-outline" size={18} color={theme.iconDash} />
            </TouchableOpacity>
        </Card>
    );
}

