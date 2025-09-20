import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EmergencyAlertScreen = () => {
    const [message, setMessage] = useState('');
    const [pushEnabled, setPushEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [smsEnabled, setSmsEnabled] = useState(true);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useStore(state => state.theme);

    const styles = useThemedStyles((theme) => ({
        container: { flex: 1,  backgroundColor: theme.bg },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: theme.emergencyBackground,
            borderBottomWidth: 1,
            borderColor: theme.border,
        },
        logoContainer: {
            flex: 1,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 20,
            height: 70,
        },
        logo: { marginLeft: 15, color: theme.emergencyColor, textAlign: 'center' },
        backButton: { padding: 5 },
        title: { color: theme.emergencyColor, marginLeft: 5 },
        subtitle: { color: theme.emergencyColor, marginLeft: 5 },
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
        sectionTitle: { marginBottom: 10, marginTop: 10, color: theme.text, fontWeight: 600 },
        messageInput: {
            height: 100,
            borderWidth: 1,
            borderColor: theme.border,
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
            padding: 10,
            borderRadius: 5,
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center',
            alignSelf: 'flex-start',
            borderColor: theme.tint,
            borderWidth: 1,
            backgroundColor: theme.bg,
        },
        sendButton: {
            backgroundColor: theme.emergencyColor,
            padding: 10,
            alignItems: 'center',
            margin: 15,
            borderRadius: 5,
            height: 50,
            justifyContent: 'center',
        },
        sendText: { color: '#fff' },
    }) as const);

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={20} color={'#000'} />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <AntDesign style={styles.logo} name="warning" size={24} />
                    <View style={{ flexDirection: 'column', marginRight: 20 }}>
                        <ThemedText type='subtitle' style={styles.title}>Emergency Alert</ThemedText>
                        <ThemedText type='subText' style={styles.subtitle}>
                            Send urgent notifications to all families
                        </ThemedText>
                    </View>
                </View>
            </View>

            <ScrollView
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
                {/* Alert description */}
                <ThemedView style={styles.alertDescriptionContainer}>
                    <ThemedText type='subText' style={styles.alertDescription}>
                        Emergency alerts will bypass normal notification settings and be delivered
                        immediately to all recipients.
                    </ThemedText>
                </ThemedView>

                {/* Alert message */}
                <ThemedView style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle} >
                        Alert Message
                    </ThemedText>
                    <TextInput
                        style={styles.messageInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Enter your emergency message..."
                        placeholderTextColor={theme.subText}
                        multiline
                    />
                    <ThemedText type='subText' style={styles.charCount}>{`${message.length}/500 characters`}</ThemedText>

                    <ThemedText type="subText" style={styles.sectionTitle} >
                        Quick Templates:
                    </ThemedText>
                    {[
                        'School lockdown - all students are safe and s...',
                        'Weather alert - early dismissal at 2:00 PM du...',
                        'Medical emergency resolved - all students ar...',
                        'Transportation delay - buses running 30 minu...',
                    ].map((tpl, idx) => (
                        <TouchableOpacity key={tpl} style={styles.templateButton}>
                            <ThemedText type='subText' style={styles.templateText}>{tpl}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ThemedView>

                {/* Delivery methods */}
                <ThemedView style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionTitle} >
                        Delivery Methods
                    </ThemedText>
                    {[
                        {
                            label: 'Push Notifications',
                            sub: 'Instant mobile alerts',
                            value: pushEnabled,
                            setter: setPushEnabled,
                        },
                        {
                            label: 'Email Alerts',
                            sub: 'Send to registered email addresses',
                            value: emailEnabled,
                            setter: setEmailEnabled,
                        },
                        {
                            label: 'SMS Messages',
                            sub: 'Text message alerts',
                            value: smsEnabled,
                            setter: setSmsEnabled,
                        },
                    ].map((opt, idx) => (
                        <ThemedView key={opt.label} style={styles.deliveryOption}>
                            <View>
                                <ThemedText type='middleTitle' style={styles.optionText}>{opt.label}</ThemedText>
                                <ThemedText type='subText' style={styles.optionSubText}>{opt.sub}</ThemedText>
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
                            Recipients
                        </ThemedText>
                        <ThemedView style={styles.recipientsBox}>
                            <Feather name="users" size={18} color={theme.text} />
                            <ThemedText type='subText'>5</ThemedText>
                        </ThemedView>
                    </View>
                    <ThemedText type="subText" style={{ marginTop: 10, color: theme.subText }}>
                        This alert will be sent to all 5 family members across all classes.
                    </ThemedText>
                </ThemedView>

                {/* Send button */}
                <TouchableOpacity style={styles.sendButton}>
                    <ThemedText type='middleTitle' style={styles.sendText}>Send Emergency Alert</ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </ThemedView>
    );
};

export default EmergencyAlertScreen;
