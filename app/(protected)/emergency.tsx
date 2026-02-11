import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmergencyIcon, SendIcon, UsersIcon } from '@/components/ui/icons/messages-icons';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { messagingService } from '@/services/messaging.service';
import { userService } from '@/services/user.service';
import { useStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ActivityIndicator, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

const EmergencyAlertScreen = () => {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');
    const [pushEnabled, setPushEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [smsEnabled, setSmsEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [recipientsCount, setRecipientsCount] = useState<number | null>(null);
    const [loadingRecipients, setLoadingRecipients] = useState(true);
    const router = useRouter();
    const theme = useStore(state => state.theme);
    const currentUser = useStore(state => state.user);
    const currentUserId = currentUser?.id;
    const currentUserRole = currentUser?.role;

    const styles = useThemedStyles((theme) => ({
        container: { flex: 1, backgroundColor: theme.bg },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: theme.emergencyBackground,
            borderBottomWidth: 1,
            borderColor: "transparent",
            gap: 12
        },
        logoContainer: {
            flex: 1,
            alignItems: 'center',
            flexDirection: 'row',
            gap: 14,
            height: 70,
        },
        logo: { marginLeft: 8, color: theme.emergencyColor, textAlign: 'center' },
        backButton: { padding: 5, flexShrink: 0 },
        title: { color: "#9F0712", marginLeft: 0 },
        subtitle: { color: "#E7000B", marginLeft: 0 },
        alertDescriptionContainer: {
            padding: 15,
            marginBottom: 15,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            marginHorizontal: 10,
            marginTop: 15,
            backgroundColor: theme.bg,
        },
        alertDescription: { color: theme.text },
        section: {
            padding: 15,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 10,
            marginHorizontal: 10,
            backgroundColor: theme.bg,
        },
        sectionTitle: { marginBottom: 10, marginTop: 0, color: theme.text, fontWeight: 600 },
        messageInput: {
            height: 100,
            // borderWidth: 1,
            // borderColor: theme.border,
            borderRadius: 5,
            padding: 10,
            backgroundColor: theme.panel,
            textAlignVertical: 'top',
            marginBottom: 5,
            color: theme.text,
        },
        charCount: { color: theme.subText, textAlign: 'right' },
        templateButton: {
            padding: 10,
            borderRadius: 5,
            marginBottom: 5,
            borderWidth: 1,
            borderColor: theme.tint,
            backgroundColor: theme.bg,
        },
        templateText: { color: theme.tint },
        deliveryOption: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
            marginTop: 5,
            backgroundColor: theme.bg
        },
        optionText: { color: theme.text, fontWeight: 500 },
        optionSubText: { color: theme.subText },
        recipientsBox: {
            paddingHorizontal: 10,
            paddingVertical: 2,
            borderRadius: 5,
            flexDirection: 'row',
            gap: 4,
            alignItems: 'center',
            alignSelf: 'flex-start',
            borderColor: theme.tint,
            borderWidth: 1,
            backgroundColor: theme.bg,
        },
        sendButton: {
            // backgroundColor: theme.emergencyColor,
            backgroundColor: "#E7000B",
            padding: 10,
            alignItems: 'center',
            margin: 15,
            borderRadius: 5,
            // height: 50,
            justifyContent: 'center',
            flexDirection: "row",
            gap: 8
        },
        sendButtonDisabled: {
            backgroundColor: theme.border,
            opacity: 0.6,
        },
        sendText: { color: '#fff' },
    }) as const);

    const loadRecipientsCount = useCallback(async () => {
        if (!currentUserRole || (currentUserRole !== 'admin' && currentUserRole !== 'teacher')) {
            setLoadingRecipients(false);
            return;
        }

        try {
            setLoadingRecipients(true);
            
            // Determine filter parameters based on user role (same logic as new-message.tsx)
            let apiParams: {
                page: number;
                limit: number;
                role?: 'parent' | 'teacher' | 'student' | ('parent' | 'teacher' | 'student')[];
            } = {
                page: 1,
                limit: 1000, // Get a large number to count all recipients
            };

            // If teacher, only get parents
            if (currentUserRole === 'teacher') {
                apiParams.role = ['parent'];
            }
            // If admin, get all roles (parent, teacher, student)
            else if (currentUserRole === 'admin') {
                apiParams.role = ['parent', 'teacher', 'student'];
            }

            const response = await userService.getAll(apiParams);

            // Filter out current user and admins (same as new-message.tsx)
            const filteredUsers = response.users.filter((user) => {
                if (user.id === currentUserId) return false;
                if (user.role === 'admin') return false;
                return true;
            });

            // Calculate total recipients
            // If we got all users in one page (users.length >= total), use filtered count
            // Otherwise, estimate by subtracting excluded users from total
            let totalRecipients = filteredUsers.length;
            
            if (response.total) {
                // Check if we got all users in the first page
                const excludedInPage = response.users.filter(u => 
                    u.id === currentUserId || u.role === 'admin'
                ).length;
                
                if (response.users.length >= response.total) {
                    // We got all users, use filtered count
                    totalRecipients = filteredUsers.length;
                } else {
                    // Estimate: total minus excluded users in this page
                    // This is an approximation - exact count will come from API when sending
                    totalRecipients = Math.max(0, response.total - excludedInPage);
                }
            }

            setRecipientsCount(totalRecipients);
        } catch (error: any) {
            console.error('Error loading recipients count:', error);
            // Don't show error to user, just set to null
            setRecipientsCount(null);
        } finally {
            setLoadingRecipients(false);
        }
    }, [currentUserRole, currentUserId]);

    useEffect(() => {
        loadRecipientsCount();
    }, [loadRecipientsCount]);

    const handleTemplateClick = (templateKey: string) => {
        const templateText = t(templateKey);
        setMessage(templateText);
    };

    const handleSend = async () => {
        // Validation
        if (!message.trim()) {
            Alert.alert(
                t('common.error'),
                t('emergency.emptyMessage') || 'Please enter a message'
            );
            return;
        }

        if (!pushEnabled && !emailEnabled && !smsEnabled) {
            Alert.alert(
                t('common.error'),
                t('emergency.noDeliveryMethod') || 'Please select at least one delivery method'
            );
            return;
        }

        // Confirm before sending
        Alert.alert(
            t('emergency.confirmTitle') || 'Confirm Emergency Alert',
            t('emergency.confirmMessage') || 'Are you sure you want to send this emergency alert to all recipients?',
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('emergency.sendButton'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            
                            const result = await messagingService.sendEmergencyMessage({
                                content: message.trim(),
                                sendPushNotification: pushEnabled,
                                sendEmail: emailEnabled,
                                sendSMS: smsEnabled,
                            });

                            // Update recipient count with actual count from API
                            setRecipientsCount(result.recipientsCount);

                            // Show simple success message
                            Alert.alert(
                                t('common.success'),
                                t('emergency.sendSuccess', { count: result.recipientsCount }) || 
                                `Emergency alert sent to ${result.recipientsCount} recipients`,
                                [
                                    {
                                        text: t('common.ok'),
                                        onPress: () => {
                                            // Reset form (keep recipientsCount updated)
                                            setMessage('');
                                            setPushEnabled(false);
                                            setEmailEnabled(false);
                                            setSmsEnabled(true);
                                        },
                                    },
                                ]
                            );
                        } catch (error: any) {
                            console.error('Error sending emergency message:', error);
                            Alert.alert(
                                t('common.error'),
                                error.message || t('emergency.sendError') || 'Failed to send emergency alert. Please try again.'
                            );
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={20} color={'#000'} />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <EmergencyIcon color={theme.emergencyColor} size={36} />
                    <View style={{ flexDirection: 'column', marginRight: 20 }}>
                        <ThemedText type='subtitle' style={styles.title}>{t('emergency.title')}</ThemedText>
                        <ThemedText type='subText' style={[styles.subtitle,]}>
                            {t('emergency.subtitle')}
                        </ThemedText>
                    </View>
                </View>
            </View>

            <ScrollView
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
            >
                {/* Alert description */}
                <ThemedView style={styles.alertDescriptionContainer}>
                    <ThemedText type='subText' style={styles.alertDescription}>
                        {t('emergency.alertDescription')}
                    </ThemedText>
                </ThemedView>

                {/* Alert message */}
                <ThemedView style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle} >
                        {t('emergency.alertMessage')}
                    </ThemedText>
                    <TextInput
                        style={styles.messageInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder={t('placeholders.emergencyMessage')}
                        placeholderTextColor={theme.subText}
                        multiline
                    />
                    <ThemedText type='subText' style={styles.charCount}>{t('emergency.charCount', { count: message.length })}</ThemedText>

                    <ThemedText type="subText" style={styles.sectionTitle} >
                        {t('emergency.quickTemplates')}
                    </ThemedText>
                    {['emergency.template1', 'emergency.template2', 'emergency.template3', 'emergency.template4'].map((key) => (
                        <TouchableOpacity 
                            key={key} 
                            style={styles.templateButton}
                            onPress={() => handleTemplateClick(key)}
                            disabled={loading}
                        >
                            <ThemedText type='subText' style={styles.templateText}>{t(key)}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ThemedView>

                {/* Delivery methods */}
                <ThemedView style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle} >
                        {t('emergency.deliveryMethods')}
                    </ThemedText>
                    {[
                        {
                            labelKey: 'emergency.pushNotifications',
                            subKey: 'emergency.pushSub',
                            value: pushEnabled,
                            setter: setPushEnabled,
                        },
                        {
                            labelKey: 'emergency.emailAlerts',
                            subKey: 'emergency.emailSub',
                            value: emailEnabled,
                            setter: setEmailEnabled,
                        },
                        {
                            labelKey: 'emergency.smsMessages',
                            subKey: 'emergency.smsSub',
                            value: smsEnabled,
                            setter: setSmsEnabled,
                        },
                    ].map((opt) => (
                        <ThemedView key={opt.labelKey} style={styles.deliveryOption}>
                            <View>
                                <ThemedText type='middleTitle' style={styles.optionText}>{t(opt.labelKey)}</ThemedText>
                                <ThemedText type='subText' style={styles.optionSubText}>{t(opt.subKey)}</ThemedText>
                            </View>
                            <Switch
                                trackColor={{ false: theme.border, true: theme.tint }}
                                thumbColor="#f4f3f4"
                                onValueChange={opt.setter}
                                value={opt.value}
                            />
                        </ThemedView>
                    ))}
                </ThemedView>

                {/* Recipients */}
                <ThemedView style={styles.section}>
                    <View
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            {t('emergency.recipients')}
                        </ThemedText>
                        <ThemedView style={styles.recipientsBox}>
                            <UsersIcon size={18} color={theme.tint} />
                            {loadingRecipients ? (
                                <ActivityIndicator size="small" color={theme.tint} />
                            ) : (
                                <ThemedText type='subText' style={{ color: theme.tint }}>
                                    {recipientsCount !== null ? recipientsCount : '...'}
                                </ThemedText>
                            )}
                        </ThemedView>
                    </View>
                    <ThemedText type="subText" style={{ marginTop: 10, color: theme.subText }}>
                        {t('emergency.recipientsNote')}
                    </ThemedText>
                </ThemedView>

                {/* Send button */}
                <TouchableOpacity 
                    style={[
                        styles.sendButton,
                        (loading || !message.trim() || (!pushEnabled && !emailEnabled && !smsEnabled)) && styles.sendButtonDisabled
                    ]}
                    onPress={handleSend}
                    disabled={loading || !message.trim() || (!pushEnabled && !emailEnabled && !smsEnabled)}
                >
                    {loading ? (
                        <ActivityIndicator color='#fff' size="small" />
                    ) : (
                        <>
                            <SendIcon size={16} color='#fff' />
                            <ThemedText type='middleTitle' style={styles.sendText}>{t('emergency.sendButton')}</ThemedText>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </ThemedView>
    );
};

export default EmergencyAlertScreen;
