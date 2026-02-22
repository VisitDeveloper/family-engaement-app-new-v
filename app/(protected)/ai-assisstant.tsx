import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AttachingMenu from '@/components/ui/attaching-menu';
import { ShareIcon, TranslateIcon } from '@/components/ui/icons/common-icons';
import { AiAssistantIcon, CopyIcon, RegenerateIcon, SendIcon, VoiceIcon } from '@/components/ui/icons/messages-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { detectSourceLanguage, SUPPORTED_LANGUAGES, translateText } from '@/services/translate.service';
import { ragService, type IndexedDocument } from '@/services/rag.service';
import { useStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Clipboard,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SYSTEM_GREETING = {
    id: 'system-greeting',
    type: 'system' as const,
    textKey: 'ai.greeting' as const,
    timeKey: 'ai.justNow' as const,
};

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; isTyping?: boolean; createdAt?: number };

function formatMessageTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

const URL_REGEX = /https?:\/\/[^\s]+/g;

/** Characters that often appear after a URL in text and should not be part of the link */
const URL_TRAILING_CHARS = /[.,;:!?)\]>}\]"']+$/;

function trimUrlTrailing(url: string): string {
    return url.replace(URL_TRAILING_CHARS, '');
}

type TextSegment = { type: 'text'; value: string } | { type: 'link'; value: string };

function parseContentWithLinks(content: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    const re = new RegExp(URL_REGEX.source, 'g');
    while ((m = re.exec(content)) !== null) {
        if (m.index > lastIndex) {
            segments.push({ type: 'text', value: content.slice(lastIndex, m.index) });
        }
        const raw = m[0];
        const linkUrl = trimUrlTrailing(raw);
        segments.push({ type: 'link', value: linkUrl });
        lastIndex = m.index + raw.length;
    }
    if (lastIndex < content.length) {
        segments.push({ type: 'text', value: content.slice(lastIndex) });
    }
    const raw = segments.length > 0 ? segments : ([{ type: 'text' as const, value: content }] as TextSegment[]);
    // Remove angle brackets around links: "text <" before link, ">" after link
    return raw.map((seg, i) => {
        if (seg.type !== 'text') return seg;
        let value = seg.value;
        if (i + 1 < raw.length && raw[i + 1].type === 'link' && value.endsWith('<')) value = value.slice(0, -1);
        if (i > 0 && raw[i - 1].type === 'link' && value.startsWith('>')) value = value.slice(1);
        return { type: 'text' as const, value };
    });
}

function TypingDots({ color }: { color: string }) {
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(dot1, { toValue: 1, useNativeDriver: true, duration: 200 }),
                    Animated.timing(dot2, { toValue: 0.3, useNativeDriver: true, duration: 200 }),
                    Animated.timing(dot3, { toValue: 0.3, useNativeDriver: true, duration: 200 }),
                ]),
                Animated.parallel([
                    Animated.timing(dot1, { toValue: 0.3, useNativeDriver: true, duration: 200 }),
                    Animated.timing(dot2, { toValue: 1, useNativeDriver: true, duration: 200 }),
                    Animated.timing(dot3, { toValue: 0.3, useNativeDriver: true, duration: 200 }),
                ]),
                Animated.parallel([
                    Animated.timing(dot1, { toValue: 0.3, useNativeDriver: true, duration: 200 }),
                    Animated.timing(dot2, { toValue: 0.3, useNativeDriver: true, duration: 200 }),
                    Animated.timing(dot3, { toValue: 1, useNativeDriver: true, duration: 200 }),
                ]),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [dot1, dot2, dot3]);
    return (
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: dot1 }} />
            <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: dot2 }} />
            <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: dot3 }} />
        </View>
    );
}

const QUICK_ACTION_KEYS = [
    { id: 'q1', textKey: 'ai.quickInterpret' as const },
    { id: 'q2', textKey: 'ai.quickMath' as const },
    { id: 'q3', textKey: 'ai.quickParent' as const },
    { id: 'q4', textKey: 'ai.quickGoals' as const },
];

