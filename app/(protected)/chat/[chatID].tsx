import HeaderThreeSections from "@/components/reptitive-component/header-three-sections";
import AttachingMenu from "@/components/ui/attaching-menu";
import CreatePollBottomSheet from "@/components/ui/create-poll-bottom-sheet";
import { TranslateIcon } from "@/components/ui/icons/common-icons";
import { SendIcon, VoiceIcon } from "@/components/ui/icons/messages-icons";
import MessageActionsMenu from "@/components/ui/message-actions-menu";
import PollMessageCard from "@/components/ui/poll-message-card";
import PollViewBottomSheet from "@/components/ui/poll-view-bottom-sheet";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ConversationResponseDto, MessageResponseDto, messagingService, PollResponseDto } from "@/services/messaging.service";
import { detectSourceLanguage, SUPPORTED_LANGUAGES, translateText } from "@/services/translate.service";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { Audio, ResizeMode, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
    const { t } = useTranslation();
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPollSheet, setShowPollSheet] = useState(false);
    const [showPollViewSheet, setShowPollViewSheet] = useState(false);
    const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
    const [showAttachingMenu, setShowAttachingMenu] = useState(false);
    const [fullScreenImageUri, setFullScreenImageUri] = useState<string | null>(null);
    const [videoModalUri, setVideoModalUri] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [showMessageActionsMenu, setShowMessageActionsMenu] = useState(false);
    const [selectedMessageForAction, setSelectedMessageForAction] = useState<MessageResponseDto | null>(null);
    const [messageMenuPosition, setMessageMenuPosition] = useState<{ top: number; right?: number; left?: number } | null>(null);
    const messageViewRefs = useRef<Record<string, View | null>>({});
    const videoRef = useRef<Video | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [audioPositions, setAudioPositions] = useState<Record<string, number>>({});
    const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
    const soundRef = useRef<Audio.Sound | null>(null);
    const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
    const [translateMessages, setTranslateMessages] = useState(false);
    const [translateApplyKey, setTranslateApplyKey] = useState(0);
    const [translateSource, setTranslateSource] = useState<"auto" | string>("auto");
    const [translateTarget, setTranslateTarget] = useState<string>("en");
    const [showTranslateLangModal, setShowTranslateLangModal] = useState(false);
    const [translatedCache, setTranslatedCache] = useState<Record<string, string>>({});
    const translatedCacheRef = useRef<Record<string, string>>({});
    type TranslatedPoll = { question: string; options: Record<string, string> };
    const [translatedPollCache, setTranslatedPollCache] = useState<Record<string, TranslatedPoll>>({});
    const translatedPollCacheRef = useRef<Record<string, TranslatedPoll>>({});
    const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
    const requestedTranslateRef = useRef<Set<string>>(new Set());
    const prevConversationIdRef = useRef<string | undefined>(undefined);
    const { chatID } = useLocalSearchParams<{ chatID: string }>();
    const conversationId = chatID;
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Select data from store instead of calling functions
    const conversations = useStore((state: any) => state.conversations);
    const messagesStore = useStore((state: any) => state.messages);
    const addMessage = useStore((state: any) => state.addMessage);
    const setMessages = useStore((state: any) => state.setMessages);
    const removeMessage = useStore((state: any) => state.removeMessage);
    const updateMessageInStore = useStore((state: any) => state.updateMessage);
    const markConversationAsRead = useStore((state: any) => state.updateConversation);
    const currentUser = useStore((state: any) => state.user);
    const currentUserId = currentUser?.id || null;

    const theme = useStore((state) => state.theme);

    // Compute conversation and messages using useMemo to prevent infinite loops
    const conversation = useMemo(() => {
        if (!conversationId || !conversations) return undefined;
        return conversations.find((c: ConversationResponseDto) => c.id === conversationId);
    }, [conversationId, conversations]);

    const messages = useMemo(() => {
        if (!conversationId || !messagesStore) return [];
        return messagesStore[conversationId] || [];
    }, [conversationId, messagesStore]);

    // Parent cannot send messages in group chats (only view)
    const isParentInGroup = currentUser?.role === "parent" && conversation?.type === "group";

    const styles = useThemedStyles((t) => ({
        container: { flex: 1, backgroundColor: t.bg },
        header: { padding: 15, borderBottomWidth: 1, borderBottomColor: t.border },
        headerTitle: { fontWeight: "bold", fontSize: 18, color: t.text },
        onlineText: { color: t.passDesc, fontSize: 12, },
        messageContainer: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: "80%" },
        myMessage: { backgroundColor: t.tint, alignSelf: "flex-end", },
        otherMessage: { backgroundColor: t.panel, alignSelf: "flex-start" },
        messageContainerPoll: { backgroundColor: "transparent", padding: 0, maxWidth: "85%" },
        messageText: { color: '#fff' },
        messageOtherText: {
            color: t.text
        },
        timeText: { fontSize: 10, marginTop: 5, alignSelf: "flex-end" },
        messageFooter: { flexDirection: "row", alignItems: "flex-end", justifyContent: "flex-end", marginTop: 4, gap: 4 },
        readStatusContainer: { flexDirection: "row", alignItems: "center" },
        audioPlayer: {
            // minHeight: 60,
            // padding: 12,
            borderRadius: 12,
            minWidth: 200,
        },
        audioPlayerContent: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        audioPlayButton: {
            width: 32,
            height: 32,
            justifyContent: "center",
            alignItems: "center",
        },
        audioProgressContainer: {
            flex: 1,
            height: 4,
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            borderRadius: 50,
            overflow: "hidden",
        },
        audioProgressContainerViewer: {
            backgroundColor: "rgba(0, 0, 0, 0.1)", // Light gray for viewer
        },
        audioProgressFill: {
            height: "100%",
            backgroundColor: "#fff",
            borderRadius: 2,
        },
        audioDuration: {
            fontSize: 12,
            color: "#fff",
            minWidth: 40,
            textAlign: "right",
        },
        audioDurationViewer: {
            color: "#666", // Dark gray for viewer
        },
        audioTimestamp: {
            fontSize: 10,
            color: "#fff",
            marginTop: 8,
            opacity: 0.9,
        },
        audioTimestampViewer: {
            color: "#666", // Dark gray for viewer
        },
        videoThumbnail: { width: 150, height: 100, borderRadius: 8, marginTop: 5 },
        imageThumbnail: { width: 200, height: 150, borderRadius: 8, marginTop: 5 },
        inputContainer: { flexDirection: "row", paddingVertical: 10, borderTopWidth: 1, borderColor: t.border, alignItems: "flex-end", paddingHorizontal: 15, paddingBottom: 10, backgroundColor: t.bg },
        inputWrapper: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 8 },
        attachmentButton: { padding: 8, marginRight: 5, backgroundColor: "rgba(215, 169, 227, 0.25)", borderRadius: 8 },
        input: { flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, minHeight: 40, maxHeight: 100, color: t.text, backgroundColor: t.panel || t.bg, fontSize: 16 },
        sendButton: { backgroundColor: t.tint, padding: 10, borderRadius: 8, marginLeft: 5 },
        micButton: { backgroundColor: "transparent", padding: 10, borderRadius: 8, marginLeft: 5 },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        fileContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5, minWidth: 200, backgroundColor: "rgba(255, 255, 255, 0.1)", padding: 10, borderRadius: 8 },
        fileName: { color: t.text, fontSize: 14 },
        uploadProgressContainer: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: t.panel,
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: t.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        uploadProgressBar: {
            flex: 1,
            height: 4,
            backgroundColor: t.border,
            borderRadius: 2,
            overflow: "hidden",
        },
        uploadProgressFill: {
            height: "100%",
            backgroundColor: t.tint,
        },
        uploadProgressText: {
            fontSize: 12,
            color: t.subText,
            minWidth: 50,
        },
        editBarContainer: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderTopWidth: 1,
            borderTopColor: t.border,
            backgroundColor: t.panel ?? t.bg,
            gap: 8,
        },
        editBarInput: {
            flex: 1,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            minHeight: 40,
            maxHeight: 80,
            color: t.text,
            backgroundColor: t.bg,
            fontSize: 16,
        },
        editBarCancelButton: {
            padding: 10,
            borderRadius: 8,
            backgroundColor: t.border + "40",
        },
        editBarSaveButton: {
            padding: 10,
            borderRadius: 8,
            backgroundColor: t.tint,
        },
        avatar: { width: 36, height: 36, borderRadius: 18 },
        avatarPlaceholder: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.tint,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarPlaceholderText: { color: '#fff', fontSize: 14, fontWeight: '600' },
        translateModalBox: { width: '100%', maxWidth: 340, borderRadius: 16, padding: 20 },
        translateModalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
        translateModalLabel: { fontSize: 12, marginBottom: 6 },
        translateModalList: { maxHeight: 140 },
        translateModalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4 },
        translateModalActions: { marginTop: 20, gap: 10 },
        translateModalOffBtn: { paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1 },
        translateModalApplyBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 10 },
    }) as const);

    const loadConversation = useCallback(async () => {
        if (!conversationId || typeof conversationId !== 'string') {
            console.warn('Invalid conversationId:', conversationId);
            return;
        }

        try {
            await messagingService.getConversationById(conversationId);
            // Update store if needed - you might want to add this to your store
            // const conv = await messagingService.getConversationById(conversationId);
            // updateConversation(conversationId, conv);
        } catch (error: any) {
            console.error('Error loading conversation:', error);
            const errorMessage = error?.message || 'Failed to load conversation';
            // Only show alert if it's not a 404 (conversation might not exist)
            if (error?.status !== 404) {
                Alert.alert('Error', errorMessage);
            }
        }
    }, [conversationId]);

    const loadMessages = useCallback(async () => {
        if (!conversationId || typeof conversationId !== 'string') {
            console.warn('Invalid conversationId:', conversationId);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await messagingService.getMessages(conversationId, { limit: 50 });
            if (response && response.messages) {
                setMessages(conversationId, response.messages.reverse()); // Reverse to show oldest first
            } else {
                setMessages(conversationId, []);
            }
        } catch (error: any) {
            console.error('Error loading messages:', error);
            const errorMessage = error?.message || 'Failed to load messages';
            // Only show alert if it's not a 404
            if (error?.status !== 404) {
                Alert.alert('Error', errorMessage);
            }
            // Set empty messages array on error
            setMessages(conversationId, []);
        } finally {
            setLoading(false);
        }
    }, [conversationId, setMessages]);

    useEffect(() => {
        if (!conversationId || typeof conversationId !== 'string') {
            return;
        }

        loadConversation();
        loadMessages();

        // Mark conversation as read when component mounts
        messagingService.markConversationAsRead(conversationId).catch((error) => {
            console.error('Error marking conversation as read:', error);
        });
        markConversationAsRead(conversationId, { unreadCount: 0 });
    }, [conversationId, loadConversation, loadMessages, markConversationAsRead]);

    const handleSendMessage = async () => {
        if (!input.trim() || !conversationId || sending) return;
        if (isParentInGroup) return;

        setSending(true);
        try {
            const newMessage = await messagingService.createMessage({
                conversationId,
                content: input.trim(),
                type: 'text',
            });

            addMessage(conversationId, newMessage);
            setInput("");
        } catch (error: any) {
            console.error('Error sending message:', error);
            Alert.alert('Error', error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission Required",
                    "Sorry, we need camera roll permissions to select images!"
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadAndSendFile(result.assets[0].uri, 'image', result.assets[0].mimeType || 'image/jpeg');
            }
        } catch (error: any) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const pickVideo = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission Required",
                    "Sorry, we need camera roll permissions to select videos!"
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadAndSendFile(result.assets[0].uri, 'video', result.assets[0].mimeType || 'video/mp4');
            }
        } catch (error: any) {
            console.error("Error picking video:", error);
            Alert.alert("Error", "Failed to pick video");
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadAndSendFile(
                    result.assets[0].uri,
                    'file',
                    result.assets[0].mimeType || 'application/octet-stream',
                    result.assets[0].name
                );
            }
        } catch (error: any) {
            console.error("Error picking document:", error);
            Alert.alert("Error", "Failed to pick document");
        }
    };


    // eslint-disable-next-line react-hooks/exhaustive-deps
    const uploadAndSendFile = async (
        uri: string,
        type: 'image' | 'video' | 'audio' | 'file',
        mimeType: string,
        fileName?: string,
        durationSeconds?: number
    ) => {
        if (!conversationId || uploadingFile) return;
        if (isParentInGroup) return;

        setUploadingFile(true);
        setUploadProgress(0);

        // Extract filename from URI if not provided
        const fileUri = uri;
        const name = fileName || fileUri.split('/').pop() || 'file';
        setUploadingFileName(name);

        try {
            // Create FormData
            const formData = new FormData();

            // @ts-ignore - FormData in React Native works differently
            formData.append('file', {
                uri: fileUri,
                type: mimeType,
                name: name,
            } as any);

            // Simulate progress (since we don't have actual progress from API)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            let uploadResponse;
            if (type === 'image') {
                uploadResponse = await messagingService.uploadImage(formData);
            } else if (type === 'video') {
                uploadResponse = await messagingService.uploadVideo(formData);
            } else if (type === 'audio') {
                uploadResponse = await messagingService.uploadAudio(formData);
            } else {
                uploadResponse = await messagingService.uploadFile(formData);
            }

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Create message with uploaded file
            const newMessage = await messagingService.createMessage({
                conversationId,
                type: type,
                mediaUrl: uploadResponse.url,
                fileName: uploadResponse.originalName,
                fileSize: String(uploadResponse.size),
                mimeType: uploadResponse.mimetype,
                ...(type === 'audio' && durationSeconds != null && { duration: String(durationSeconds) }),
                ...(type === 'video' && uploadResponse.thumbnailUrl != null && { thumbnailUrl: uploadResponse.thumbnailUrl }),
            });

            addMessage(conversationId, newMessage);

            // Reset after a short delay
            setTimeout(() => {
                setUploadProgress(0);
                setUploadingFileName(null);
            }, 500);
        } catch (error: any) {
            console.error('Error uploading file:', error);
            Alert.alert('Error', error.message || 'Failed to upload file');
            setUploadProgress(0);
            setUploadingFileName(null);
        } finally {
            setUploadingFile(false);
        }
    };

    const handlePollCreated = async (poll: PollResponseDto, message: MessageResponseDto) => {
        addMessage(conversationId, { ...message, polls: [poll] });
        setShowPollSheet(false);
    };

    const handleSelectMedia = () => {
        Alert.alert(
            "Select Media",
            "Choose an option",
            [
                { text: t("buttons.image"), onPress: pickImage },
                { text: t("buttons.video"), onPress: pickVideo },
                { text: t("common.cancel"), style: "cancel" },
            ]
        );
    };

    const requestRecordingPermission = useCallback(async (): Promise<boolean> => {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Microphone access',
                'Microphone permission is needed to record voice messages.',
                [{ text: 'OK' }]
            );
            return false;
        }
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
        return true;
    }, []);

    const startRecording = useCallback(async () => {
        if (!conversationId || uploadingFile || sending) return;
        if (isParentInGroup) return;
        const ok = await requestRecordingPermission();
        if (!ok) return;

        try {
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            recordingRef.current = recording;
            setIsRecording(true);
        } catch (error: any) {
            console.error('Failed to start recording:', error);
            Alert.alert('Error', error?.message || 'Could not start recording');
        }
    }, [conversationId, uploadingFile, sending, isParentInGroup, requestRecordingPermission]);

    const stopRecordingAndSend = useCallback(async () => {
        const recording = recordingRef.current;
        if (!recording || !conversationId) return;

        try {
            setIsRecording(false);
            recordingRef.current = null;
            const status = await recording.getStatusAsync();
            const durationMillis = status.durationMillis ?? 0;
            if (!status.isDoneRecording) {
                await recording.stopAndUnloadAsync();
            }
            const uri = recording.getURI();
            if (!uri) {
                Alert.alert('Error', 'Recording file not available');
                return;
            }
            const durationSeconds = durationMillis > 0 ? Math.round(durationMillis / 1000) : undefined;
            const ts = Date.now();
            const fileName = `voice-${ts}.m4a`;
            const mimeType = 'audio/m4a';

            await uploadAndSendFile(uri, 'audio', mimeType, fileName, durationSeconds);
        } catch (error: any) {
            console.error('Failed to stop/send recording:', error);
            Alert.alert('Error', error?.message || 'Failed to send voice message');
        }
    }, [conversationId, uploadAndSendFile]);

    const handleMicPress = useCallback(() => {
        if (isRecording) {
            stopRecordingAndSend();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecordingAndSend]);

    const handleSelectFiles = () => {
        setShowAttachingMenu(false);
        const delay = Platform.OS === "ios" ? 600 : 400;
        setTimeout(() => {
            pickDocument();
        }, delay);
    };

    const handleFilePress = (url: string) => {
        if (url) Linking.openURL(url);
    };

    const handleVideoPress = (url: string) => {
        setVideoModalUri(url);
    };

    const handleImagePress = (uri: string) => {
        setFullScreenImageUri(uri);
    };

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (!conversationId) return;
        try {
            await messagingService.deleteMessage(messageId);
            removeMessage(conversationId, messageId);
        } catch (error: any) {
            Alert.alert("Error", error?.message ?? "Failed to delete message");
        }
    }, [conversationId, removeMessage]);

    const handleEditMessage = useCallback((message: MessageResponseDto) => {
        if (message.type !== "text") return;
        setEditingMessageId(message.id);
        setEditDraft(message.content ?? "");
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!conversationId || !editingMessageId || !editDraft.trim()) return;
        try {
            const updated = await messagingService.updateMessage(editingMessageId, {
                content: editDraft.trim(),
            });
            updateMessageInStore(conversationId, editingMessageId, {
                content: updated.content,
                updatedAt: updated.updatedAt,
            });
            setEditingMessageId(null);
            setEditDraft("");
        } catch (error: any) {
            Alert.alert("Error", error?.message ?? "Failed to update message");
        }
    }, [conversationId, editingMessageId, editDraft, updateMessageInStore]);

    const handleCancelEdit = useCallback(() => {
        setEditingMessageId(null);
        setEditDraft("");
    }, []);

    const handleMessageLongPress = useCallback((item: MessageResponseDto) => {
        const viewRef = messageViewRefs.current[item.id];
        if (!viewRef) return;

        viewRef.measureInWindow((x, y, width, height) => {
            // Get screen dimensions
            const screenHeight = Dimensions.get("window").height;
            const screenWidth = Dimensions.get("window").width;

            // Calculate position - show above message
            const isMe = item.senderId === currentUserId;
            const top = y - 10; // Position above message
            const right = isMe ? screenWidth - x - width : undefined;
            const left = isMe ? undefined : x;

            setSelectedMessageForAction(item);
            setMessageMenuPosition({ top, right, left });
            setShowMessageActionsMenu(true);
        });
    }, [currentUserId]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const formatAudioDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAudioPlay = async (audioUrl: string, messageId: string, durationSeconds?: number) => {
        try {
            // Stop current audio if playing
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            if (positionUpdateInterval.current) {
                clearInterval(positionUpdateInterval.current);
                positionUpdateInterval.current = null;
            }

            // If clicking the same audio, toggle pause
            if (playingAudioId === messageId) {
                setPlayingAudioId(null);
                setAudioPositions(prev => ({ ...prev, [messageId]: 0 }));
                return;
            }

            // Load and play new audio
            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true }
            );
            soundRef.current = sound;

            const status = await sound.getStatusAsync();
            const duration = (status.isLoaded && 'durationMillis' in status && status.durationMillis)
                ? status.durationMillis / 1000
                : (durationSeconds || 0);

            setAudioDurations(prev => ({ ...prev, [messageId]: duration }));
            setPlayingAudioId(messageId);
            setAudioPositions(prev => ({ ...prev, [messageId]: 0 }));

            // Update position using status callback
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    if (status.positionMillis !== undefined) {
                        const position = status.positionMillis / 1000;
                        setAudioPositions(prev => ({ ...prev, [messageId]: position }));
                    }
                    if (status.didJustFinish) {
                        setPlayingAudioId(null);
                        setAudioPositions(prev => ({ ...prev, [messageId]: 0 }));
                        sound.unloadAsync();
                        soundRef.current = null;
                        if (positionUpdateInterval.current) {
                            clearInterval(positionUpdateInterval.current);
                            positionUpdateInterval.current = null;
                        }
                    }
                }
            });
        } catch (error: any) {
            console.error('Error playing audio:', error);
            Alert.alert('Error', 'Failed to play audio');
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
            if (positionUpdateInterval.current) {
                clearInterval(positionUpdateInterval.current);
            }
        };
    }, []);

    useEffect(() => {
        if (prevConversationIdRef.current !== undefined && prevConversationIdRef.current !== conversationId) {
            translatedCacheRef.current = {};
            setTranslatedCache({});
            translatedPollCacheRef.current = {};
            setTranslatedPollCache({});
            setTranslatingIds(new Set());
            requestedTranslateRef.current = new Set();
        }
        prevConversationIdRef.current = conversationId;
    }, [conversationId]);

    useEffect(() => {
        if (!translateMessages) return;
        const translatableMessages = messages.filter((m: MessageResponseDto) =>
            (m.type === "text" || m.type === "announcement") && m.content?.trim()
        );
        for (const msg of translatableMessages) {
            if (translatedCacheRef.current[msg.id] !== undefined || requestedTranslateRef.current.has(msg.id)) continue;
            requestedTranslateRef.current.add(msg.id);
            setTranslatingIds((prev) => new Set(prev).add(msg.id));
            const sourceLang = translateSource === "auto" ? detectSourceLanguage(msg.content!) : translateSource;
            const messageId = msg.id;
            translateText(msg.content!, { sourceLang, targetLang: translateTarget })
                .then((translated) => {
                    translatedCacheRef.current[messageId] = translated;
                    setTranslatedCache({ ...translatedCacheRef.current });
                })
                .catch(() => { })
                .finally(() => {
                    setTranslatingIds((prev) => {
                        const next = new Set(prev);
                        next.delete(messageId);
                        return next;
                    });
                });
        }
        const pollMessages = messages.filter((m: MessageResponseDto) => m.type === "poll" && m.polls?.[0]?.id);
        for (const msg of pollMessages) {
            const pollId = msg.polls![0].id;
            const messageId = msg.id;
            if (translatedPollCacheRef.current[messageId] !== undefined || requestedTranslateRef.current.has(`poll:${messageId}`)) continue;
            requestedTranslateRef.current.add(`poll:${messageId}`);
            setTranslatingIds((prev) => new Set(prev).add(messageId));
            messagingService.getPoll(pollId)
                .then(async (poll) => {
                    const sourceLang = translateSource === "auto" ? detectSourceLanguage(poll.question) : translateSource;
                    const questionTranslated = await translateText(poll.question, { sourceLang, targetLang: translateTarget });
                    const optionsTranslated: Record<string, string> = {};
                    for (const opt of poll.options) {
                        optionsTranslated[opt.id] = await translateText(opt.text, { sourceLang, targetLang: translateTarget });
                    }
                    translatedPollCacheRef.current[messageId] = { question: questionTranslated, options: optionsTranslated };
                    setTranslatedPollCache({ ...translatedPollCacheRef.current });
                })
                .catch(() => { })
                .finally(() => {
                    setTranslatingIds((prev) => {
                        const next = new Set(prev);
                        next.delete(messageId);
                        return next;
                    });
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [translateMessages, translateApplyKey, translateSource, translateTarget, conversationId, messages.length]);

    const renderMessage = ({ item, index }: { item: MessageResponseDto; index: number }) => {
        const isMe = item.senderId === currentUserId;
        const messageTime = formatTime(item.createdAt);
        const isLastReadMessage = index === lastReadMessageIndex;

        const isPoll = item.type === "poll" && item.polls?.length;

        const messageContent = (
            <View
                ref={(ref) => {
                    messageViewRefs.current[item.id] = ref;
                }}
                style={[
                    styles.messageContainer,
                    isPoll
                        ? [styles.messageContainerPoll, isMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]
                        : (isMe ? styles.myMessage : styles.otherMessage),
                ]}>
                {item.type === "text" && item.content && (
                    <Text style={isMe ? styles.messageText : styles.messageOtherText}>
                        {translateMessages
                            ? (translatedCache[item.id] ?? (translatingIds.has(item.id) ? "…" : item.content))
                            : item.content}
                    </Text>
                )}
                {item.type === "announcement" && item.content && (
                    <Text style={isMe ? styles.messageText : styles.messageOtherText}>
                        {translateMessages
                            ? (translatedCache[item.id] ?? (translatingIds.has(item.id) ? "…" : item.content))
                            : item.content}
                    </Text>
                )}
                {item.type === "image" && item.mediaUrl && (
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => handleImagePress(item.mediaUrl!)}
                    >
                        <Image
                            source={{ uri: item.mediaUrl }}
                            style={styles.imageThumbnail}
                            accessibilityRole="image"
                            accessibilityLabel="Image attachment"
                        />
                    </TouchableOpacity>
                )}
                {item.type === "video" && (item.thumbnailUrl ?? item.mediaUrl) && item.mediaUrl && (
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => handleVideoPress(item.mediaUrl!)}
                    >
                        <Image
                            source={{ uri: (item.thumbnailUrl ?? item.mediaUrl)! }}
                            style={styles.videoThumbnail}
                            accessibilityRole="image"
                            accessibilityLabel="Video thumbnail"
                        />
                        <View style={{ position: "absolute", alignSelf: "center", top: "35%", opacity: 0.9 }}>
                            <Ionicons name="play-circle" size={48} color="#fff" />
                        </View>
                    </TouchableOpacity>
                )}
                {item.type === "audio" && item.mediaUrl && (
                    <View style={[
                        styles.audioPlayer,
                    ]}>
                        <View style={styles.audioPlayerContent}>
                            <TouchableOpacity
                                style={styles.audioPlayButton}
                                onPress={() => handleAudioPlay(
                                    item.mediaUrl!,
                                    item.id,
                                    item.duration ? Number(item.duration) : undefined
                                )}
                            >
                                <Ionicons
                                    name={playingAudioId === item.id ? "pause" : "play-outline"}
                                    size={20}
                                    color={isMe ? "#fff" : theme.text}
                                />
                            </TouchableOpacity>
                            <View style={[
                                styles.audioProgressContainer,
                                !isMe && styles.audioProgressContainerViewer
                            ]}>
                                <View
                                    style={[
                                        styles.audioProgressFill,
                                        {
                                            width: (() => {
                                                const duration = audioDurations[item.id] || (item.duration ? Number(item.duration) : 0);
                                                const position = audioPositions[item.id] || 0;
                                                return duration > 0 ? `${(position / duration) * 100}%` : '0%';
                                            })(),
                                            backgroundColor: isMe ? "#fff" : theme.tint,
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[
                                styles.audioDuration,
                                !isMe && styles.audioDurationViewer
                            ]}>
                                {(() => {
                                    const duration = audioDurations[item.id] || (item.duration ? Number(item.duration) : 0);
                                    return duration > 0 ? formatAudioDuration(duration) : (item.duration ? formatAudioDuration(Number(item.duration)) : "0:00");
                                })()}
                            </Text>
                        </View>

                    </View>
                )}
                {item.type === "file" && (
                    <TouchableOpacity
                        style={styles.fileContainer}
                        onPress={() => item.mediaUrl && handleFilePress(item.mediaUrl)}
                    >
                        <Ionicons name="document-text" size={24} color={isMe ? "#fff" : theme.text} />
                        <View style={{ flex: 1 }}>
                            <Text style={isMe ? styles.messageText : styles.messageOtherText}>
                                {item.fileName || 'File'}
                            </Text>
                            {item.fileSize && (
                                <Text style={[styles.timeText, isMe ? { color: '#fff' } : { color: '#666' }]}>
                                    {(Number(item.fileSize) / 1024).toFixed(1)} KB
                                </Text>
                            )}
                        </View>
                        <Ionicons name="download-outline" size={20} color={isMe ? "#fff" : theme.text} />
                    </TouchableOpacity>
                )}
                {item.type === "poll" && item.polls?.length && (
                    <PollMessageCard
                        pollId={item.polls[0].id}
                        isMe={isMe}
                        translatedQuestion={translateMessages ? translatedPollCache[item.id]?.question : undefined}
                        translatedOptions={translateMessages ? translatedPollCache[item.id]?.options : undefined}
                        isTranslating={translateMessages && translatingIds.has(item.id)}
                        onVote={() => { }}
                        onClosePoll={() => {
                            loadMessages();
                        }}
                        onEditPoll={() => {
                            Alert.alert("Edit Poll", "Edit poll is not available yet.");
                        }}
                    />
                )}
                {item.type !== "audio" && (
                    <View style={styles.messageFooter}>
                        <Text style={[styles.timeText, (isPoll ? { color: theme.subText ?? '#666' } : isMe ? { color: '#fff' } : { color: '#666' })]}>
                            {messageTime}
                        </Text>
                        {isMe && (
                            <View style={styles.readStatusContainer}>
                                {(item.userStatus === 'read' || (item as any).isRead) ? (
                                    <Ionicons name="checkmark-done" size={14} color={isPoll ? (theme.subText ?? '#666') : '#fff'} />
                                ) : (
                                    <Ionicons name="checkmark" size={14} color={isPoll ? (theme.subText ?? '#666') : '#fff'} style={{ opacity: 0.7 }} />
                                )}
                            </View>
                        )}
                    </View>
                )}
                {item.type === "audio" && isMe && (
                    <View style={[styles.messageFooter, { marginTop: 4 }]}>
                        <Text style={[
                            isMe ? styles.audioTimestamp : styles.audioTimestampViewer
                        ]}>
                            {messageTime}
                        </Text>
                        <View style={styles.readStatusContainer}>
                            {(item.userStatus === 'read' || (item as any).isRead) ? (
                                <Ionicons name="checkmark-done" size={14} color="#fff" />
                            ) : (
                                <Ionicons name="checkmark" size={14} color="#fff" style={{ opacity: 0.7 }} />
                            )}
                        </View>
                    </View>
                )}
                {isMe && isLastReadMessage && (item.userStatus === 'read' || (item as any).isRead) && (
                    <Text style={[styles.timeText, { fontSize: 9, marginTop: 2, fontStyle: 'italic' }, isPoll ? { color: theme.subText ?? '#666' } : { color: '#fff' }]}>
                        Read
                    </Text>
                )}
            </View>
        );

        if (isMe) {
            return (
                <TouchableOpacity
                    activeOpacity={1}
                    onLongPress={() => handleMessageLongPress(item)}
                    delayLongPress={400}
                >
                    {messageContent}
                </TouchableOpacity>
            );
        }
        return messageContent;
    };

    const getConversationName = () => {
        if (!conversation) return 'Chat';
        if (typeof conversation.name === 'string') return conversation.name;
        if (conversation.type === 'direct' && conversation.participants) {
            const otherParticipant = conversation.participants.find((p: any) => p.user.id !== currentUserId);
            if (otherParticipant) {
                return `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim() || otherParticipant.user.email;
            }
        } else if (conversation.type === 'group' && conversation.name) {
            return conversation.name;
        }
        return 'Chat';
    };

    const getConversationAvatar = () => {
        const name = getConversationName()
        let avatarUri: string | null = null
        if (conversation?.type === 'group' && conversation.imageUrl) {
            avatarUri = conversation.imageUrl
        } else if (conversation?.type === 'direct' && conversation.participants) {
            const other = conversation.participants.find((p: { user: { id: string } }) => p.user.id !== currentUserId)
            if (other?.user?.profilePicture) avatarUri = other.user.profilePicture
        }
        const initials = name
            ? name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
            : '?'
        return avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{initials}</Text>
            </View>
        )
    }

    // Get online/offline status for direct conversations
    // TODO: Replace with actual online status from API when available
    const getOnlineStatus = useMemo(() => {
        if (!conversation || conversation.type !== 'direct') return null;

        const otherParticipant = conversation.participants?.find((p: any) => p.user.id !== currentUserId);
        if (!otherParticipant) return null;

        // For now, default to offline. Update this when API provides online status
        // You can check lastSeen timestamp or isOnline field if available
        const isOnline = false; // Replace with: otherParticipant.user.isOnline or check lastSeen timestamp

        return isOnline ? 'Online' : 'Offline';
    }, [conversation, currentUserId]);

    // Find the last read message index to show read status indicator
    const lastReadMessageIndex = useMemo(() => {
        if (!messages || messages.length === 0) return -1;

        // Find the last message sent by current user that has been read
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const isRead = msg.userStatus === 'read' || (msg as any).isRead;
            if (msg.senderId === currentUserId && isRead) {
                return i;
            }
        }
        return -1;
    }, [messages, currentUserId]);

    if (loading && messages.length === 0) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1, }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <HeaderThreeSections
                    title={getConversationName()}
                    titlePrefix={getConversationAvatar()}
                    desc={getOnlineStatus || undefined}
                    icon={<TranslateIcon size={28} color={translateMessages ? theme.tint : theme.text} />}
                    onPress={() => setShowTranslateLangModal(true)}
                    onCenterPress={
                        conversation && conversationId
                            ? () => {
                                if (conversation.type === 'group') {
                                    router.push({ pathname: '/group-profile/[chatID]', params: { chatID: conversationId } });
                                } else if (conversation.type === 'direct' && conversation.participants) {
                                    const other = conversation.participants.find((p: any) => p.user?.id !== currentUserId);
                                    if (other?.user?.id) {
                                        const name = `${other.user.firstName || ''} ${other.user.lastName || ''}`.trim() || other.user.email || '';
                                        router.push({
                                            pathname: '/contact-profile/[userId]',
                                            params: {
                                                userId: other.user.id,
                                                name: name || undefined,
                                                image: other.user.profilePicture || undefined,
                                            },
                                        });
                                    }
                                }
                            }
                            : undefined
                    }
                    colorDesc={getOnlineStatus === 'Online' ? theme.passDesc : theme.subText}
                />

                {/* Messages */}
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => renderMessage({ item, index })}
                    contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    inverted={true}
                    keyboardShouldPersistTaps="handled"
                />

                {/* Edit message bar */}
                {editingMessageId && (
                    <View style={styles.editBarContainer}>
                        <TextInput
                            style={styles.editBarInput}
                            value={editDraft}
                            onChangeText={setEditDraft}
                            placeholder="Edit message..."
                            placeholderTextColor={theme.subText || theme.text + "80"}
                            multiline
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.editBarCancelButton}
                            onPress={handleCancelEdit}
                        >
                            <Text style={{ color: theme.text, fontSize: 14 }}>{t("common.cancel")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.editBarSaveButton}
                            onPress={handleSaveEdit}
                            disabled={!editDraft.trim()}
                        >
                            <Text style={{ color: "#fff", fontSize: 14 }}>{t("common.save")}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Input — parent cannot send in group chats */}
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                    {isParentInGroup ? (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 }}>
                            <Text style={{ fontSize: 13, color: theme.subText || theme.text + "99", textAlign: "center" }}>
                                Only teachers and admins can send messages in this group.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.inputWrapper}>
                                <TouchableOpacity
                                    style={styles.attachmentButton}
                                    onPress={() => setShowAttachingMenu(true)}
                                    disabled={uploadingFile || sending}
                                >
                                    <Ionicons
                                        name="add"
                                        size={24}
                                        color={uploadingFile || sending ? theme.subText : theme.text}
                                    />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Type a message..."
                                    placeholderTextColor={theme.subText || theme.text + '80'}
                                    value={input}
                                    onChangeText={setInput}
                                    multiline={true}
                                    blurOnSubmit={false}
                                    editable={!sending && !uploadingFile}
                                    accessibilityLabel="Message input"
                                    accessibilityHint="Type your message here. Press Enter for a new line, use the send button to send."
                                    accessibilityState={{ disabled: sending || uploadingFile }}
                                    textAlignVertical="top"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.micButton, isRecording && { backgroundColor: theme.tint + '40' }]}
                                onPress={handleMicPress}
                                disabled={sending || uploadingFile}
                                accessibilityLabel={isRecording ? 'Stop and send voice message' : 'Record voice message'}
                            >
                                <VoiceIcon
                                    color={isRecording ? theme.tint : (theme.text || 'rgba(18, 18, 18, 1)')}
                                    size={20}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.sendButton, (sending || uploadingFile || !input.trim()) && { opacity: 0.5 }]}
                                onPress={handleSendMessage}
                                disabled={sending || uploadingFile || !input.trim()}
                                accessibilityRole="button"
                                accessibilityLabel="Send message"
                                accessibilityHint="Double tap to send your message"
                                accessibilityState={{ disabled: sending || uploadingFile || !input.trim() }}
                            >
                                {(sending || uploadingFile) ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <SendIcon color="#fff" size={16} />
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Upload Progress Indicator */}
                {uploadingFile && uploadingFileName && (
                    <View style={styles.uploadProgressContainer}>
                        <ActivityIndicator size="small" color={theme.tint} />
                        <View style={styles.uploadProgressBar}>
                            <View
                                style={[
                                    styles.uploadProgressFill,
                                    { width: `${uploadProgress}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.uploadProgressText} numberOfLines={1}>
                            {uploadingFileName.length > 15
                                ? `${uploadingFileName.substring(0, 15)}...`
                                : uploadingFileName}
                        </Text>
                    </View>
                )}

                {/* Attaching Menu */}
                <AttachingMenu
                    visible={showAttachingMenu}
                    onClose={() => setShowAttachingMenu(false)}
                    onSelectPoll={() => setShowPollSheet(true)}
                    onSelectMedia={handleSelectMedia}
                    onSelectFiles={handleSelectFiles}
                    isGroup={conversation?.type === "group"}
                />

                {/* Message Actions Menu */}
                {selectedMessageForAction && messageMenuPosition && (
                    <MessageActionsMenu
                        visible={showMessageActionsMenu}
                        onClose={() => {
                            setShowMessageActionsMenu(false);
                            setSelectedMessageForAction(null);
                            setMessageMenuPosition(null);
                        }}
                        onEdit={
                            selectedMessageForAction.type === "text"
                                ? () => handleEditMessage(selectedMessageForAction)
                                : undefined
                        }
                        onDelete={() => {
                            if (selectedMessageForAction) {
                                handleDeleteMessage(selectedMessageForAction.id);
                            }
                        }}
                        top={messageMenuPosition.top}
                        right={messageMenuPosition.right}
                        left={messageMenuPosition.left}
                        isMe={selectedMessageForAction.senderId === currentUserId}
                    />
                )}

                {/* Poll Creation Bottom Sheet */}
                {conversationId && (
                    <CreatePollBottomSheet
                        visible={showPollSheet}
                        onClose={() => setShowPollSheet(false)}
                        conversationId={conversationId}
                        onPollCreated={handlePollCreated}
                    />
                )}

                {/* Poll View Bottom Sheet */}
                {selectedPollId && (
                    <PollViewBottomSheet
                        visible={showPollViewSheet}
                        onClose={() => {
                            setShowPollViewSheet(false);
                            setSelectedPollId(null);
                        }}
                        pollId={selectedPollId}
                        onVote={() => {
                            loadMessages();
                        }}
                    />
                )}

                {/* Full-screen image modal */}
                <Modal
                    visible={!!fullScreenImageUri}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setFullScreenImageUri(null)}
                >
                    <TouchableOpacity
                        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }]}
                        activeOpacity={1}
                        onPress={() => setFullScreenImageUri(null)}
                    >
                        {fullScreenImageUri && (
                            <Image
                                source={{ uri: fullScreenImageUri }}
                                style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height, resizeMode: "contain" }}
                                resizeMode="contain"
                            />
                        )}
                        <TouchableOpacity
                            style={{ position: "absolute", top: insets.top + 8, right: 16, padding: 8 }}
                            onPress={() => setFullScreenImageUri(null)}
                        >
                            <Ionicons name="close-circle" size={36} color="#fff" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* Translate: choose source & target language */}
                <Modal
                    visible={showTranslateLangModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowTranslateLangModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }]}
                        onPress={() => setShowTranslateLangModal(false)}
                    >
                        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={[styles.translateModalBox, { backgroundColor: theme.panel || theme.bg }]}>
                            <Text style={[styles.translateModalTitle, { color: theme.text }]}>{t("translate.modalTitle")}</Text>
                            <Text style={[styles.translateModalLabel, { color: theme.subText }]}>{t("translate.fromSource")}</Text>
                            <ScrollView style={styles.translateModalList} showsVerticalScrollIndicator={false}>
                                <TouchableOpacity
                                    style={[styles.translateModalRow, translateSource === "auto" && { backgroundColor: theme.tint + "30" }]}
                                    onPress={() => setTranslateSource("auto")}
                                >
                                    <Text style={{ color: theme.text, fontSize: 16 }}>{t("translate.autoDetect")}</Text>
                                    {translateSource === "auto" && <Ionicons name="checkmark-circle" size={22} color={theme.tint} />}
                                </TouchableOpacity>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[styles.translateModalRow, translateSource === lang.code && { backgroundColor: theme.tint + "30" }]}
                                        onPress={() => setTranslateSource(lang.code)}
                                    >
                                        <Text style={{ color: theme.text, fontSize: 16 }}>{lang.label}</Text>
                                        {translateSource === lang.code && <Ionicons name="checkmark-circle" size={22} color={theme.tint} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <Text style={[styles.translateModalLabel, { color: theme.subText, marginTop: 12 }]}>{t("translate.toTarget")}</Text>
                            <ScrollView style={styles.translateModalList} showsVerticalScrollIndicator={false}>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[styles.translateModalRow, translateTarget === lang.code && { backgroundColor: theme.tint + "30" }]}
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
                                        <Text style={{ color: theme.subText, fontSize: 14 }}>{t("translate.turnOff")}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.translateModalApplyBtn, { backgroundColor: theme.tint }]}
                                    onPress={() => {
                                        translatedCacheRef.current = {};
                                        setTranslatedCache({});
                                        translatedPollCacheRef.current = {};
                                        setTranslatedPollCache({});
                                        setTranslatingIds(new Set());
                                        requestedTranslateRef.current = new Set();
                                        setTranslateApplyKey((k) => k + 1);
                                        setTranslateMessages(true);
                                        setShowTranslateLangModal(false);
                                    }}
                                >
                                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{t("buttons.apply")}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* Video player modal */}
                <Modal
                    visible={!!videoModalUri}
                    animationType="slide"
                    onRequestClose={() => setVideoModalUri(null)}
                >
                    <View style={{ flex: 1, backgroundColor: "#000" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8 }}>
                            <TouchableOpacity onPress={() => setVideoModalUri(null)}>
                                <Ionicons name="arrow-back" size={28} color="#fff" />
                            </TouchableOpacity>
                            <Text style={{ color: "#fff", fontSize: 16 }}>{t("buttons.video")}</Text>
                            <View style={{ width: 28 }} />
                        </View>
                        {videoModalUri && (
                            <Video
                                ref={videoRef}
                                source={{ uri: videoModalUri }}
                                style={{ flex: 1, width: "100%" }}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                onPlaybackStatusUpdate={() => { }}
                                onError={(e) => {
                                    console.error("Video error:", e);
                                    Alert.alert("Error", "Failed to play video");
                                }}
                            />
                        )}
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </View>
    );
}
