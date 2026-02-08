import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmergencyIcon, SendIcon, UsersIcon } from '@/components/ui/icons/messages-icons';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';

const EmergencyAlertScreen = () => {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');
    const [pushEnabled, setPushEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [smsEnabled, setSmsEnabled] = useState(true);
    const router = useRouter();
    const theme = useStore(state => state.theme);

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
                        <TouchableOpacity key={key} style={styles.templateButton}>
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
                            <ThemedText type='subText' style={{ color: theme.tint }}>5</ThemedText>
                        </ThemedView>
                    </View>
                    <ThemedText type="subText" style={{ marginTop: 10, color: theme.subText }}>
                        {t('emergency.recipientsNote')}
                    </ThemedText>
                </ThemedView>

                {/* Send button */}
                <TouchableOpacity style={styles.sendButton}>
                    <SendIcon size={16} color='#fff' />
                    <ThemedText type='middleTitle' style={styles.sendText}>{t('emergency.sendButton')}</ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </ThemedView>
    );
};

export default EmergencyAlertScreen;
