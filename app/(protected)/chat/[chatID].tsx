import HeaderThreeSections from "@/components/reptitive-component/header-three-sections";
import { feedback } from "@/lib/feedback";
import AttachingMenu from "@/components/ui/attaching-menu";
import { TranslateIcon } from "@/components/ui/icons/common-icons";
import { CopyIcon, EmojiIcon, SendIcon, TrashIcon, VoiceIcon } from "@/components/ui/icons/messages-icons";
import AnnouncementMessageCard from "@/components/ui/messages/announcement-message-card";
import AudioMessageCard from "@/components/ui/messages/audio-message-card";
import CreateAnnouncementBottomSheet from "@/components/ui/messages/create-announcement-bottom-sheet";
import CreatePollBottomSheet from "@/components/ui/messages/create-poll-bottom-sheet";
import FileMessageCard from "@/components/ui/messages/file-message-card";
import ImageMessageCard from "@/components/ui/messages/image-message-card";
import PollMessageCard from "@/components/ui/messages/poll-message-card";
import ReactionRow from "@/components/ui/messages/reaction-row";
import TextMessageCard from "@/components/ui/messages/text-message-card";
import VideoMessageCard from "@/components/ui/messages/video-message-card";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ConversationResponseDto, MessageResponseDto, messagingService, PollResponseDto } from "@/services/messaging.service";
import { detectSourceLanguage, SUPPORTED_LANGUAGES, translateText } from "@/services/translate.service";
import { useStore } from "@/store";
import { getDisplayName } from "@/utils/user-name";
import { formatTimeAgoShort } from "@/utils/format-time-ago";
import { Ionicons } from "@expo/vector-icons";
import { AVPlaybackStatus, Audio, ResizeMode, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Clipboard, DeviceEventEmitter, Dimensions, FlatList, Image, KeyboardAvoidingView, Linking, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import InCallManager from "react-native-incall-manager";

export default function ChatScreen() {
    type RecorderMode = "idle" | "recording" | "locked" | "preview" | "sending";
    const resolvePickerMediaType = (kind: "image" | "video") => {
        const pickerAny = ImagePicker as any;
        if (pickerAny.MediaType) {
            return kind === "image" ? pickerAny.MediaType.Image : pickerAny.MediaType.Video;
        }
        if (pickerAny.MediaTypeOptions) {
            return kind === "image" ? pickerAny.MediaTypeOptions.Images : pickerAny.MediaTypeOptions.Videos;
        }
        return kind === "image" ? "images" : "videos";
    };
    const { t, i18n } = useTranslation();
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPollSheet, setShowPollSheet] = useState(false);
    const [showAnnouncementSheet, setShowAnnouncementSheet] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
    const [showAttachingMenu, setShowAttachingMenu] = useState(false);
    const [fullScreenImageUri, setFullScreenImageUri] = useState<string | null>(null);
    const [videoModalUri, setVideoModalUri] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [selectedOtherMessage, setSelectedOtherMessage] = useState<MessageResponseDto | null>(null);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const messageViewRefs = useRef<Record<string, View | null>>({});
    const videoRef = useRef<Video | null>(null);
    const [recorderMode, setRecorderMode] = useState<RecorderMode>("idle");
    const recordingRef = useRef<Audio.Recording | null>(null);
    const [recordingDurationMs, setRecordingDurationMs] = useState(0);
    const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);
    const [previewAudio, setPreviewAudio] = useState<{ uri: string; durationSeconds?: number } | null>(null);
    const [previewIsPlaying, setPreviewIsPlaying] = useState(false);
    const [previewPositionMs, setPreviewPositionMs] = useState(0);
    const [previewDurationMs, setPreviewDurationMs] = useState(0);
    const previewSoundRef = useRef<Audio.Sound | null>(null);
    const recorderModeRef = useRef<RecorderMode>("idle");
    const micPressingRef = useRef(false);
    const gestureOutcomeRef = useRef<"none" | "locked" | "cancelled">("none");
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [audioPositions, setAudioPositions] = useState<Record<string, number>>({});
    const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
    const soundRef = useRef<Audio.Sound | null>(null);
    const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
    const [audioRouteSessionActive, setAudioRouteSessionActive] = useState(false);
    const [isProximityNear, setIsProximityNear] = useState(false);
    const [isHeadsetPlugged, setIsHeadsetPlugged] = useState(false);
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
    const isRecording = recorderMode === "recording" || recorderMode === "locked";
    const isRecorderLocked = recorderMode === "locked";
    const isRecorderPreview = recorderMode === "preview";
    const WAVEFORM_BAR_COUNT = 28;
    const LOCK_THRESHOLD = 70;
    const CANCEL_THRESHOLD = 90;

    useEffect(() => {
        recorderModeRef.current = recorderMode;
    }, [recorderMode]);

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
        messageContainer: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: "80%", minWidth: 200 },
        myMessage: { backgroundColor: t.tint, alignSelf: "flex-end", },
        otherMessage: { backgroundColor: t.panel, alignSelf: "flex-start" },
        messageContainerPoll: { backgroundColor: "transparent", padding: 0, maxWidth: "85%" },
        messageText: { color: '#fff' },
        messageOtherText: {
            color: t.text
        },
        timeText: { fontSize: 10, marginTop: 5, alignSelf: "flex-end" },
        messageFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, gap: 8 },
        dateHeader: {
            alignItems: "center",
            marginTop: 16,
            marginBottom: 8,
            marginHorizontal: 15,
        },
        dateHeaderText: {
            fontSize: 12,
            color: t.subText,
            backgroundColor: t.panel,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            overflow: "hidden",
        },
        readStatusContainer: { flexDirection: "row", alignItems: "center" },
        actions: { flexDirection: "row", alignItems: "center", gap: 10 },
        actionIcon: { padding: 2 },
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
        videoThumbnail: { minWidth: 200, width: 200, height: 100, borderRadius: 8, marginTop: 5 },
        imageThumbnail: { minWidth: 200, width: 200, height: 150, borderRadius: 8, marginTop: 5 },
        inputContainer: { flexDirection: "row", paddingVertical: 10, borderTopWidth: 1, borderColor: t.border, alignItems: "flex-end", paddingHorizontal: 15, paddingBottom: 10, backgroundColor: t.bg },
        inputWrapper: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 8 },
        attachmentButton: {
            padding: 8,
            marginRight: 5,
            // backgroundColor: "rgba(215, 169, 227, 0.25)",
            borderRadius: 8
        },
        input: { flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, minHeight: 40, maxHeight: 100, color: t.text, backgroundColor: t.panel || t.bg, fontSize: 16 },
        sendButton: { backgroundColor: t.tint, padding: 10, borderRadius: 8, marginLeft: 5, alignItems: "center", justifyContent: "center", minWidth: 40, minHeight: 40 },
        micButton: { backgroundColor: t.panel || t.bg, padding: 10, borderRadius: 8, marginLeft: 5, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: t.border, minWidth: 40, minHeight: 40 },
        recordingContainer: {
            flex: 1,
            minHeight: 42,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            backgroundColor: t.panel || t.bg,
            justifyContent: "center",
            gap: 6,
        },
        recordingHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
        recordingDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: "#ff3b30" },
        recordingTimer: { color: t.text, fontWeight: "700", fontSize: 13 },
        recordingHint: { color: t.subText || t.text, fontSize: 11 },
        waveformRow: {
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 2,
            minHeight: 18,
            flex: 1,
            maxHeight: 20,
            overflow: "hidden",
            paddingVertical: 1,
        },
        waveformBar: { width: 4, borderRadius: 8, backgroundColor: t.tint, minHeight: 4 },
        recorderLockButton: { backgroundColor: t.panel || t.bg, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: t.border, alignItems: "center", justifyContent: "center", marginLeft: 5, minWidth: 40, minHeight: 40 },
        previewActions: { flexDirection: "row", gap: 8, marginLeft: 8 },
        previewActionButton: { backgroundColor: t.panel || t.bg, borderWidth: 1, borderColor: t.border, alignItems: "center", justifyContent: "center", padding: 10, borderRadius: 8, minWidth: 40, minHeight: 40 },
        previewDeleteButton: { borderColor: "#ff3b3055", backgroundColor: "#ff3b3010" },
        previewDeleteLeftButton: { marginRight: 8 },
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
            backgroundColor: t.panel,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarPlaceholderText: { color: t.text, fontSize: 14, fontWeight: '600' },
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
            // Don't toast here: loadMessages() runs in parallel on mount and shows the same
            // network/API error — two toasts are confusing. Errors still surface from loadMessages.
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
                feedback.toast.error('Error', errorMessage);
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
            feedback.toast.error('Error', error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                feedback.toast.info("Permission Required", "Sorry, we need camera roll permissions to select images!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: resolvePickerMediaType("image"),
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadAndSendFile(result.assets[0].uri, 'image', result.assets[0].mimeType || 'image/jpeg');
            }
        } catch (error: any) {
            console.error("Error picking image:", error);
            feedback.toast.error("Error", "Failed to pick image");
        }
    };

    const pickVideo = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                feedback.toast.info("Permission Required", "Sorry, we need camera roll permissions to select videos!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: resolvePickerMediaType("video"),
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedVideo = result.assets[0];
                const durationMs = selectedVideo.duration ?? 0;
                const maxVideoDurationMs = 60 * 1000; // 1 minute

                if (durationMs > maxVideoDurationMs) {
                    feedback.toast.info("Video too long", "Please select a video up to 1 minute.");
                    return;
                }

                await uploadAndSendFile(result.assets[0].uri, 'video', result.assets[0].mimeType || 'video/mp4');
            }
        } catch (error: any) {
            console.error("Error picking video:", error);
            feedback.toast.error("Error", "Failed to pick video");
        }
    };

    const handleOpenAttachmentMenu = useCallback(() => {
        if (uploadingFile) {
            feedback.toast.info("Upload in progress", "Please wait until the current upload finishes.");
            return;
        }
        if (sending) {
            return;
        }
        setShowAttachingMenu(true);
    }, [sending, uploadingFile]);

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
            feedback.toast.error("Error", "Failed to pick document");
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
            feedback.toast.error('Error', error.message || 'Failed to upload file');
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

    const handleAnnouncementCreated = async (message: MessageResponseDto) => {
        addMessage(conversationId, message);
        setShowAnnouncementSheet(false);
    };

    const handleSelectMedia = async () => {
        const selectedIndex = await feedback.actionSheet({
            title: "Select Media",
            options: [
                { label: t("buttons.image") },
                { label: t("buttons.video") },
            ],
        });

        if (selectedIndex === 0) {
            await pickImage();
            return;
        }

        if (selectedIndex === 1) {
            await pickVideo();
        }
    };

    const handleSelectFiles = () => {
        setShowAttachingMenu(false);
        const delay = Platform.OS === "ios" ? 600 : 400;
        setTimeout(() => {
            void pickDocument();
        }, delay);
    };

    const requestRecordingPermission = useCallback(async (): Promise<boolean> => {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
            feedback.alert(
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

    const cleanupPreviewSound = useCallback(async () => {
        if (!previewSoundRef.current) return;
        try {
            await previewSoundRef.current.unloadAsync();
        } catch {
            // noop
        } finally {
            previewSoundRef.current = null;
            setPreviewIsPlaying(false);
            setPreviewPositionMs(0);
        }
    }, []);

    const resetRecorderUi = useCallback(async () => {
        await cleanupPreviewSound();
        setRecordingDurationMs(0);
        setRecordingWaveform([]);
        setPreviewAudio(null);
        setPreviewPositionMs(0);
        setPreviewDurationMs(0);
        gestureOutcomeRef.current = "none";
        setRecorderMode("idle");
    }, [cleanupPreviewSound]);

    const startRecording = useCallback(async () => {
        if (!conversationId || uploadingFile || sending || isRecording) return;
        if (isParentInGroup) return;
        const ok = await requestRecordingPermission();
        if (!ok) return;

        try {
            await cleanupPreviewSound();
            const options = {
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                ios: {
                    ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
                    isMeteringEnabled: true,
                },
                android: {
                    ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
                    isMeteringEnabled: true,
                },
            };
            const { recording } = await Audio.Recording.createAsync(options as any);
            recording.setProgressUpdateInterval(120);
            recording.setOnRecordingStatusUpdate((status) => {
                if (!status.isRecording) return;
                setRecordingDurationMs(status.durationMillis ?? 0);
                const metering = typeof status.metering === "number" ? status.metering : -160;
                const normalized = Math.max(0.08, Math.min(1, (metering + 160) / 160));
                setRecordingWaveform((prev) => [...prev.slice(-(WAVEFORM_BAR_COUNT - 1)), normalized]);
            });
            recordingRef.current = recording;
            setRecordingDurationMs(0);
            setRecordingWaveform([]);
            if (gestureOutcomeRef.current === "cancelled") {
                await recording.stopAndUnloadAsync();
                recordingRef.current = null;
                await resetRecorderUi();
                return;
            }
            if (gestureOutcomeRef.current === "locked") {
                setRecorderMode("locked");
            } else {
                setRecorderMode("recording");
            }
        } catch (error: any) {
            console.error("Failed to start recording:", error);
            feedback.toast.error("Error", error?.message || "Could not start recording");
        }
    }, [conversationId, uploadingFile, sending, isRecording, isParentInGroup, requestRecordingPermission, cleanupPreviewSound, WAVEFORM_BAR_COUNT, resetRecorderUi]);

    const stopRecordingToPreview = useCallback(async () => {
        const recording = recordingRef.current;
        if (!recording) return;
        try {
            setRecorderMode("preview");
            recordingRef.current = null;
            const status = await recording.getStatusAsync();
            const durationMillis = status.durationMillis ?? recordingDurationMs;
            if (!status.isDoneRecording) {
                await recording.stopAndUnloadAsync();
            }
            const uri = recording.getURI();
            if (!uri) {
                await resetRecorderUi();
                feedback.toast.error("Error", "Recording file not available");
                return;
            }
            const durationSeconds = durationMillis > 0 ? Math.round(durationMillis / 1000) : 0;
            if (durationSeconds < 1) {
                await resetRecorderUi();
                feedback.toast.info("Too short", t("chat.voiceTooShort"));
                return;
            }
            setPreviewAudio({ uri, durationSeconds });
            setPreviewDurationMs(durationMillis);
            setPreviewPositionMs(0);
        } catch (error: any) {
            console.error("Failed to stop recording:", error);
            await resetRecorderUi();
            feedback.toast.error("Error", error?.message || "Failed to process voice message");
        }
    }, [recordingDurationMs, resetRecorderUi, t]);

    const cancelRecording = useCallback(async () => {
        const recording = recordingRef.current;
        try {
            if (recording) {
                const status = await recording.getStatusAsync();
                if (!status.isDoneRecording) {
                    await recording.stopAndUnloadAsync();
                }
            }
        } catch {
            // noop
        } finally {
            recordingRef.current = null;
            await resetRecorderUi();
        }
    }, [resetRecorderUi]);

    const sendPreviewRecording = useCallback(async () => {
        if (!previewAudio || !conversationId) return;
        try {
            setRecorderMode("sending");
            const ts = Date.now();
            await uploadAndSendFile(previewAudio.uri, "audio", "audio/m4a", `voice-${ts}.m4a`, previewAudio.durationSeconds);
            await resetRecorderUi();
        } catch (error: any) {
            setRecorderMode("preview");
            feedback.toast.error("Error", error?.message || "Failed to send voice message");
        }
    }, [previewAudio, conversationId, uploadAndSendFile, resetRecorderUi]);

    const togglePreviewPlayback = useCallback(async () => {
        if (!previewAudio?.uri) return;
        try {
            if (!previewSoundRef.current) {
                const { sound } = await Audio.Sound.createAsync({ uri: previewAudio.uri }, { shouldPlay: true });
                previewSoundRef.current = sound;
                setPreviewIsPlaying(true);
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (!status.isLoaded) return;
                    setPreviewPositionMs(status.positionMillis ?? 0);
                    setPreviewDurationMs(status.durationMillis ?? previewDurationMs);
                    if (status.didJustFinish) {
                        setPreviewIsPlaying(false);
                        setPreviewPositionMs(0);
                    }
                });
                return;
            }
            const status = await previewSoundRef.current.getStatusAsync();
            if (!status.isLoaded) return;
            if (status.isPlaying) {
                await previewSoundRef.current.pauseAsync();
                setPreviewIsPlaying(false);
            } else {
                const isAtEnd =
                    (status.durationMillis ?? 0) > 0 &&
                    (status.positionMillis ?? 0) >= (status.durationMillis ?? 0) - 120;
                if (isAtEnd) {
                    await previewSoundRef.current.setPositionAsync(0);
                    setPreviewPositionMs(0);
                }
                await previewSoundRef.current.playAsync();
                setPreviewIsPlaying(true);
            }
        } catch {
            feedback.toast.error("Error", "Failed to preview recording");
        }
    }, [previewAudio, previewDurationMs]);

    const micPanResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: () => micPressingRef.current && !isRecorderLocked,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gestureState) => {
            if (isRecorderLocked) return;
            if (gestureState.dy < -LOCK_THRESHOLD) {
                gestureOutcomeRef.current = "locked";
                if (recorderModeRef.current === "recording") {
                    setRecorderMode("locked");
                }
                return;
            }
            if (gestureState.dx < -CANCEL_THRESHOLD) {
                gestureOutcomeRef.current = "cancelled";
                if (recorderModeRef.current === "recording" || recorderModeRef.current === "locked") {
                    void cancelRecording();
                }
            }
        },
        onPanResponderRelease: () => {
            micPressingRef.current = false;
            if (gestureOutcomeRef.current === "none" && recorderModeRef.current === "recording") {
                void stopRecordingToPreview();
            }
        },
        onPanResponderTerminate: () => {
            micPressingRef.current = false;
        },
    }), [isRecorderLocked, LOCK_THRESHOLD, CANCEL_THRESHOLD, cancelRecording, stopRecordingToPreview]);

    const handleFilePress = (url: string) => {
        if (url) Linking.openURL(url);
    };

    const handleVideoPress = (url: string) => {
        stopAudioRouteSession();
        setVideoModalUri(url);
    };

    const handleVideoPlaybackStatusUpdate = useCallback(
        (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;
            if (!status.didJustFinish) return;

            // Rewind to start after finishing so the user can replay.
            void videoRef.current?.setStatusAsync({
                shouldPlay: false,
                positionMillis: 0,
            });
        },
        []
    );

    const handleImagePress = (uri: string) => {
        setFullScreenImageUri(uri);
    };

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (!conversationId) return;

        feedback.alert(
            "Delete Message",
            "Are you sure you want to delete this message? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await messagingService.deleteMessage(messageId);
                            removeMessage(conversationId, messageId);
                        } catch (error: any) {
                            feedback.toast.error("Error", error?.message ?? "Failed to delete message");
                        }
                    },
                },
            ]
        );
    }, [conversationId, removeMessage]);

    const handleEditMessage = useCallback((message: MessageResponseDto) => {
        if (message.type !== "text" && message.type !== "announcement") return;
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
            feedback.toast.error("Error", error?.message ?? "Failed to update message");
        }
    }, [conversationId, editingMessageId, editDraft, updateMessageInStore]);

    const handleCancelEdit = useCallback(() => {
        setEditingMessageId(null);
        setEditDraft("");
    }, []);

    const handleCopyMessage = useCallback(async (message: MessageResponseDto) => {
        try {
            let textToCopy = "";
            if (message.type === "text" || message.type === "announcement") {
                textToCopy = message.content || "";
            } else if (message.type === "file") {
                textToCopy = message.fileName || message.mediaUrl || "";
            } else {
                textToCopy = message.mediaUrl || "";
            }

            if (textToCopy) {
                Clipboard.setString(textToCopy);
                feedback.toast.success("Copied", "Message copied to clipboard");
            }
        } catch {
            feedback.toast.error("Error", "Failed to copy message");
        }
    }, []);

    const handleReaction = useCallback(async (emoji: string) => {
        if (!selectedOtherMessage || !currentUserId || !conversationId) return;
        setShowReactionPicker(false);
        const messageId = selectedOtherMessage.id;
        setSelectedOtherMessage(null);
        try {
            const updated = await messagingService.addReaction(
                messageId,
                currentUserId,
                emoji,
                i18n.language
            );
            updateMessageInStore(conversationId, messageId, updated);
        } catch (err: any) {
            feedback.toast.error("Error", err?.message ?? "Failed to add reaction");
        }
    }, [selectedOtherMessage, currentUserId, conversationId, i18n.language, updateMessageInStore]);

    const handleRemoveReaction = useCallback(async () => {
        if (!selectedOtherMessage || !currentUserId || !conversationId) return;
        setShowReactionPicker(false);
        const messageId = selectedOtherMessage.id;
        setSelectedOtherMessage(null);
        try {
            const updated = await messagingService.removeReaction(
                messageId,
                currentUserId,
                i18n.language
            );
            if (updated?.id) {
                updateMessageInStore(conversationId, messageId, updated);
            } else {
                loadMessages();
            }
        } catch (err: any) {
            feedback.toast.error("Error", err?.message ?? "Failed to remove reaction");
        }
    }, [selectedOtherMessage, currentUserId, conversationId, i18n.language, updateMessageInStore, loadMessages]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const formatDateHeader = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();

        // Reset time to compare only dates
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // If message is from today
        if (messageDate.getTime() === today.getTime()) {
            return "Today";
        }

        // If message is from yesterday
        if (messageDate.getTime() === yesterday.getTime()) {
            return "Yesterday";
        }

        // If within a week, show day name
        const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return dayNames[date.getDay()];
        }

        // Otherwise show full date
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const isSameDay = (date1: string, date2: string) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    };

    const formatAudioDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const applyAudioRoute = useCallback(async () => {
        if (!audioRouteSessionActive) return;
        try {
            const shouldUseEarpiece = !isHeadsetPlugged && isProximityNear;
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: shouldUseEarpiece,
            });

            if (Platform.OS === "ios") {
                // On iOS, InCallManager speaker-forcing APIs are unreliable/no-op.
                return;
            }

            // Enforce route at native layer too (some Android devices ignore Expo route alone).
            if (shouldUseEarpiece) {
                InCallManager.setForceSpeakerphoneOn(false);
                InCallManager.setSpeakerphoneOn(false);
            } else {
                InCallManager.setForceSpeakerphoneOn(true);
                InCallManager.setSpeakerphoneOn(true);
            }
        } catch (error) {
            console.error("Failed to apply audio route:", error);
        }
    }, [audioRouteSessionActive, isHeadsetPlugged, isProximityNear]);

    const startAudioRouteSession = useCallback(() => {
        if (audioRouteSessionActive) return;
        try {
            if (Platform.OS === "ios") {
                setAudioRouteSessionActive(true);
                return;
            }

            // Use "video" profile to avoid forced earpiece defaults on some devices.
            InCallManager.start({ media: "video", auto: false });
            InCallManager.startProximitySensor();
            setAudioRouteSessionActive(true);
        } catch (error) {
            console.error("Failed to start audio route session:", error);
        }
    }, [audioRouteSessionActive]);

    const stopAudioRouteSession = useCallback(() => {
        if (!audioRouteSessionActive) return;
        try {
            if (Platform.OS !== "ios") {
                InCallManager.stopProximitySensor();
                InCallManager.stop();
            }
            // Expo AV audio mode is global; reset to speaker route after voice playback.
            void Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
        } catch (error) {
            console.error("Failed to stop audio route session:", error);
        } finally {
            setAudioRouteSessionActive(false);
            setIsProximityNear(false);
        }
    }, [audioRouteSessionActive]);

    const handleAudioPlay = async (audioUrl: string, messageId: string, durationSeconds?: number) => {
        try {
            if (!audioUrl?.trim()) {
                feedback.toast.error("Error", "Audio source is not available");
                return;
            }

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
                stopAudioRouteSession();
                return;
            }

            // Ensure audio session is in playback mode (record mode can break output routing/playback).
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            startAudioRouteSession();

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
                        stopAudioRouteSession();
                        if (positionUpdateInterval.current) {
                            clearInterval(positionUpdateInterval.current);
                            positionUpdateInterval.current = null;
                        }
                    }
                }
            });
        } catch (error: any) {
            console.error('Error playing audio:', error);
            stopAudioRouteSession();
            feedback.toast.error('Error', 'Failed to play audio');
        }
    };

    useEffect(() => {
        void applyAudioRoute();
    }, [applyAudioRoute]);

    useEffect(() => {
        if (Platform.OS !== "android") return;

        const onProximity = (data: { isNear?: boolean }) => {
            setIsProximityNear(Boolean(data?.isNear));
        };
        const onWiredHeadset = (data: { isPlugged?: boolean }) => {
            setIsHeadsetPlugged(Boolean(data?.isPlugged));
        };

        const proximitySubscription = DeviceEventEmitter.addListener("Proximity", onProximity);
        const wiredHeadsetSubscription = DeviceEventEmitter.addListener("WiredHeadset", onWiredHeadset);

        return () => {
            proximitySubscription.remove();
            wiredHeadsetSubscription.remove();
        };
    }, []);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
            if (previewSoundRef.current) {
                previewSoundRef.current.unloadAsync();
            }
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => { });
            }
            if (positionUpdateInterval.current) {
                clearInterval(positionUpdateInterval.current);
            }
            stopAudioRouteSession();
        };
    }, [stopAudioRouteSession]);

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
        const isAnnouncement = item.type === "announcement";

        // Check if we need to show date header
        const showDateHeader = index === 0 || (messages[index - 1] && !isSameDay(item.createdAt, messages[index - 1].createdAt));

        const messageContent = (
            <View
                ref={(ref) => {
                    messageViewRefs.current[item.id] = ref;
                }}
                style={[
                    styles.messageContainer,
                    isPoll
                        ? [styles.messageContainerPoll, isMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]
                        : isAnnouncement
                            ? [styles.messageContainerPoll, isMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]
                            : (isMe ? styles.myMessage : styles.otherMessage),
                ]}>
                {item.type === "text" && item.content && (
                    <TextMessageCard
                        message={item}
                        isMe={isMe}
                        translatedContent={translateMessages ? translatedCache[item.id] : undefined}
                        isTranslating={translateMessages && translatingIds.has(item.id)}
                        isPoll={!!isPoll}
                        messageTime={messageTime}
                        reactions={item.reactions}
                        myReaction={item.myReaction}
                        onEdit={() => handleEditMessage(item)}
                        onDelete={() => handleDeleteMessage(item.id)}
                        onCopy={!isMe ? () => handleCopyMessage(item) : undefined}
                        onReaction={!isMe ? () => { setSelectedOtherMessage(item); setShowReactionPicker(true); } : undefined}
                    />
                )}
                {item.type === "announcement" && item.content && (
                    <AnnouncementMessageCard
                        message={item}
                        isMe={isMe}
                        translatedContent={translateMessages ? translatedCache[item.id] : undefined}
                        isTranslating={translateMessages && translatingIds.has(item.id)}
                        messageTime={messageTime}
                        reactions={item.reactions}
                        myReaction={item.myReaction}
                        onEdit={() => handleEditMessage(item)}
                        onDelete={() => handleDeleteMessage(item.id)}
                        onCopy={!isMe ? () => handleCopyMessage(item) : undefined}
                        onReaction={!isMe ? () => { setSelectedOtherMessage(item); setShowReactionPicker(true); } : undefined}
                    />
                )}
                {item.type === "image" && item.mediaUrl && (
                    <ImageMessageCard
                        message={item}
                        isMe={isMe}
                        isPoll={!!isPoll}
                        messageTime={messageTime}
                        reactions={item.reactions}
                        myReaction={item.myReaction}
                        onImagePress={handleImagePress}
                        onDelete={() => handleDeleteMessage(item.id)}
                        onCopy={!isMe ? () => handleCopyMessage(item) : undefined}
                        onReaction={!isMe ? () => { setSelectedOtherMessage(item); setShowReactionPicker(true); } : undefined}
                    />
                )}
                {item.type === "video" && (item.thumbnailUrl ?? item.mediaUrl) && item.mediaUrl && (
                    <VideoMessageCard
                        message={item}
                        isMe={isMe}
                        isPoll={!!isPoll}
                        messageTime={messageTime}
                        reactions={item.reactions}
                        myReaction={item.myReaction}
                        onVideoPress={handleVideoPress}
                        onDelete={() => handleDeleteMessage(item.id)}
                        onCopy={!isMe ? () => handleCopyMessage(item) : undefined}
                        onReaction={!isMe ? () => { setSelectedOtherMessage(item); setShowReactionPicker(true); } : undefined}
                    />
                )}
                {item.type === "audio" && item.mediaUrl && (
                    <AudioMessageCard
                        message={item}
                        isMe={isMe}
                        messageTime={messageTime}
                        reactions={item.reactions}
                        myReaction={item.myReaction}
                        playingAudioId={playingAudioId}
                        audioPositions={audioPositions}
                        audioDurations={audioDurations}
                        onPlay={handleAudioPlay}
                        onDelete={() => handleDeleteMessage(item.id)}
                        onCopy={!isMe ? () => handleCopyMessage(item) : undefined}
                        onReaction={() => { setSelectedOtherMessage(item); setShowReactionPicker(true); }}
                        formatAudioDuration={formatAudioDuration}
                    />
                )}
                {item.type === "file" && (
                    <FileMessageCard
                        message={item}
                        isMe={isMe}
                        isPoll={!!isPoll}
                        messageTime={messageTime}
                        reactions={item.reactions}
                        myReaction={item.myReaction}
                        onFilePress={handleFilePress}
                        onDelete={() => handleDeleteMessage(item.id)}
                        onCopy={!isMe ? () => handleCopyMessage(item) : undefined}
                        onReaction={!isMe ? () => { setSelectedOtherMessage(item); setShowReactionPicker(true); } : undefined}
                    />
                )}
                {item.type === "poll" && item.polls?.length && (
                    <>
                        <PollMessageCard
                            pollId={item.polls[0].id}
                            isMe={isMe}
                            translatedQuestion={translateMessages ? translatedPollCache[item.id]?.question : undefined}
                            translatedOptions={translateMessages ? translatedPollCache[item.id]?.options : undefined}
                            isTranslating={!!(translateMessages && translatingIds.has(item.id))}
                            onVote={() => { }}
                            onClosePoll={() => {
                                loadMessages();
                            }}
                            onEditPoll={() => {
                                feedback.toast.info("Edit Poll", "Edit poll is not available yet.");
                            }}
                        />
                        {item.reactions && item.reactions.length > 0 && (
                            <ReactionRow reactions={item.reactions} myReaction={item.myReaction} />
                        )}
                        <View style={styles.messageFooter}>
                            <Text style={[styles.timeText, { color: theme.subText ?? '#666' }]}>
                                {messageTime}
                            </Text>
                            {!isPoll && (
                                <>
                                    {isMe ? (
                                        <View style={[styles.readStatusContainer, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
                                            <View style={styles.actions}>
                                                <TouchableOpacity
                                                    style={styles.actionIcon}
                                                    onPress={() => handleDeleteMessage(item.id)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <TrashIcon size={12} color={theme.subText ?? '#666'} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={[styles.readStatusContainer, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
                                            <View style={styles.actions}>
                                                <TouchableOpacity
                                                    style={styles.actionIcon}
                                                    onPress={() => handleCopyMessage(item)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <CopyIcon size={12} color={theme.subText ?? '#666'} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.actionIcon}
                                                    onPress={() => { setSelectedOtherMessage(item); setShowReactionPicker(true); }}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <EmojiIcon size={12} color={theme.subText ?? '#666'} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </>
                )}
                {isMe && isLastReadMessage && (item.userStatus === 'read' || (item as any).isRead) && (
                    <Text style={[styles.timeText, { fontSize: 9, marginTop: 2, fontStyle: 'italic' }, isPoll ? { color: theme.subText ?? '#666' } : { color: '#fff' }]}>
                        Read
                    </Text>
                )}
            </View>
        );

        // Date header above the message group (first in JSX = top in layout)
        const contentWithHeader = (
            <>
                {showDateHeader && (
                    <View style={styles.dateHeader}>
                        <Text style={styles.dateHeaderText}>
                            {formatDateHeader(item.createdAt)}
                        </Text>
                    </View>
                )}
                {messageContent}
            </>
        );

        return contentWithHeader;
    };

    const getConversationName = () => {
        if (!conversation) return 'Chat';
        if (typeof conversation.name === 'string') return conversation.name;
        if (conversation.type === 'direct' && conversation.participants) {
            const otherParticipant = conversation.participants.find((p: any) => p.user.id !== currentUserId);
            if (otherParticipant) {
                return getDisplayName(
                    otherParticipant.user.firstName,
                    otherParticipant.user.lastName,
                    otherParticipant.user.email
                );
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
    const getOnlineStatus = useMemo(() => {
        if (!conversation || conversation.type !== 'direct') return null;

        const otherParticipant = conversation.participants?.find((p: any) => p.user.id !== currentUserId);
        if (!otherParticipant) return null;

        // Check if user is online based on lastOnline timestamp
        // Consider user online if they were active within the last 5 minutes
        const lastOnline = otherParticipant.user?.lastOnline;
        if (!lastOnline) return 'Offline';

        const lastOnlineDate = new Date(lastOnline);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - lastOnlineDate.getTime()) / 1000);
        const isOnline = diffInSeconds < 300; // 5 minutes = 300 seconds

        return isOnline ? 'Online' : formatTimeAgoShort(lastOnline as string, false);
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

    const recordingDurationLabel = formatAudioDuration(Math.max(1, Math.round(recordingDurationMs / 1000)));
    const waveformPoints = recordingWaveform.length
        ? recordingWaveform
        : Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0.12);
    const previewProgress = previewDurationMs > 0 ? Math.min(1, previewPositionMs / previewDurationMs) : 0;

    const renderChatComposer = () => {
        if (isParentInGroup) {
            return (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 }}>
                    <Text style={{ fontSize: 13, color: theme.subText || theme.text + "99", textAlign: "center" }}>
                        Only teachers and admins can send messages in this group.
                    </Text>
                </View>
            );
        }

        if (isRecorderPreview && previewAudio) {
            return (
                <>
                    <TouchableOpacity
                        style={[styles.previewActionButton, styles.previewDeleteButton, styles.previewDeleteLeftButton]}
                        onPress={() => void resetRecorderUi()}
                    >
                        <Ionicons name="trash-outline" size={20} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.recordingContainer}>
                        <View style={styles.recordingHeader}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: 54 }}>
                                <Text style={styles.recordingTimer}>{formatAudioDuration(Math.max(0, Math.round(previewPositionMs / 1000)))}</Text>
                            </View>
                            <View style={styles.waveformRow}>
                                {waveformPoints.map((point, index) => (
                                    <View
                                        key={`preview-wf-${index}`}
                                        style={[
                                            styles.waveformBar,
                                            {
                                                height: 4 + Math.round(point * 14),
                                                opacity: index / Math.max(1, waveformPoints.length - 1) <= previewProgress ? 1 : 0.3,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                    <View style={styles.previewActions}>
                        <TouchableOpacity style={styles.previewActionButton} onPress={togglePreviewPlayback}>
                            <Ionicons name={previewIsPlaying ? "pause" : "play"} size={18} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.sendButton} onPress={() => void sendPreviewRecording()}>
                        <SendIcon color="#fff" size={16} />
                    </TouchableOpacity>
                </>
            );
        }

        return (
            <>
                <View style={styles.inputWrapper}>
                    <TouchableOpacity
                        style={styles.attachmentButton}
                        onPress={handleOpenAttachmentMenu}
                        disabled={sending || isRecording}
                    >
                        <Ionicons
                            name="add"
                            size={24}
                            color={theme.text}
                        />
                    </TouchableOpacity>
                    {isRecording ? (
                        <View style={styles.recordingContainer}>
                            <View style={styles.recordingHeader}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: 54 }}>
                                    <View style={styles.recordingDot} />
                                    <Text style={styles.recordingTimer}>{recordingDurationLabel}</Text>
                                </View>
                                <View style={styles.waveformRow}>
                                    {waveformPoints.map((point, index) => (
                                        <View key={`wf-${index}`} style={[styles.waveformBar, { height: 4 + Math.round(point * 16) }]} />
                                    ))}
                                </View>
                            </View>
                        </View>
                    ) : (
                        <TextInput
                            style={styles.input}
                            placeholder={t("placeholders.typeMessage")}
                            placeholderTextColor={theme.subText || theme.text + "80"}
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
                    )}
                </View>

                {isRecorderLocked ? (
                    <>
                        <TouchableOpacity style={styles.recorderLockButton} onPress={() => void cancelRecording()}>
                            <Ionicons name="trash-outline" size={18} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sendButton} onPress={() => void stopRecordingToPreview()}>
                            <SendIcon color="#fff" size={16} />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.micButton, isRecording && { backgroundColor: theme.tint + "1f", borderColor: theme.tint + "66" }]}
                            onPressIn={() => {
                                micPressingRef.current = true;
                                gestureOutcomeRef.current = "none";
                                void startRecording();
                            }}
                            onPressOut={() => {
                                micPressingRef.current = false;
                                if (gestureOutcomeRef.current === "none" && recorderModeRef.current === "recording") {
                                    void stopRecordingToPreview();
                                }
                            }}
                            disabled={sending || uploadingFile || isRecorderPreview}
                            accessibilityLabel={isRecording ? "Stop and send voice message" : "Record voice message"}
                            {...micPanResponder.panHandlers}
                        >
                            <VoiceIcon
                                color={isRecording ? theme.tint : (theme.text || "rgba(18, 18, 18, 1)")}
                                size={20}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.sendButton, (sending || uploadingFile || !input.trim() || isRecording) && { opacity: 0.5 }]}
                            onPress={handleSendMessage}
                            disabled={sending || uploadingFile || !input.trim() || isRecording}
                            accessibilityRole="button"
                            accessibilityLabel="Send message"
                            accessibilityHint="Double tap to send your message"
                            accessibilityState={{ disabled: sending || uploadingFile || !input.trim() || isRecording }}
                        >
                            {(sending || uploadingFile) ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <SendIcon color="#fff" size={16} />
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </>
        );
    };

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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
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
                                        const name = getDisplayName(
                                            other.user.firstName,
                                            other.user.lastName,
                                            other.user.email || ''
                                        );
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
                {Platform.OS === 'android' ? (
                    <KeyboardStickyView offset={{ opened: -Math.max(insets.bottom, 10), closed: 0 }}>
                        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                            {renderChatComposer()}
                        </View>
                    </KeyboardStickyView>
                ) : (
                    <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                        {renderChatComposer()}
                    </View>
                )}

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

                {/* Reaction Picker Modal */}
                <Modal
                    visible={showReactionPicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowReactionPicker(false)}
                >
                    <View style={StyleSheet.absoluteFill}>
                        <TouchableOpacity
                            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0, 0, 0, 0.3)" }]}
                            activeOpacity={1}
                            onPress={() => setShowReactionPicker(false)}
                        />
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <View style={{
                                backgroundColor: theme.panel || theme.bg,
                                borderRadius: 20,
                                padding: 20,
                                minWidth: 280,
                                maxWidth: 320,
                            }}>
                                <Text style={{ fontSize: 18, fontWeight: "600", color: theme.text, marginBottom: 16, textAlign: "center" }}>
                                    Add Reaction
                                </Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
                                    {["👍", "❤️", "😂", "😮", "😢", "🙏", "👏", "🔥"].map((emoji) => (
                                        <TouchableOpacity
                                            key={emoji}
                                            onPress={() => handleReaction(emoji)}
                                            style={{
                                                width: 50,
                                                height: 50,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                borderRadius: 25,
                                                backgroundColor: theme.border + "40",
                                            }}
                                        >
                                            <Text style={{ fontSize: 28 }}>{emoji}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {selectedOtherMessage?.myReaction && (
                                    <TouchableOpacity
                                        onPress={() => handleRemoveReaction()}
                                        style={{
                                            marginTop: 16,
                                            padding: 12,
                                            borderRadius: 10,
                                            backgroundColor: theme.border + "40",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ color: theme.text, fontSize: 16 }}>
                                            {t("Remove reaction", "Remove reaction")}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowReactionPicker(false)}
                                    style={{
                                        marginTop: 20,
                                        padding: 12,
                                        borderRadius: 10,
                                        backgroundColor: theme.border + "40",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ color: theme.text, fontSize: 16 }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Attaching Menu */}
                <AttachingMenu
                    visible={showAttachingMenu}
                    onClose={() => setShowAttachingMenu(false)}
                    onSelectPoll={() => setShowPollSheet(true)}
                    onSelectMedia={handleSelectMedia}
                    onSelectFiles={handleSelectFiles}
                    onSelectAnnouncement={() => {
                        setShowAttachingMenu(false);
                        setShowAnnouncementSheet(true);
                    }}
                    isGroup={conversation?.type === "group"}
                />

                {/* Poll Creation Bottom Sheet */}
                {conversationId && (
                    <CreatePollBottomSheet
                        visible={showPollSheet}
                        onClose={() => setShowPollSheet(false)}
                        conversationId={conversationId}
                        onPollCreated={handlePollCreated}
                    />
                )}

                {/* Announcement Creation Bottom Sheet */}
                {conversationId && (
                    <CreateAnnouncementBottomSheet
                        visible={showAnnouncementSheet}
                        onClose={() => setShowAnnouncementSheet(false)}
                        conversationId={conversationId}
                        onAnnouncementCreated={handleAnnouncementCreated}
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
                                onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
                                onError={(e) => {
                                    console.error("Video error:", e);
                                    feedback.toast.error("Error", "Failed to play video");
                                }}
                            />
                        )}
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </View>
    );
}
