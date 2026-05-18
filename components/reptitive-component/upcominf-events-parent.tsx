import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { SpeakableText } from '@/components/speakable-text';
import { ThemedText } from '../themed-text';
import { ArrowUpRightSquareIcon } from '../ui/icons/dashboard.icons';
import { EventIcon } from '../ui/icons/event-icons';
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
    const { t } = useTranslation();
    const theme = useStore((state) => state.theme);

    const styles = useThemedStyles((t) => ({

        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 15,
        },
        title: { fontSize: 16, fontWeight: '700', color: t.text },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
        },
        eventTime: { color: t.subText },
        dateBadge: {
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
        },
        dateText: { fontSize: 12, color: t.text },
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
                <SpeakableText style={styles.title}>{t("dashboard.upcomingEvents")}</SpeakableText>
                <EventIcon size={16} color={theme.iconDash} />
            </View>

            {/* Events */}
            {events.length > 0 ? (
                <>
                    {events.map((e: EventsProps, i) => (
                        <View key={i} style={styles.row}>
                            {/* <ThemedText type='subText' style={styles.eventTime}>{JSON.stringify(e)}</ThemedText> */}
                            <View>
                                <ThemedText >{e.title}</ThemedText>
                                <ThemedText type='subText' style={styles.eventTime}>{e.time ?? ''}</ThemedText>
                            </View>

                            <View style={styles.dateBadge}>
                                <SpeakableText style={styles.dateText}>{e.date ?? ''}</SpeakableText>
                            </View>
                        </View>
                    ))}
                </>
            ) : (
                <View style={styles.row}>
                    <ThemedText type='subText'>{t("dashboard.noEventsFound")}</ThemedText>
                </View>
            )}

            {/* Footer */}
            <TouchableOpacity style={styles.footer} onPress={onPressAllEvents}>
                <SpeakableText style={styles.footerText}>{t("dashboard.allEvents")}</SpeakableText>
                <ArrowUpRightSquareIcon size={12} color={theme.iconDash} style={{ marginTop: 2 }} />
            </TouchableOpacity>
        </Card>
    );
}

