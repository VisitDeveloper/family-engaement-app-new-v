import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmergencyIcon } from '@/components/ui/icons/messages-icons';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { EmergencyMessageDto, messagingService } from '@/services/messaging.service';
import { useStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EmergencyNotificationsScreen = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const theme = useStore(state => state.theme);
    const insets = useSafeAreaInsets();
    const [emergencyMessages, setEmergencyMessages] = useState<EmergencyMessageDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const styles = useThemedStyles((theme) => ({
        container: { flex: 1, backgroundColor: theme.bg },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            paddingHorizontal: 15,
            paddingVertical: 12,
            backgroundColor: theme.emergencyBackground,
            borderBottomWidth: 1,
            borderColor: theme.border,
            gap: 12,
            // paddingTop: insets.top + 12,
        },
        headerContent: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        backButton: { padding: 5, flexShrink: 0 },
        title: { color: "#9F0712", fontSize: 20, fontWeight: '600' },
        subtitle: { color: "#E7000B", fontSize: 14 },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
        },
        emptyIcon: { marginBottom: 20 },
        emptyText: { color: theme.subText, textAlign: 'center', fontSize: 16, marginBottom: 8 },
        emptySubText: { color: theme.subText, textAlign: 'center', fontSize: 14 },
        listContent: { paddingBottom: 20 },
        messageItem: {
            backgroundColor: theme.bg,
            borderWidth: 1,
            borderColor: theme.border,
            marginHorizontal: 15,
            marginTop: 15,
            borderRadius: 12,
            padding: 15,
            // borderLeftWidth: 4,
            // borderLeftColor: theme.emergencyColor,
            elevation: 3,
        },
        messageHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 10,
        },
        messageContent: {
            color: theme.text,
            fontSize: 15,
            lineHeight: 22,
            marginBottom: 12,
        },
        messageMeta: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        senderInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        senderName: {
            color: theme.subText,
            fontSize: 13,
        },
        timeText: {
            color: theme.subText,
            fontSize: 12,
        },
        deliveryMethods: {
            flexDirection: 'row',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 8,
        },
        deliveryBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: theme.bg,
            borderWidth: 1,
            borderColor: theme.border,
        },
        deliveryBadgeText: {
            color: theme.subText,
            fontSize: 11,
        },
        recipientsCount: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        recipientsText: {
            color: theme.tint,
            fontSize: 12,
            fontWeight: '500',
        },
    }));

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('common.justNow') || 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return t('common.yesterday') || 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const getSenderName = (message: EmergencyMessageDto): string => {
        if (message.createdBy) {
            const fullName = `${message.createdBy.firstName || ''} ${message.createdBy.lastName || ''}`.trim();
            return fullName || message.createdBy.email || t('emergency.unknownSender') || 'Unknown';
        }
        return t('emergency.unknownSender') || 'Unknown';
    };

    const loadEmergencyMessages = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        try {
            if (!append) {
                setLoading(true);
            }

            const response = await messagingService.getEmergencyMessages({
                page: pageNum,
                limit: 20,
            });

            if (append) {
                setEmergencyMessages(prev => [...prev, ...response.emergencyMessages]);
            } else {
                setEmergencyMessages(response.emergencyMessages);
            }

            setHasMore(response.emergencyMessages.length === 20);
            setPage(pageNum);
        } catch (error: any) {
            console.error('Error loading emergency messages:', error);
            if (!append) {
                Alert.alert(
                    t('common.error'),
                    error.message || t('emergency.loadError') || 'Failed to load emergency notifications'
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            loadEmergencyMessages(1, false);
        }, [loadEmergencyMessages])
    );

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadEmergencyMessages(1, false);
    }, [loadEmergencyMessages]);

    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore && !refreshing) {
            loadEmergencyMessages(page + 1, true);
        }
    }, [loading, hasMore, refreshing, page, loadEmergencyMessages]);

    const renderMessageItem = ({ item }: { item: EmergencyMessageDto }) => {
        const deliveryMethods = [];
        if (item.sendPushNotification) {
            deliveryMethods.push(t('emergency.pushNotifications') || 'Push');
        }
        if (item.sendEmail) {
            deliveryMethods.push(t('emergency.emailAlerts') || 'Email');
        }
        if (item.sendSMS) {
            deliveryMethods.push(t('emergency.smsMessages') || 'SMS');
        }

        return (
            <View style={styles.messageItem}>
                <View style={styles.messageHeader}>
                    <View style={{ flex: 1 }}>
                        <ThemedText type="subtitle" style={{ color: theme.emergencyColor, marginBottom: 4 }}>
                            {t('emergency.emergencyAlert') || 'Emergency Alert'}
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={styles.timeText}>
                        {formatTime(item.createdAt)}
                    </ThemedText>
                </View>

                <ThemedText type="body" style={styles.messageContent}>
                    {item.content}
                </ThemedText>

                {deliveryMethods.length > 0 && (
                    <View style={styles.deliveryMethods}>
                        {deliveryMethods.map((method, index) => (
                            <View key={index} style={styles.deliveryBadge}>
                                <ThemedText type="subText" style={styles.deliveryBadgeText}>
                                    {method}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                )}

                {/* <View style={styles.messageMeta}>
                    <View style={styles.senderInfo}>
                        <Ionicons name="person-outline" size={14} color={theme.subText} />
                        <ThemedText type="subText" style={styles.senderName}>
                            {getSenderName(item)}
                        </ThemedText>
                    </View>
                    <View style={styles.recipientsCount}>
                        <Ionicons name="people-outline" size={14} color={theme.tint} />
                        <ThemedText type="subText" style={styles.recipientsText}>
                            {item.recipientsCount} {t('emergency.recipients') || 'recipients'}
                        </ThemedText>
                    </View>
                </View> */}
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <EmergencyIcon size={64} color={theme.subText} style={styles.emptyIcon} />
            <ThemedText type="subtitle" style={styles.emptyText}>
                {t('emergency.noNotifications') || 'No Emergency Notifications'}
            </ThemedText>
            <ThemedText type="subText" style={styles.emptySubText}>
                {t('emergency.noNotificationsDesc') || 'No emergency alerts have been sent yet.'}
            </ThemedText>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <EmergencyIcon color={theme.emergencyColor} size={28} />
                    <View>
                        <ThemedText type="title" style={styles.title}>
                            {t('emergency.notificationsTitle') || 'Emergency Notifications'}
                        </ThemedText>
                        <ThemedText type="subText" style={styles.subtitle}>
                            {t('emergency.notificationsSubtitle') || 'View all emergency alerts'}
                        </ThemedText>
                    </View>
                </View>
            </View>

            {/* List */}
            {loading && emergencyMessages.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            ) : (
                <FlatList
                    data={emergencyMessages}
                    renderItem={renderMessageItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        emergencyMessages.length === 0 && { flex: 1 }
                    ]}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.tint}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </ThemedView>
    );
};

export default EmergencyNotificationsScreen;
