import HeaderInnerPage from '@/components/reptitive-component/header-inner-page';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { EventResponseDto, eventService, RSVPStatus, TimeSlotDto } from '@/services/event.service';
import { useStore } from '@/store';
import { AntDesign, Feather, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Helper function to format date
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
};

// Helper function to format time string (HH:mm:ss or HH:mm) to readable format
const formatTimeString = (timeString: string): string => {
    if (!timeString) return 'All Day';
    
    const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2];
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes} ${period}`;
    }
    
    return timeString;
};

// Helper function to format time range
const formatTimeRange = (startTime: string, endTime: string): string => {
    const start = formatTimeString(startTime);
    const end = formatTimeString(endTime);
    return `${start} - ${end}`;
};

// Helper function to extract string from description/location
const extractString = (value: Record<string, any> | string | null | undefined): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
        return (value as any).en || (value as any).fa || (value as any).text || (value as any).value || JSON.stringify(value);
    }
    return String(value);
};

type EventKind = 'Conference' | 'Fieldtrip' | 'Event' | 'Holiday';

const mapEventTypeToKind = (type: string): EventKind => {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
        case 'conference':
            return 'Conference';
        case 'fieldtrip':
            return 'Fieldtrip';
        case 'event':
            return 'Event';
        case 'holiday':
            return 'Holiday';
        default:
            return 'Event';
    }
};

const kindChip = (k: EventKind) => {
    switch (k) {
        case 'Conference':
            return { label: 'Conference', bg: '#E6F0FF', text: '#1D4ED8', icon: <Feather name="users" size={15} color="#1D4ED8" /> };
        case 'Fieldtrip':
            return { label: 'Fieldtrip', bg: '#F3E8FF', text: '#7C3AED', icon: <FontAwesome6 name="bus" size={15} color="#7C3AED" /> };
        case 'Event':
            return { label: 'Event', bg: '#EAFCEF', text: '#16A34A', icon: <MaterialIcons name="event-note" size={15} color="#16A34A" /> };
        case 'Holiday':
            return { label: 'Holiday', bg: '#FEE2E2', text: '#DC2626', icon: <AntDesign name="gift" size={15} color="#DC2626" /> };
        default:
            return { label: 'Event', bg: '#EAFCEF', text: '#16A34A', icon: <MaterialIcons name="event-note" size={15} color="#16A34A" /> };
    }
};

const EventDetailScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useStore((s) => s.theme);
    const { id } = useLocalSearchParams<{ id: string }>();
    
    const [event, setEvent] = useState<EventResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | null>(null);
    const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>('pending');
    const [submitting, setSubmitting] = useState(false);
    const currentUser = useStore((s) => s.user);

    // Get current user's RSVP status from invitees
    const currentUserInvitee = event?.invitees?.find(invitee => {
        return invitee.userId === currentUser?.id;
    });

    useEffect(() => {
        if (currentUserInvitee) {
            // Normalize RSVP status (handle both old and new API formats)
            const rawStatus = currentUserInvitee.rsvpStatus as string;
            const normalizedStatus: RSVPStatus = rawStatus === 'accepted' ? 'going' : rawStatus === 'declined' ? 'not_going' : (rawStatus as RSVPStatus);
            setRsvpStatus(normalizedStatus);
            setSelectedTimeSlotId(currentUserInvitee.selectedTimeSlotId || null);
        }
    }, [currentUserInvitee, currentUser]);

    const fetchEvent = useCallback(async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            setError(null);
            const eventData = await eventService.getById(id);
            setEvent(eventData);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to load event. Please try again.';
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
            console.error('Error fetching event:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    const handleRSVP = async (status: RSVPStatus, timeSlotId?: string) => {
        if (!event) return;
        
        try {
            setSubmitting(true);
            await eventService.rsvp(event.id, status, timeSlotId);
            setRsvpStatus(status);
            if (timeSlotId) {
                setSelectedTimeSlotId(timeSlotId);
            }
            const statusText = status === 'going' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Not Going';
            Alert.alert('Success', `RSVP updated to ${statusText}`);
            // Refresh event data
            await fetchEvent();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update RSVP. Please try again.');
            console.error('Error updating RSVP:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const styles = useThemedStyles((t) => ({
        container: { flex: 1, backgroundColor: t.bg },
        content: { padding: 16, paddingBottom: insets.bottom + 20 },
        card: {
            backgroundColor: t.bg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.border,
            padding: 16,
            marginBottom: 16,
        },
        title: { marginBottom: 12 },
        chip: {
            flexDirection: 'row',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            marginBottom: 16,
        },
        metaRow: {
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
        },
        desc: { marginTop: 12, color: t.text, lineHeight: 20 },
        rsvpSection: {
            marginTop: 20,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: t.border,
        },
        rsvpTitle: { marginBottom: 12 },
        rsvpButtons: {
            flexDirection: 'row',
            gap: 10,
            flexWrap: 'wrap',
        },
        rsvpButton: {
            flex: 1,
            minWidth: 100,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        rsvpButtonActive: {
            borderWidth: 2,
        },
        timeSlotSection: {
            marginTop: 20,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: t.border,
        },
        timeSlotTitle: { marginBottom: 12 },
        timeSlotItem: {
            padding: 16,
            borderRadius: 8,
            borderWidth: 1,
            marginBottom: 12,
        },
        timeSlotItemSelected: {
            borderWidth: 2,
        },
        timeSlotHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        timeSlotInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        radioButton: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
        },
        radioButtonSelected: {
            borderWidth: 6,
        },
        selectSlotButton: {
            marginTop: 20,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
        },
    })) as const;

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <HeaderInnerPage title="Event Details" onPress={() => router.back()} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.tint} />
                    <ThemedText style={{ marginTop: 10, color: theme.subText }}>
                        Loading event...
                    </ThemedText>
                </View>
            </ThemedView>
        );
    }

    if (error || !event) {
        return (
            <ThemedView style={styles.container}>
                <HeaderInnerPage title="Event Details" onPress={() => router.back()} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <ThemedText style={{ color: theme.text, textAlign: 'center' }}>
                        {error || 'Event not found'}
                    </ThemedText>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ marginTop: 20, padding: 12, borderRadius: 8, backgroundColor: theme.tint }}
                    >
                        <ThemedText style={{ color: '#fff' }}>Go Back</ThemedText>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        );
    }

    const kind = mapEventTypeToKind(event.type);
    const chip = kindChip(kind);
    const dateText = formatDate(event.startDate);
    const timeText = event.allDay 
        ? 'All Day' 
        : formatTimeRange(
            typeof event.startTime === 'string' ? event.startTime : '',
            typeof event.endTime === 'string' ? event.endTime : ''
        );
    const locationText = extractString(event.location);
    const descriptionText = extractString(event.description);

    return (
        <ThemedView style={styles.container}>
            <HeaderInnerPage title="Event Details" onPress={() => router.back()} />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <ThemedView style={styles.card}>
                    <ThemedText type="defaultSemiBold" style={[styles.title, { color: theme.text }]}>
                        {event.title}
                    </ThemedText>

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

                {/* Time Slots Selection (if multipleTimeSlots) */}
                {event.multipleTimeSlots && event.timeSlots && event.timeSlots.length > 0 && (
                    <ThemedView style={styles.card}>
                        <ThemedText type="defaultSemiBold" style={[styles.timeSlotTitle, { color: theme.text }]}>
                            Choose Time Slot
                        </ThemedText>
                        
                        {event.timeSlots.map((slot: TimeSlotDto) => {
                            const isSelected = selectedTimeSlotId === slot.id;
                            const slotsLeft = slot.maxParticipants 
                                ? slot.maxParticipants - slot.currentParticipants 
                                : null;
                            const isFull = slotsLeft !== null && slotsLeft <= 0;
                            
                            return (
                                <TouchableOpacity
                                    key={slot.id}
                                    style={[
                                        styles.timeSlotItem,
                                        { 
                                            borderColor: isSelected ? theme.tint : theme.border,
                                            backgroundColor: isSelected ? `${theme.tint}10` : theme.bg,
                                            opacity: isFull ? 0.5 : 1,
                                        },
                                        isSelected && styles.timeSlotItemSelected,
                                    ]}
                                    onPress={() => !isFull && handleRSVP('going', slot.id)}
                                    disabled={isFull || submitting}
                                >
                                    <View style={styles.timeSlotHeader}>
                                        <View style={styles.timeSlotInfo}>
                                            <View style={[
                                                styles.radioButton,
                                                { borderColor: theme.tint },
                                                isSelected && { borderColor: theme.tint },
                                                isSelected && styles.radioButtonSelected,
                                            ]}>
                                                {isSelected && (
                                                    <View style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: 4,
                                                        backgroundColor: theme.tint,
                                                    }} />
                                                )}
                                            </View>
                                            <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>
                                                {formatTimeRange(slot.startTime, slot.endTime)}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    {slotsLeft !== null && (
                                        <ThemedText type="subText" style={{ color: theme.subText, marginTop: 4 }}>
                                            {slotsLeft} of {slot.maxParticipants} slots left
                                        </ThemedText>
                                    )}
                                    {isFull && (
                                        <ThemedText type="subText" style={{ color: '#DC2626', marginTop: 4 }}>
                                            Full
                                        </ThemedText>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                        
                        {selectedTimeSlotId && (
                            <TouchableOpacity
                                style={[styles.selectSlotButton, { backgroundColor: theme.tint }]}
                                onPress={() => {
                                    Alert.alert('Success', 'Time slot selected successfully');
                                }}
                                disabled={submitting}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                                    Choose Slot
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </ThemedView>
                )}

                {/* RSVP Section (if requestRSVP and not multipleTimeSlots) */}
                {event.requestRSVP && !event.multipleTimeSlots && (
                    <ThemedView style={styles.card}>
                        <ThemedText type="defaultSemiBold" style={[styles.rsvpTitle, { color: theme.text }]}>
                            RSVP
                        </ThemedText>
                        
                        <View style={styles.rsvpButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.rsvpButton,
                                    { 
                                        borderColor: rsvpStatus === 'going' ? '#16A34A' : theme.border,
                                        backgroundColor: rsvpStatus === 'going' ? '#EAFCEF' : theme.bg,
                                    },
                                    rsvpStatus === 'going' && styles.rsvpButtonActive,
                                ]}
                                onPress={() => handleRSVP('going')}
                                disabled={submitting}
                            >
                                <Feather 
                                    name="check-circle" 
                                    size={20} 
                                    color={rsvpStatus === 'going' ? '#16A34A' : theme.subText} 
                                />
                                <ThemedText 
                                    style={{ 
                                        marginTop: 4, 
                                        color: rsvpStatus === 'going' ? '#16A34A' : theme.subText,
                                        fontWeight: rsvpStatus === 'going' ? '600' : '400',
                                    }}
                                >
                                    Going
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.rsvpButton,
                                    { 
                                        borderColor: rsvpStatus === 'maybe' ? '#F59E0B' : theme.border,
                                        backgroundColor: rsvpStatus === 'maybe' ? '#FEF3C7' : theme.bg,
                                    },
                                    rsvpStatus === 'maybe' && styles.rsvpButtonActive,
                                ]}
                                onPress={() => handleRSVP('maybe')}
                                disabled={submitting}
                            >
                                <Feather 
                                    name="help-circle" 
                                    size={20} 
                                    color={rsvpStatus === 'maybe' ? '#F59E0B' : theme.subText} 
                                />
                                <ThemedText 
                                    style={{ 
                                        marginTop: 4, 
                                        color: rsvpStatus === 'maybe' ? '#F59E0B' : theme.subText,
                                        fontWeight: rsvpStatus === 'maybe' ? '600' : '400',
                                    }}
                                >
                                    Maybe
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.rsvpButton,
                                    { 
                                        borderColor: rsvpStatus === 'not_going' ? '#DC2626' : theme.border,
                                        backgroundColor: rsvpStatus === 'not_going' ? '#FEE2E2' : theme.bg,
                                    },
                                    rsvpStatus === 'not_going' && styles.rsvpButtonActive,
                                ]}
                                onPress={() => handleRSVP('not_going')}
                                disabled={submitting}
                            >
                                <Feather 
                                    name="x-circle" 
                                    size={20} 
                                    color={rsvpStatus === 'not_going' ? '#DC2626' : theme.subText} 
                                />
                                <ThemedText 
                                    style={{ 
                                        marginTop: 4, 
                                        color: rsvpStatus === 'not_going' ? '#DC2626' : theme.subText,
                                        fontWeight: rsvpStatus === 'not_going' ? '600' : '400',
                                    }}
                                >
                                    Not Going
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ThemedView>
                )}
            </ScrollView>
        </ThemedView>
    );
};

export default EventDetailScreen;

