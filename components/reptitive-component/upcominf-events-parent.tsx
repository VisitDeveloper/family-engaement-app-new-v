import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from './card';

const events = [
    { title: 'Parent-Teacher Conference', time: '3:00 PM', date: 'Jan 28' },
    { title: 'Field Trip - Science Museum', time: 'All Day', date: 'Feb 2' },
    { title: 'Art Show Presentation', time: '6:00 PM', date: 'Feb 8' },
];

export default function UpcomingEventsCard() {
    return (
        <Card>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Upcoming Events</Text>
                <Feather name="calendar" size={16} color="#4F46E5" />
            </View>

            {/* Events */}
            {events.map((e, i) => (
                <View key={i} style={styles.row}>
                    <View>
                        <Text style={styles.eventTitle}>{e.title}</Text>
                        <Text style={styles.eventTime}>{e.time}</Text>
                    </View>

                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{e.date}</Text>
                    </View>
                </View>
            ))}

            {/* Footer */}
            <TouchableOpacity style={styles.footer}>
                <Text style={styles.footerText}>All Events</Text>
                <Feather name="arrow-right" size={14} color="#4F46E5" />
            </TouchableOpacity>
        </Card>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    title: { fontSize: 16, fontWeight: '700' },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    eventTitle: { fontSize: 14, fontWeight: '600' },
    eventTime: { fontSize: 12, color: '#6B7280' },
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
        color: '#4F46E5',
        fontWeight: '600',
    },
});