const TeachingAssistantScreen = () => {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState('');
    const [showAttachingMenu, setShowAttachingMenu] = useState(false);
    const [sending, setSending] = useState(false);
    const [translateMessages, setTranslateMessages] = useState(false);
    const [translateSource, setTranslateSource] = useState<'auto' | string>('auto');
    const [translateTarget, setTranslateTarget] = useState<string>('en');
    const [showTranslateLangModal, setShowTranslateLangModal] = useState(false);
    const [translatedCache, setTranslatedCache] = useState<Record<string, string>>({});
    const [translateApplyKey, setTranslateApplyKey] = useState(0);
    const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
    const translatedCacheRef = useRef<Record<string, string>>({});
    const requestedTranslateRef = useRef<Set<string>>(new Set());
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const flatListRef = useRef<FlatList>(null);
    const router = useRouter();
    const [showDocumentsModal, setShowDocumentsModal] = useState(false);
    const [indexedDocuments, setIndexedDocuments] = useState<IndexedDocument[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [deletingFilename, setDeletingFilename] = useState<string | null>(null);

    const showInitialSections = chatMessages.length === 0;
    const insets = useSafeAreaInsets();
    const theme = useStore(state => state.theme);
    const inputStyles = useThemedStyles((th) => ({
        inputContainer: { flexDirection: 'row' as const, paddingVertical: 10, borderTopWidth: 1, borderColor: th.border, alignItems: 'flex-end' as const, paddingHorizontal: 15, paddingBottom: 10, backgroundColor: th.bg },
        inputWrapper: { flex: 1, flexDirection: 'row' as const, alignItems: 'flex-end' as const, gap: 8 },
        attachmentButton: { padding: 8, marginRight: 5, backgroundColor: 'rgba(215, 169, 227, 0.25)', borderRadius: 8 },
        input: { flex: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, minHeight: 40, maxHeight: 100, color: th.text, backgroundColor: th.panel || th.bg, fontSize: 14 },
        sendButton: { backgroundColor: th.tint, padding: 10, borderRadius: 8, marginLeft: 5 },
        micButton: { backgroundColor: 'transparent' as const, padding: 10, borderRadius: 8, marginLeft: 5 },
    }));
    const chatMessageStyles = useThemedStyles((th) => ({
        messageContainer: { marginVertical: 5, padding: 10, borderRadius: 10, minWidth: 180, maxWidth: '80%' },
        myMessage: { backgroundColor: th.tint, alignSelf: 'flex-end' as const },
        otherMessage: { backgroundColor: th.panel, alignSelf: 'flex-start' as const },
        messageText: { color: '#fff' },
        messageOtherText: { color: th.text },
    }));

    const handleSelectMedia = () => {
        Alert.alert(
            t('buttons.selectMedia') || 'Select Media',
            t('common.chooseOption') || 'Choose an option',
            [
                { text: t('buttons.image'), onPress: pickImage },
                { text: t('buttons.video'), onPress: pickVideo },
                { text: t('common.cancel'), style: 'cancel' as const },
            ]
        );
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('common.permissionRequired') || 'Permission Required', t('common.cameraRollPermission') || 'Camera roll permission is needed.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                // TODO: attach to AI context / send
            }
        } catch {
            Alert.alert(t('common.error') || 'Error', t('common.failedToPickImage') || 'Failed to pick image');
        }
    };

    const pickVideo = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('common.permissionRequired') || 'Permission Required', t('common.cameraRollPermission') || 'Camera roll permission is needed.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false,
                quality: 1,
            });
            if (!result.canceled && result.assets[0]) {
                // TODO: attach to AI context / send
            }
        } catch {
            Alert.alert(t('common.error') || 'Error', t('common.failedToPickVideo') || 'Failed to pick video');
        }
    };

    const handleSelectFiles = () => {
        setShowAttachingMenu(false);
        const delay = Platform.OS === 'ios' ? 600 : 400;
        setTimeout(() => pickDocument(), delay);
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets[0]) return;
            const asset = result.assets[0];
            const formData = new FormData();
            // @ts-ignore - React Native FormData expects { uri, name, type }
            formData.append('file', {
                uri: asset.uri,
                name: asset.name ?? 'document',
                type: asset.mimeType ?? 'application/octet-stream',
            });
            await ragService.uploadFile(formData);
            Alert.alert(t('common.success') || 'Success', t('ai.uploadSuccess'));
        } catch {
            Alert.alert(t('common.error') || 'Error', t('common.failedToPickDocument') || 'Failed to pick document');
        }
    };

    const loadIndexedDocuments = async () => {
        setLoadingDocuments(true);
        try {
            const res = await ragService.listDocuments();
            setIndexedDocuments(res.documents ?? []);
        } catch {
            Alert.alert(t('common.error') || 'Error', t('ai.error') || 'Could not load documents');
        } finally {
            setLoadingDocuments(false);
        }
    };

    const openDocumentsModal = () => {
        setShowDocumentsModal(true);
        loadIndexedDocuments();
    };

    const deleteIndexedDocument = (filename: string) => {
        Alert.alert(
            t('ai.deleteDocument') || 'Remove',
            t('ai.deleteDocumentConfirm') || 'Remove this document from the assistant? It will no longer be used in answers.',
            [
                { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('ai.deleteDocument') || 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingFilename(filename);
                        try {
                            await ragService.deleteDocumentsByFilenames([filename]);
                            await loadIndexedDocuments();
                        } catch {
                            Alert.alert(t('common.error') || 'Error', t('ai.error') || 'Could not remove document');
                        } finally {
                            setDeletingFilename(null);
                        }
                    },
                },
            ]
        );
    };

    const sendQuery = async (queryText: string) => {
        const trimmed = queryText.trim();
        if (!trimmed || sending) return;
        const assistantId = `assistant-${Date.now()}`;
        const now = Date.now();
        setChatMessages((prev) => [...prev, { id: `user-${now}`, role: 'user', content: trimmed, createdAt: now }, { id: assistantId, role: 'assistant', content: '', isTyping: true }]);
        setInputText('');
        setSending(true);
        try {
            const { answer } = await ragService.query(trimmed, 5);
            const content = answer?.trim() || t('ai.noResults');
            setChatMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content, isTyping: false, createdAt: Date.now() } : m));
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
        } catch {
            setChatMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: t('ai.error'), isTyping: false, createdAt: Date.now() } : m));
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
        } finally {
            setSending(false);
        }
    };

    const handleSend = () => sendQuery(inputText);

    const copyToClipboard = (text: string) => {
        Clipboard.setString(text);
        Alert.alert(t('common.copiedToClipboard') || 'Copied to clipboard');
    };

    const regenerateReply = async (assistantId: string, userContent: string) => {
        if (sending || !userContent.trim()) return;
        setSending(true);
        setChatMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: '', isTyping: true } : m));
        try {
            const { answer } = await ragService.query(userContent.trim(), 5);
            const content = answer?.trim() || t('ai.noResults');
            setChatMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content, isTyping: false, createdAt: Date.now() } : m));
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
        } catch {
            setChatMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: t('ai.error'), isTyping: false, createdAt: Date.now() } : m));
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        if (!translateMessages) return;
        const item = SYSTEM_GREETING;
        const originalText = t(item.textKey);
        if (!originalText?.trim()) return;
        if (translatedCacheRef.current[item.id] !== undefined || requestedTranslateRef.current.has(item.id)) return;
        requestedTranslateRef.current.add(item.id);
        setTranslatingIds((prev) => new Set(prev).add(item.id));
        const sourceLang = translateSource === 'auto' ? detectSourceLanguage(originalText) : translateSource;
        const itemId = item.id;
        translateText(originalText, { sourceLang, targetLang: translateTarget })
            .then((translated) => {
                translatedCacheRef.current[itemId] = translated;
                setTranslatedCache({ ...translatedCacheRef.current });
            })
            .finally(() => {
                setTranslatingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(itemId);
                    return next;
                });
            });
    }, [translateMessages, translateApplyKey, translateSource, translateTarget, t]);

    const colorScheme = useColorScheme();

    const greetingDisplayText =
        translateMessages
            ? (translatedCache[SYSTEM_GREETING.id] ?? (translatingIds.has(SYSTEM_GREETING.id) ? '…' : t(SYSTEM_GREETING.textKey)))
            : t(SYSTEM_GREETING.textKey);

    type ListItem = typeof SYSTEM_GREETING | ChatMessage;
    const listData: ListItem[] = [SYSTEM_GREETING, ...chatMessages];

    const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
        if ('type' in item && item.type === 'system') {
            return (
                <ThemedView lightColor={Colors.light.backgroundElementSecondary} darkColor={Colors.dark.backgroundElementSecondary} style={styles.greeting}>
                    <ThemedText type='subText' lightColor={Colors.light.text} darkColor={Colors.dark.text}>{greetingDisplayText}</ThemedText>
                    <View style={styles.timeContainer}>
                        <Text style={styles.time}>{t(SYSTEM_GREETING.timeKey)}</Text>
                        <ThemedView style={[styles.icongreeting, { backgroundColor: 'transparent' }]}>
                            <TouchableOpacity style={{ paddingRight: 6 }} onPress={() => copyToClipboard(greetingDisplayText)}>
                                <CopyIcon size={14} color={theme.subText} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ paddingRight: 6 }} onPress={() => sendQuery(t('ai.greeting'))}>
                                <RegenerateIcon size={14} color={theme.subText} />
                            </TouchableOpacity>
                        </ThemedView>
                    </View>
                </ThemedView>
            );
        }
        if ('role' in item && (item.role === 'user' || item.role === 'assistant')) {
            const isUser = item.role === 'user';
            const isTyping = 'isTyping' in item && item.isTyping;
            const createdAt = 'createdAt' in item ? item.createdAt : undefined;
            return (
                <View style={[chatMessageStyles.messageContainer, isUser ? chatMessageStyles.myMessage : chatMessageStyles.otherMessage]}>
                    {isTyping ? (
                        <TypingDots color={theme.text} />
                    ) : (
                        <Text style={isUser ? chatMessageStyles.messageText : chatMessageStyles.messageOtherText}>
                            {parseContentWithLinks(item.content).map((seg, i) =>
                                seg.type === 'link' ? (
                                    <Text
                                        key={i}
                                        style={[
                                            isUser ? styles.linkInMyMessage : styles.linkInOtherMessage,
                                            isUser ? chatMessageStyles.messageText : [chatMessageStyles.messageOtherText, { color: theme.tint }]
                                        ]}
                                        onPress={() => Linking.openURL(seg.value)}
                                    >
                                        {seg.value}
                                    </Text>
                                ) : (
                                    <Text key={i}>{seg.value}</Text>
                                )
                            )}
                        </Text>
                    )}
                    {!isTyping && (
                        <View style={styles.messageTimeRow}>
                            <Text style={[styles.messageTime, { color: isUser ? 'rgba(255,255,255,0.8)' : theme.subText }]}>
                                {createdAt != null && createdAt > 0 ? formatMessageTime(createdAt) : ''}
                            </Text>
                            {!isUser && (
                                <View style={styles.messageActions}>
                                    <TouchableOpacity style={styles.messageActionBtn} onPress={() => copyToClipboard(item.content)}>
                                        <CopyIcon size={14} color={theme.subText} />
                                    </TouchableOpacity>
                                    {index > 0 && 'role' in listData[index - 1] && (listData[index - 1] as ChatMessage).role === 'user' && (
                                        <TouchableOpacity
                                            style={styles.messageActionBtn}
                                            onPress={() => regenerateReply(item.id, (listData[index - 1] as ChatMessage).content)}
                                            disabled={sending}
                                        >
                                            <RegenerateIcon size={14} color={theme.subText} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            );
        }
        return null;
    };
    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <KeyboardAvoidingView
                style={{ flex: 1, }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                {/* Header */}
                <ThemedView style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? Colors.dark.borderColor : Colors.light.borderColor }]}  >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={20} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} style={{ paddingTop: 0 }} />
                    </TouchableOpacity>
                    <View style={styles.logoContainer}>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <View style={{ backgroundColor: theme.tint, borderRadius: 25, width: 42, height: 42, justifyContent: "center", alignItems: "center" }}>
                                <AiAssistantIcon size={24} color='#ffffff' />
                            </View>
                            <View style={{ flexDirection: 'column', marginRight: 20 }}>
                                <ThemedText type='subtitle' style={styles.title}>{t('ai.title')}</ThemedText>
                                <ThemedText type='subText' style={[styles.subtitle, { color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }]}>{t('ai.subtitle')}</ThemedText>
                            </View>
                        </View>

                        <TouchableOpacity onPress={openDocumentsModal} style={{ padding: 4 }}>
                            <Ionicons name="document-text-outline" size={22} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowTranslateLangModal(true)}>
                            <TranslateIcon size={24} color={translateMessages ? theme.tint : theme.text} />
                        </TouchableOpacity>
                    </View>
                </ThemedView>


                <FlatList
                    ref={flatListRef}
                    data={listData}
                    keyExtractor={(item) => ('role' in item ? item.id : item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15, paddingBottom: 16, flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                />

                {showInitialSections && (
                    <View style={{ paddingHorizontal: 15, paddingVertical: 12, paddingBottom: 8 }}>
                        <View style={styles.quickActionsBlock}>
                            <Text style={[styles.quickActionsTitle, { color: theme.subText }]}>{t('ai.quickActionsTitle')}</Text>
                            {QUICK_ACTION_KEYS.map((q) => (
                                <TouchableOpacity
                                    key={q.id}
                                    style={styles.actionButton}
                                    onPress={() => sendQuery(t(q.textKey))}
                                    disabled={sending}
                                >
                                    <Text style={styles.actionText}>{t(q.textKey)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={[styles.uploadButton, { marginBottom: 8 }]}
                            onPress={() => pickDocument()}
                            disabled={sending}
                        >
                            <ShareIcon size={16} color={Colors.light.tint} />
                            <Text style={styles.uploadText}>{t('ai.uploadReport')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.uploadButton, { marginBottom: 8, borderStyle: 'dashed' }]}
                            onPress={openDocumentsModal}
                            disabled={sending}
                        >
                            <Ionicons name="document-text-outline" size={18} color={Colors.light.tint} />
                            <Text style={styles.uploadText}>{t('ai.manageData')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Input — same as chat, no poll/announcement */}
                <View style={[inputStyles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                    <View style={inputStyles.inputWrapper}>
                        {/* <TouchableOpacity
                            style={inputStyles.attachmentButton}
                            onPress={() => setShowAttachingMenu(true)}
                            disabled={sending}
                        >
                            <Ionicons
                                name="add"
                                size={24}
                                color={sending ? theme.subText : theme.text}
                            />
                        </TouchableOpacity> */}
                        <TextInput
                            style={inputStyles.input}
                            placeholder={t('placeholders.askAnything')}
                            placeholderTextColor={theme.subText || theme.text + '80'}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            blurOnSubmit={false}
                            editable={!sending}
                            textAlignVertical="top"
                        />
                    </View>
                    {/* <TouchableOpacity
                        style={inputStyles.micButton}
                        disabled={sending}
                    >
                        <VoiceIcon
                            color={theme.text || 'rgba(18, 18, 18, 1)'}
                            size={20}
                        />
                    </TouchableOpacity> */}
                    <TouchableOpacity
                        style={[inputStyles.sendButton, (sending || !inputText.trim()) && { opacity: 0.5 }]}
                        onPress={handleSend}
                        disabled={sending || !inputText.trim()}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <SendIcon color="#fff" size={16} />
                        )}
                    </TouchableOpacity>
                </View>

                <AttachingMenu
                    visible={showAttachingMenu}
                    onClose={() => setShowAttachingMenu(false)}
                    onSelectPoll={() => { }}
                    onSelectMedia={handleSelectMedia}
                    onSelectFiles={handleSelectFiles}
                    isGroup={false}
                />

                {/* Manage indexed documents modal */}
                <Modal
                    visible={showDocumentsModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowDocumentsModal(false)}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }]}>
                        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDocumentsModal(false)} />
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            style={[styles.documentsModalBox, { backgroundColor: theme.panel || theme.bg, paddingBottom: insets.bottom + 16 }]}
                        >
                            <View style={[styles.documentsModalHeader, { borderBottomColor: theme.border }]}>
                                <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>{t('ai.myDocuments')}</ThemedText>
                                <TouchableOpacity onPress={() => setShowDocumentsModal(false)} hitSlop={12}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                            {loadingDocuments ? (
                                <View style={styles.documentsModalLoading}>
                                    <ActivityIndicator size="large" color={theme.tint} />
                                </View>
                            ) : indexedDocuments.length === 0 ? (
                                <Text style={[styles.documentsModalEmpty, { color: theme.subText }]}>{t('ai.noDocuments')}</Text>
                            ) : (
                                <FlatList
                                    data={indexedDocuments}
                                    keyExtractor={(item) => item.filename}
                                    style={{ maxHeight: 320 }}
                                    renderItem={({ item }) => {
                                        const isDeleting = deletingFilename === item.filename;
                                        const displayName = item.filename.length > 50 ? item.filename.slice(0, 47) + '…' : item.filename;
                                        return (
                                            <View style={[styles.documentRow, { borderBottomColor: theme.border }]}>
                                                <View style={{ flex: 1, minWidth: 0 }}>
                                                    <Text style={[styles.documentRowName, { color: theme.text }]} numberOfLines={2}>{displayName}</Text>
                                                    <Text style={[styles.documentRowMeta, { color: theme.subText }]}>{item.chunk_count} {item.chunk_count === 1 ? 'chunk' : 'chunks'}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={[styles.documentRowDelete, isDeleting && { opacity: 0.6 }]}
                                                    onPress={() => !isDeleting && deleteIndexedDocument(item.filename)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? (
                                                        <ActivityIndicator size="small" color={theme.tint} />
                                                    ) : (
                                                        <Ionicons name="trash-outline" size={22} color={theme.tint} />
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    }}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/* Translate messages modal */}
                <Modal
                    visible={showTranslateLangModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowTranslateLangModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }]}
                        onPress={() => setShowTranslateLangModal(false)}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            style={[styles.translateModalBox, { backgroundColor: theme.panel || theme.bg }]}
                        >
                            <Text style={[styles.translateModalTitle, { color: theme.text }]}>{t('translate.modalTitle')}</Text>
                            <Text style={[styles.translateModalLabel, { color: theme.subText }]}>{t('translate.fromSource')}</Text>
                            <ScrollView style={styles.translateModalList} showsVerticalScrollIndicator={false}>
                                <TouchableOpacity
                                    style={[styles.translateModalRow, translateSource === 'auto' && { backgroundColor: theme.tint + '30' }]}
                                    onPress={() => setTranslateSource('auto')}
                                >
                                    <Text style={{ color: theme.text, fontSize: 16 }}>{t('translate.autoDetect')}</Text>
                                    {translateSource === 'auto' && <Ionicons name="checkmark-circle" size={22} color={theme.tint} />}
                                </TouchableOpacity>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[styles.translateModalRow, translateSource === lang.code && { backgroundColor: theme.tint + '30' }]}
                                        onPress={() => setTranslateSource(lang.code)}
                                    >
                                        <Text style={{ color: theme.text, fontSize: 16 }}>{lang.label}</Text>
                                        {translateSource === lang.code && <Ionicons name="checkmark-circle" size={22} color={theme.tint} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <Text style={[styles.translateModalLabel, { color: theme.subText, marginTop: 12 }]}>{t('translate.toTarget')}</Text>
                            <ScrollView style={styles.translateModalList} showsVerticalScrollIndicator={false}>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[styles.translateModalRow, translateTarget === lang.code && { backgroundColor: theme.tint + '30' }]}
                                        onPress={() => setTranslateTarget(lang.code)}
                                    >
                                        <Text style={{ color: theme.text, fontSize: 16 }}>{lang.label}</Text>
                                        {translateTarget === lang.code && <Ionicons name="checkmark-circle" size={22} color={theme.tint} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <View style={styles.translateModalActions}>
                                {translateMessages && (
                                    <TouchableOpacity
                                        style={[styles.translateModalOffBtn, { borderColor: theme.border }]}
                                        onPress={() => {
                                            setTranslateMessages(false);
                                            setShowTranslateLangModal(false);
                                        }}
                                    >
                                        <Text style={{ color: theme.subText, fontSize: 14 }}>{t('translate.turnOff')}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.translateModalApplyBtn, { backgroundColor: theme.tint }]}
                                    onPress={() => {
                                        translatedCacheRef.current = {};
                                        setTranslatedCache({});
                                        requestedTranslateRef.current = new Set();
                                        setTranslateApplyKey((k) => k + 1);
                                        setTranslateMessages(true);
                                        setShowTranslateLangModal(false);
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{t('buttons.apply')}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#fff'
        marginBottom: 10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        gap: 10,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 5
    },
    backText: {
        fontSize: 18
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    logo: {
        width: 50,
        height: 50,
        backgroundColor: Colors.light.tint,
        padding: 10,
        borderRadius: 25,
        color: '#fff',
        textAlign: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    subtitle: {
        fontSize: 12,
        // color: '#666'
    },
    greeting: {
        minWidth: 200,
        maxWidth: 300,
        fontSize: 16,
        // color: '#333',
        marginBottom: 10,
        padding: 10,
        borderRadius: 15,
        // backgroundColor: '#f9f9f9'
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 15,
        paddingBottom: 8
    },
    time: {
        fontSize: 11,
        color: '#999',
        textAlign: 'left',
        marginTop: 15
    },
    messageTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingBottom: 2
    },
    messageTime: {
        fontSize: 10
    },
    messageActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    messageActionBtn: {
        padding: 4
    },
    linkInMyMessage: {
        textDecorationLine: 'underline',
        opacity: 0.95
    },
    linkInOtherMessage: {
        textDecorationLine: 'underline'
    },
    icongreeting: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 15
    },
    quickActionsBlock: {
        marginTop: 8,
        marginBottom: 12,
    },
    quickActionsTitle: {
        fontSize: 14,
        marginBottom: 8,
    },
    actionButton: {
        backgroundColor: 'transparent',
        borderColor: Colors.light.tint,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginVertical: 5,
        borderRadius: 5,
        alignSelf: 'flex-start'
    },
    actionText: {
        // fontSize: 16,
        color: Colors.light.tint
    },
    uploadButton: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.tint, padding: 10,
        borderRadius: 8, marginTop: 10
    },

    uploadText: {
        color: Colors.light.tint,
        fontSize: 14
    },
    translateModalBox: { width: '100%', maxWidth: 340, borderRadius: 16, padding: 20 },
    translateModalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
    translateModalLabel: { fontSize: 12, marginBottom: 6 },
    translateModalList: { maxHeight: 140 },
    translateModalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4 },
    translateModalActions: { marginTop: 20, gap: 10 },
    translateModalOffBtn: { paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1 },
    translateModalApplyBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 10 },
    documentsModalBox: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingHorizontal: 20 },
    documentsModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1 },
    documentsModalLoading: { paddingVertical: 40, alignItems: 'center' },
    documentsModalEmpty: { paddingVertical: 32, textAlign: 'center', fontSize: 14 },
    documentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    documentRowName: { fontSize: 14 },
    documentRowMeta: { fontSize: 12, marginTop: 2 },
    documentRowDelete: { padding: 8, marginLeft: 8 },
});

export default TeachingAssistantScreen;
