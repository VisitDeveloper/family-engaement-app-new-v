import HeaderThreeSections from "@/components/reptitive-component/header-three-sections";
import { feedback } from "@/lib/feedback";
import AttachingMenu from "@/components/ui/attaching-menu";
import { TranslateIcon } from "@/components/ui/icons/common-icons";
import { CopyIcon, EmojiIcon, SendIcon, TrashIcon, VoiceIcon } from "@/components/ui/icons/messages-icons";
import AnnouncementMessageCard from "@/components/ui/messages/announcement-message-card";
import AudioMessageCard from "@/components/ui/messages/audio-message-card";
import ChatStickyAudioPlayer from "@/components/ui/messages/chat-sticky-audio-player";
import CreateAnnouncementBottomSheet from "@/components/ui/messages/create-announcement-bottom-sheet";
import CreatePollBottomSheet from "@/components/ui/messages/create-poll-bottom-sheet";
import FileMessageCard from "@/components/ui/messages/file-message-card";
import ImageMessageCard from "@/components/ui/messages/image-message-card";
import PollMessageCard from "@/components/ui/messages/poll-message-card";
import ReactionRow from "@/components/ui/messages/reaction-row";
import TextMessageCard from "@/components/ui/messages/text-message-card";
import VideoMessageCard from "@/components/ui/messages/video-message-card";
import MessageUploadStatus from "@/components/ui/messages/message-upload-status";
import { MessageListSkeleton } from "@/components/ui/messages/message-list-skeleton";
import { createPendingOutgoingMessage, isPendingMessageId } from "@/utils/pending-chat-message";
import type { ClientMessageUpload } from "@/types";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { getProfileScopeKey } from "@/utils/chat-store";
import { ConversationResponseDto, MessageResponseDto, messagingService, PollResponseDto } from "@/services/messaging.service";
import { detectSourceLanguage, SUPPORTED_LANGUAGES, translateText } from "@/services/translate.service";
import { useStore } from "@/store";
import { getDisplayName } from "@/utils/user-name";
import { formatTimeAgoShort } from "@/utils/format-time-ago";
import { Ionicons } from "@expo/vector-icons";
import { AppVideoPlayerModal } from "@/components/ui/app-video-player-modal";
import { setPlaybackAudioMode, setRecordingAudioMode } from "@/lib/audio-session";
import {
    createAudioPlayer,
    type AudioPlayer,
    RecordingPresets,
    requestRecordingPermissionsAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Clipboard, DeviceEventEmitter, Dimensions, FlatList, Image, KeyboardAvoidingView, Linking, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SpeakableText } from "@/components/speakable-text";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import InCallManager from "react-native-incall-manager";

const WAVEFORM_BAR_COUNT = 28;
const MIN_VOICE_RECORDING_MS = 500;

const VOICE_RECORDING_OPTIONS = {
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
};

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
    const [editingPoll, setEditingPoll] = useState<{
        pollId: string;
        question: string;
        options: string[];
    } | null>(null);
    const [showAnnouncementSheet, setShowAnnouncementSheet] = useState(false);
    const [showAttachingMenu, setShowAttachingMenu] = useState(false);
    const [fullScreenImageUri, setFullScreenImageUri] = useState<string | null>(null);
    const [videoModalUri, setVideoModalUri] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [selectedOtherMessage, setSelectedOtherMessage] = useState<MessageResponseDto | null>(null);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const messageViewRefs = useRef<Record<string, View | null>>({});
    const flatListRef = useRef<FlatList<MessageResponseDto> | null>(null);
    const [isPlayingMessageVisible, setIsPlayingMessageVisible] = useState(true);
    const [recorderMode, setRecorderMode] = useState<RecorderMode>("idle");
    const audioRecorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
    const recorderState = useAudioRecorderState(audioRecorder, 120);
    const isStartingRecordingRef = useRef(false);
    const [recordingDurationMs, setRecordingDurationMs] = useState(0);
    const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);
    const [previewAudio, setPreviewAudio] = useState<{ uri: string; durationSeconds?: number } | null>(null);
    const [previewIsPlaying, setPreviewIsPlaying] = useState(false);
    const [previewPositionMs, setPreviewPositionMs] = useState(0);
    const [previewDurationMs, setPreviewDurationMs] = useState(0);
    const previewPlayerRef = useRef<AudioPlayer | null>(null);
    const previewStatusSubscriptionRef = useRef<{ remove: () => void } | null>(null);
    const recorderModeRef = useRef<RecorderMode>("idle");
    const micPressingRef = useRef(false);
    const gestureOutcomeRef = useRef<"none" | "locked" | "cancelled">("none");
    /** If user cancels before prepare/record finishes, drop the recording when it starts. */
    const discardRecordingAfterPrepareRef = useRef(false);
    const recordingDurationMsRef = useRef(0);
    const isFinishingRecordingRef = useRef(false);
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [audioPositions, setAudioPositions] = useState<Record<string, number>>({});
    const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
    const messagePlayerRef = useRef<AudioPlayer | null>(null);
    const messageStatusSubscriptionRef = useRef<{ remove: () => void } | null>(null);
    const playingAudioIdRef = useRef<string | null>(null);
    const pendingAudioIdRef = useRef<string | null>(null);
    const audioPlayGenerationRef = useRef(0);
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
    const prevProfileScopeRef = useRef<string | null>(null);
    const effectiveRole = useEffectiveRole();
    const currentProfile = useStore((state: any) => state.currentProfile);
    const profileScopeKey = getProfileScopeKey(currentProfile);
    const { chatID } = useLocalSearchParams<{ chatID: string }>();
    const conversationId = chatID;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isRecording = recorderMode === "recording" || recorderMode === "locked";
    const isRecorderLocked = recorderMode === "locked";
    const isRecorderPreview = recorderMode === "preview";
    /** Distance (px) from touch start; kept moderate so slow drags still count. */
    const LOCK_THRESHOLD = 32;
    const CANCEL_THRESHOLD = 42;

    useEffect(() => {
        recorderModeRef.current = recorderMode;
    }, [recorderMode]);

    useEffect(() => {
        if (recorderMode !== "recording" && recorderMode !== "locked") return;
        if (!recorderState.isRecording) return;
        const durationMs = recorderState.durationMillis ?? 0;
        recordingDurationMsRef.current = durationMs;
        setRecordingDurationMs(durationMs);
        if (typeof recorderState.metering === "number") {
            const normalized = Math.max(0.08, Math.min(1, (recorderState.metering + 160) / 160));
            setRecordingWaveform((prev) => [...prev.slice(-(WAVEFORM_BAR_COUNT - 1)), normalized]);
        }
    }, [recorderMode, recorderState]);

    const setRecorderModeImmediate = useCallback((mode: RecorderMode) => {
        recorderModeRef.current = mode;
        setRecorderMode(mode);
    }, []);

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
    const isParentInGroup = effectiveRole === "parent" && conversation?.type === "group";
    const isMessagingFeatureEnabled = currentUser?.canSendMessages !== false;
    const canUserSendMessages = !isParentInGroup && isMessagingFeatureEnabled;
    const sendDisabledReason = !isMessagingFeatureEnabled
        ? "Sending messages is temporarily disabled."
        : "Only teachers and admins can send messages in this group.";

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
        videoThumbnail: { width: 200, height: 113, borderRadius: 8, marginTop: 5 },
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
        recordingGestureBar: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 4,
            backgroundColor: t.bg,
        },
        recordingGestureChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 24,
            backgroundColor: t.panel || t.bg,
            borderWidth: 1,
            borderColor: t.border,
        },
        recordingGestureChipText: { color: t.subText || t.text, fontSize: 13, fontWeight: "500" },
        recordingContainer: {
            flex: 1,
            minHeight: 40,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            backgroundColor: t.panel || t.bg,
            justifyContent: "center",
        },
        recordingHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
        recordingDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: "#ff3b30" },
        recordingTimer: { color: t.text, fontWeight: "700", fontSize: 13 },
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

    const loadMessages = useCallback(
        async (opts?: { background?: boolean; fromProfileChange?: boolean }) => {
            if (!conversationId || typeof conversationId !== 'string') {
                console.warn('Invalid conversationId:', conversationId);
                setLoading(false);
                return;
            }

            const cached =
                (useStore.getState().messages[conversationId] || []).length > 0;
            const background = opts?.background ?? cached;
            if (!background) {
                setLoading(true);
            }

            try {
                const response = await messagingService.getMessages(conversationId, { limit: 50 });
                if (response && response.messages) {
                    setMessages(conversationId, response.messages.reverse());
                } else if (!cached) {
                    setMessages(conversationId, []);
                }
            } catch (error: any) {
                console.error('Error loading messages:', error);
                const errorMessage = error?.message || 'Failed to load messages';
                const status = error?.status as number | undefined;
                if (opts?.fromProfileChange && (status === 404 || status === 403)) {
                    router.back();
                    return;
                }
                if (status !== 404) {
                    feedback.toast.error('Error', errorMessage);
                }
                if (!cached) {
                    setMessages(conversationId, []);
                }
            } finally {
                if (!background) {
                    setLoading(false);
                }
            }
        },
        [conversationId, router, setMessages]
    );

    useEffect(() => {
        if (!conversationId || typeof conversationId !== 'string') {
            return;
        }

        const cached =
            (useStore.getState().messages[conversationId] || []).length > 0;
        const profileChanged =
            prevProfileScopeRef.current !== null &&
            prevProfileScopeRef.current !== profileScopeKey;
        prevProfileScopeRef.current = profileScopeKey;

        loadConversation();
        void loadMessages({
            background: cached || profileChanged,
            fromProfileChange: profileChanged,
        });

        messagingService.setActiveConversation(conversationId).catch((error) => {
            console.error('Error setting messaging presence:', error);
        });

        messagingService.markConversationAsRead(conversationId).catch((error) => {
            console.error('Error marking conversation as read:', error);
        });
        markConversationAsRead(conversationId, { unreadCount: 0 });

        return () => {
            messagingService.setActiveConversation(null).catch((error) => {
                console.error('Error clearing messaging presence:', error);
            });
        };
    }, [
        conversationId,
        profileScopeKey,
        loadConversation,
        loadMessages,
        markConversationAsRead,
    ]);

    const handleSendMessage = async () => {
        if (!input.trim() || !conversationId || sending) return;
        if (!canUserSendMessages) return;

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
        if (!canUserSendMessages) {
            feedback.toast.info("Messaging disabled", sendDisabledReason);
            return;
        }
        if (sending) {
            return;
        }
        setShowAttachingMenu(true);
    }, [canUserSendMessages, sendDisabledReason, sending]);

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

    const patchPendingUpload = useCallback(
        (pendingId: string, patch: Partial<ClientMessageUpload>) => {
            if (!conversationId) return;
            const existing = (useStore.getState().messages[conversationId] || []).find(
                (m: MessageResponseDto) => m.id === pendingId
            );
            if (!existing?.clientUpload) return;
            updateMessageInStore(conversationId, pendingId, {
                clientUpload: { ...existing.clientUpload, ...patch },
            });
        },
        [conversationId, updateMessageInStore]
    );

    const uploadAndSendFile = useCallback(async (
        uri: string,
        type: 'image' | 'video' | 'audio' | 'file',
        mimeType: string,
        fileName?: string,
        durationSeconds?: number,
        existingPendingId?: string
    ) => {
        if (!conversationId || !currentUserId) return;
        if (!canUserSendMessages) return;

        const retryPayload = {
            uri,
            type,
            mimeType,
            fileName,
            durationSeconds,
        };

        const ensureUploadableFileUri = async (inputUri: string): Promise<string> => {
            const u = inputUri.trim();
            if (!u) return inputUri;

            if (u.startsWith("file://")) {
                try {
                    const info = await FileSystem.getInfoAsync(u);
                    if (info.exists) return u;
                } catch {
                    // fallthrough
                }
            }

            const baseDir = (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "") as string;
            const uploadsDir = `${baseDir}uploads`;
            const extMatch = /\.([a-z0-9]+)(?:\?.*)?$/i.exec(u);
            const ext = extMatch?.[1] ? `.${extMatch[1]}` : "";
            const dest = `${uploadsDir}/${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;

            try {
                if (baseDir) {
                    await FileSystem.makeDirectoryAsync(uploadsDir, { intermediates: true }).catch(() => { });
                }
                await FileSystem.copyAsync({ from: u, to: dest });
                return dest;
            } catch {
                if (/^https?:\/\//i.test(u)) {
                    await FileSystem.makeDirectoryAsync(uploadsDir, { intermediates: true }).catch(() => { });
                    const result = await FileSystem.downloadAsync(u, dest);
                    return result.uri;
                }
                return inputUri;
            }
        };

        const fileUri = await ensureUploadableFileUri(uri);
        const name = fileName || fileUri.split('/').pop() || 'file';

        let pendingId = existingPendingId;
        if (!pendingId) {
            const pendingMessage = createPendingOutgoingMessage({
                conversationId,
                senderId: currentUserId,
                sender: currentUser
                    ? {
                        id: currentUser.id,
                        email: currentUser.email ?? "",
                        firstName: currentUser.firstName ?? null,
                        lastName: currentUser.lastName ?? null,
                    }
                    : null,
                type,
                localUri: fileUri,
                fileName: name,
                mimeType,
                durationSeconds,
                thumbnailUrl: type === "video" ? fileUri : undefined,
                retryPayload: { ...retryPayload, uri: fileUri },
            });
            pendingId = pendingMessage.id;
            addMessage(conversationId, pendingMessage);
        } else {
            patchPendingUpload(pendingId, {
                status: "uploading",
                progress: 0,
                localUri: fileUri,
                retryPayload: { ...retryPayload, uri: fileUri },
            });
        }

        let progressInterval: ReturnType<typeof setInterval> | null = null;
        try {
            const formData = new FormData();
            // @ts-ignore - FormData in React Native works differently
            formData.append('file', {
                uri: fileUri,
                type: mimeType,
                name: name,
            } as any);

            progressInterval = setInterval(() => {
                const existing = (useStore.getState().messages[conversationId] || []).find(
                    (m: MessageResponseDto) => m.id === pendingId
                );
                const currentProgress = existing?.clientUpload?.progress ?? 0;
                if (currentProgress < 90) {
                    patchPendingUpload(pendingId!, { progress: currentProgress + 8 });
                }
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

            if (progressInterval) clearInterval(progressInterval);
            patchPendingUpload(pendingId!, { progress: 100 });

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

            removeMessage(conversationId, pendingId!);
            addMessage(conversationId, newMessage);
        } catch (error: any) {
            console.error('Error uploading file:', error);
            if (progressInterval) clearInterval(progressInterval);
            patchPendingUpload(pendingId!, {
                status: "failed",
                progress: 0,
            });
        }
    }, [
        conversationId,
        currentUserId,
        currentUser,
        canUserSendMessages,
        addMessage,
        removeMessage,
        updateMessageInStore,
        patchPendingUpload,
    ]);

    const handleRemovePendingMessage = useCallback(
        (messageId: string) => {
            if (!conversationId) return;
            removeMessage(conversationId, messageId);
        },
        [conversationId, removeMessage]
    );

    const handleResendPendingMessage = useCallback(
        (message: MessageResponseDto) => {
            const payload = message.clientUpload?.retryPayload;
            if (!payload || !conversationId) return;
            void uploadAndSendFile(
                payload.uri,
                payload.type,
                payload.mimeType,
                payload.fileName,
                payload.durationSeconds,
                message.id
            );
        },
        [conversationId, uploadAndSendFile]
    );

    const handlePollCreated = async (poll: PollResponseDto, message: MessageResponseDto) => {
        addMessage(conversationId, { ...message, polls: [poll] });
        setShowPollSheet(false);
    };

    const handlePollUpdated = async () => {
        setEditingPoll(null);
        await loadMessages();
    };

    const handleEditPoll = async (pollId: string) => {
        try {
            const poll = await messagingService.getPoll(pollId);
            if (poll.isClosed) {
                feedback.toast.error("Error", "This poll is closed and cannot be edited.");
                return;
            }
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
            if (totalVotes > 0) {
                feedback.toast.error("Error", "Cannot edit a poll that already has votes.");
                return;
            }
            setEditingPoll({
                pollId: poll.id,
                question: poll.question,
                options: poll.options.map((opt) => opt.text),
            });
        } catch (err: any) {
            feedback.toast.error("Error", err?.message || "Failed to load poll for editing.");
        }
    };

    const closePollSheet = () => {
        setShowPollSheet(false);
        setEditingPoll(null);
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
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
            feedback.alert(
                'Microphone access',
                'Microphone permission is needed to record voice messages.',
                [{ text: 'OK' }]
            );
            return false;
        }
        await setRecordingAudioMode();
        return true;
    }, []);

    const cleanupPreviewPlayer = useCallback(() => {
        previewStatusSubscriptionRef.current?.remove();
        previewStatusSubscriptionRef.current = null;
        if (previewPlayerRef.current) {
            try {
                previewPlayerRef.current.remove();
            } catch {
                // noop
            }
            previewPlayerRef.current = null;
        }
        setPreviewIsPlaying(false);
        setPreviewPositionMs(0);
    }, []);

    const stopMessagePlayer = useCallback(() => {
        messageStatusSubscriptionRef.current?.remove();
        messageStatusSubscriptionRef.current = null;
        if (messagePlayerRef.current) {
            try {
                const player = messagePlayerRef.current;
                if (player.playing) {
                    player.pause();
                }
                player.remove();
            } catch {
                // noop
            }
            messagePlayerRef.current = null;
        }
        if (positionUpdateInterval.current) {
            clearInterval(positionUpdateInterval.current);
            positionUpdateInterval.current = null;
        }
    }, []);

    const resetRecorderUi = useCallback(async () => {
        cleanupPreviewPlayer();
        recordingDurationMsRef.current = 0;
        isFinishingRecordingRef.current = false;
        setRecordingDurationMs(0);
        setRecordingWaveform([]);
        setPreviewAudio(null);
        setPreviewPositionMs(0);
        setPreviewDurationMs(0);
        gestureOutcomeRef.current = "none";
        setRecorderModeImmediate("idle");
    }, [cleanupPreviewPlayer, setRecorderModeImmediate]);

    const startRecording = useCallback(async () => {
        if (!conversationId || sending) return;
        if (!canUserSendMessages) return;
        if (audioRecorder.isRecording || isStartingRecordingRef.current) return;
        const ok = await requestRecordingPermission();
        if (!ok) {
            await resetRecorderUi();
            return;
        }

        isStartingRecordingRef.current = true;
        try {
            cleanupPreviewPlayer();
            recordingDurationMsRef.current = 0;
            setRecordingDurationMs(0);
            setRecordingWaveform([]);
            await audioRecorder.prepareToRecordAsync();
            if (discardRecordingAfterPrepareRef.current) {
                discardRecordingAfterPrepareRef.current = false;
                try {
                    await audioRecorder.stop();
                } catch {
                    // noop
                }
                await resetRecorderUi();
                return;
            }
            if (gestureOutcomeRef.current === "cancelled") {
                try {
                    await audioRecorder.stop();
                } catch {
                    // noop
                }
                await resetRecorderUi();
                return;
            }
            audioRecorder.record();
            if (gestureOutcomeRef.current === "locked") {
                if (!micPressingRef.current) {
                    setRecorderModeImmediate("locked");
                }
            } else {
                setRecorderModeImmediate("recording");
            }
        } catch (error: any) {
            console.error("Failed to start recording:", error);
            feedback.toast.error("Error", error?.message || "Could not start recording");
            await resetRecorderUi();
        } finally {
            isStartingRecordingRef.current = false;
        }
    }, [conversationId, sending, canUserSendMessages, requestRecordingPermission, cleanupPreviewPlayer, resetRecorderUi, setRecorderModeImmediate, audioRecorder]);

    const stopRecordingToPreview = useCallback(async () => {
        if (recorderModeRef.current === "preview" || recorderModeRef.current === "sending") return;
        if (isFinishingRecordingRef.current) return;

        const recorderActive =
            recorderModeRef.current === "recording" ||
            recorderModeRef.current === "locked" ||
            audioRecorder.isRecording ||
            isStartingRecordingRef.current;
        if (!recorderActive) return;

        isFinishingRecordingRef.current = true;
        try {
            if (isStartingRecordingRef.current) {
                for (let i = 0; i < 30 && isStartingRecordingRef.current; i += 1) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }
            }

            const statusBeforeStop = audioRecorder.getStatus();
            const durationMillis = Math.max(
                statusBeforeStop.durationMillis ?? 0,
                recordingDurationMsRef.current,
                recordingDurationMs
            );

            if (audioRecorder.isRecording) {
                await audioRecorder.stop();
            }

            const uri = audioRecorder.uri;
            if (!uri) {
                await resetRecorderUi();
                feedback.toast.error("Error", "Recording file not available");
                return;
            }

            if (durationMillis < MIN_VOICE_RECORDING_MS) {
                await resetRecorderUi();
                if (durationMillis > 0) {
                    feedback.toast.info("Too short", t("chat.voiceTooShort"));
                }
                return;
            }

            const durationSeconds = Math.max(1, Math.ceil(durationMillis / 1000));
            cleanupPreviewPlayer();
            setPreviewAudio({ uri, durationSeconds });
            setPreviewDurationMs(durationMillis);
            setPreviewPositionMs(0);
            setRecorderModeImmediate("preview");
        } catch (error: any) {
            console.error("Failed to stop recording:", error);
            await resetRecorderUi();
            feedback.toast.error("Error", error?.message || "Failed to process voice message");
        } finally {
            isFinishingRecordingRef.current = false;
        }
    }, [recordingDurationMs, resetRecorderUi, t, setRecorderModeImmediate, audioRecorder, cleanupPreviewPlayer]);

    const cancelRecording = useCallback(async () => {
        const hadRecording = audioRecorder.isRecording || isStartingRecordingRef.current;
        try {
            if (audioRecorder.isRecording) {
                await audioRecorder.stop();
            }
        } catch {
            // noop
        } finally {
            if (!hadRecording) {
                discardRecordingAfterPrepareRef.current = true;
            }
            await resetRecorderUi();
        }
    }, [resetRecorderUi, audioRecorder]);

    const sendPreviewRecording = useCallback(async () => {
        if (!previewAudio || !conversationId) return;
        try {
            setRecorderModeImmediate("sending");
            const ts = Date.now();
            await uploadAndSendFile(previewAudio.uri, "audio", "audio/m4a", `voice-${ts}.m4a`, previewAudio.durationSeconds);
            await resetRecorderUi();
        } catch (error: any) {
            setRecorderModeImmediate("preview");
            feedback.toast.error("Error", error?.message || "Failed to send voice message");
        }
    }, [previewAudio, conversationId, uploadAndSendFile, resetRecorderUi, setRecorderModeImmediate]);

    const togglePreviewPlayback = useCallback(() => {
        if (!previewAudio?.uri) return;
        try {
            audioPlayGenerationRef.current += 1;
            stopMessagePlayer();
            playingAudioIdRef.current = null;
            pendingAudioIdRef.current = null;
            setPlayingAudioId(null);

            if (!previewPlayerRef.current) {
                const player = createAudioPlayer(previewAudio.uri, { updateInterval: 100 });
                previewPlayerRef.current = player;
                previewStatusSubscriptionRef.current = player.addListener(
                    "playbackStatusUpdate",
                    (status) => {
                        if (!status.isLoaded) return;
                        setPreviewPositionMs(status.currentTime * 1000);
                        setPreviewDurationMs(status.duration * 1000);
                        if (status.didJustFinish) {
                            setPreviewIsPlaying(false);
                            setPreviewPositionMs(0);
                            player.seekTo(0);
                        }
                    }
                );
                player.play();
                setPreviewIsPlaying(true);
                return;
            }
            const player = previewPlayerRef.current;
            if (player.playing) {
                player.pause();
                setPreviewIsPlaying(false);
            } else {
                const durationMs = previewDurationMs > 0 ? previewDurationMs : player.duration * 1000;
                const isAtEnd =
                    durationMs > 0 && previewPositionMs >= durationMs - 120;
                if (isAtEnd) {
                    player.seekTo(0);
                    setPreviewPositionMs(0);
                }
                player.play();
                setPreviewIsPlaying(true);
            }
        } catch {
            feedback.toast.error("Error", "Failed to preview recording");
        }
    }, [previewAudio, previewDurationMs, previewPositionMs, stopMessagePlayer]);

    const micPanResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => !(sending || isRecorderPreview),
                onPanResponderTerminationRequest: () => false,
                onPanResponderGrant: () => {
                    if (sending || isRecorderPreview) return;
                    micPressingRef.current = true;
                    gestureOutcomeRef.current = "none";
                    discardRecordingAfterPrepareRef.current = false;
                    setRecorderModeImmediate("recording");
                    void startRecording();
                },
                onPanResponderMove: (_, gestureState) => {
                    if (gestureOutcomeRef.current === "locked") return;
                    if (gestureState.dy < -LOCK_THRESHOLD) {
                        gestureOutcomeRef.current = "locked";
                        return;
                    }
                    if (gestureState.dx < -CANCEL_THRESHOLD) {
                        gestureOutcomeRef.current = "cancelled";
                        void cancelRecording();
                    }
                },
                onPanResponderRelease: () => {
                    micPressingRef.current = false;
                    if (gestureOutcomeRef.current === "locked") {
                        setRecorderModeImmediate("locked");
                        return;
                    }
                    if (gestureOutcomeRef.current === "cancelled") {
                        return;
                    }
                    if (recorderModeRef.current === "recording" && !isFinishingRecordingRef.current) {
                        if (audioRecorder.isRecording || isStartingRecordingRef.current) {
                            void stopRecordingToPreview();
                        } else {
                            discardRecordingAfterPrepareRef.current = true;
                            void resetRecorderUi();
                        }
                    }
                },
                onPanResponderTerminate: () => {
                    micPressingRef.current = false;
                    if (gestureOutcomeRef.current === "locked") {
                        setRecorderModeImmediate("locked");
                        return;
                    }
                    if (gestureOutcomeRef.current === "cancelled") {
                        return;
                    }
                    if (recorderModeRef.current === "recording" && !isFinishingRecordingRef.current) {
                        if (audioRecorder.isRecording || isStartingRecordingRef.current) {
                            void stopRecordingToPreview();
                        } else {
                            discardRecordingAfterPrepareRef.current = true;
                            void resetRecorderUi();
                        }
                    }
                },
            }),
        [
            sending,
            isRecorderPreview,
            startRecording,
            setRecorderModeImmediate,
            LOCK_THRESHOLD,
            CANCEL_THRESHOLD,
            cancelRecording,
            stopRecordingToPreview,
            resetRecorderUi,
            audioRecorder.isRecording,
        ]
    );

    const handleFilePress = (url: string) => {
        if (url) Linking.openURL(url);
    };

    const handleVideoPress = (url: string) => {
        stopAudioRouteSession();
        setVideoModalUri(url);
    };

    const handleImagePress = (uri: string) => {
        setFullScreenImageUri(uri);
    };

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (!conversationId) return;

        if (isPendingMessageId(messageId)) {
            handleRemovePendingMessage(messageId);
            return;
        }

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
    }, [conversationId, removeMessage, handleRemovePendingMessage]);

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

    const playingMessage = useMemo(
        () => (playingAudioId ? messages.find((m: MessageResponseDto) => m.id === playingAudioId) : undefined),
        [playingAudioId, messages]
    );

    const getPlayingAudioSenderLabel = useCallback(
        (message: MessageResponseDto) => {
            if (message.senderId === currentUserId) {
                return t("chat.stickyVoiceYou");
            }
            if (message.sender) {
                const name = getDisplayName(
                    message.sender.firstName,
                    message.sender.lastName,
                    message.sender.email
                );
                return name ? t("chat.stickyVoiceFrom", { name }) : t("chat.stickyVoiceMessage");
            }
            return t("chat.stickyVoiceMessage");
        },
        [currentUserId, t]
    );

    useEffect(() => {
        setIsPlayingMessageVisible(true);
    }, [playingAudioId]);

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 25 }).current;

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: Array<{ item?: MessageResponseDto }> }) => {
            const activeId = playingAudioIdRef.current;
            if (!activeId) return;
            const isVisible = viewableItems.some((entry) => entry.item?.id === activeId);
            setIsPlayingMessageVisible(isVisible);
        }
    ).current;

    const scrollToPlayingMessage = useCallback(() => {
        if (!playingAudioId) return;
        const index = messages.findIndex((m: MessageResponseDto) => m.id === playingAudioId);
        if (index < 0) return;
        flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
        });
    }, [playingAudioId, messages]);

    const onScrollToIndexFailed = useCallback(
        (info: { index: number; averageItemLength: number }) => {
            flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
            });
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                    viewPosition: 0.5,
                });
            }, 100);
        },
        []
    );

    const showStickyAudioPlayer = Boolean(playingAudioId && playingMessage && !isPlayingMessageVisible);

    const applyAudioRoute = useCallback(async () => {
        if (!audioRouteSessionActive) return;
        try {
            const shouldUseEarpiece = !isHeadsetPlugged && isProximityNear;
            await setPlaybackAudioMode({ routeThroughEarpiece: shouldUseEarpiece });

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
            void setPlaybackAudioMode();
        } catch (error) {
            console.error("Failed to stop audio route session:", error);
        } finally {
            setAudioRouteSessionActive(false);
            setIsProximityNear(false);
        }
    }, [audioRouteSessionActive]);

    const handleAudioPlay = useCallback(async (audioUrl: string, messageId: string, durationSeconds?: number) => {
        try {
            if (!audioUrl?.trim()) {
                feedback.toast.error("Error", "Audio source is not available");
                return;
            }

            const generation = ++audioPlayGenerationRef.current;
            const previousId = playingAudioIdRef.current;
            const wasPending = pendingAudioIdRef.current === messageId;

            stopMessagePlayer();
            cleanupPreviewPlayer();
            pendingAudioIdRef.current = null;

            // Toggle pause on the same message (including while load/play is still in flight).
            if (previousId === messageId || wasPending) {
                if (previousId) {
                    setAudioPositions((prev) => ({ ...prev, [messageId]: 0 }));
                }
                playingAudioIdRef.current = null;
                setPlayingAudioId(null);
                stopAudioRouteSession();
                return;
            }

            if (previousId) {
                setAudioPositions((prev) => ({ ...prev, [previousId]: 0 }));
            }

            pendingAudioIdRef.current = messageId;
            playingAudioIdRef.current = messageId;
            setPlayingAudioId(messageId);

            await setPlaybackAudioMode();
            if (generation !== audioPlayGenerationRef.current) {
                pendingAudioIdRef.current = null;
                playingAudioIdRef.current = null;
                setPlayingAudioId(null);
                return;
            }

            startAudioRouteSession();

            const player = createAudioPlayer(audioUrl, { updateInterval: 100 });
            if (generation !== audioPlayGenerationRef.current) {
                try {
                    player.remove();
                } catch {
                    // noop
                }
                pendingAudioIdRef.current = null;
                playingAudioIdRef.current = null;
                setPlayingAudioId(null);
                return;
            }

            messagePlayerRef.current = player;
            player.play();

            const initialDuration =
                player.duration > 0 ? player.duration : (durationSeconds || 0);

            pendingAudioIdRef.current = null;
            playingAudioIdRef.current = messageId;
            setAudioDurations((prev) => ({ ...prev, [messageId]: initialDuration }));
            setPlayingAudioId(messageId);
            setAudioPositions((prev) => ({ ...prev, [messageId]: 0 }));

            messageStatusSubscriptionRef.current = player.addListener(
                "playbackStatusUpdate",
                (status) => {
                    if (generation !== audioPlayGenerationRef.current) return;
                    if (!status.isLoaded) return;
                    if (status.duration > 0) {
                        setAudioDurations((prev) => ({ ...prev, [messageId]: status.duration }));
                    }
                    setAudioPositions((prev) => ({
                        ...prev,
                        [messageId]: status.currentTime,
                    }));
                    if (status.didJustFinish) {
                        playingAudioIdRef.current = null;
                        setPlayingAudioId(null);
                        setAudioPositions((prev) => ({ ...prev, [messageId]: 0 }));
                        stopMessagePlayer();
                        stopAudioRouteSession();
                    }
                }
            );
        } catch (error: any) {
            console.error("Error playing audio:", error);
            pendingAudioIdRef.current = null;
            stopMessagePlayer();
            playingAudioIdRef.current = null;
            setPlayingAudioId(null);
            stopAudioRouteSession();
            feedback.toast.error("Error", "Failed to play audio");
        }
    }, [cleanupPreviewPlayer, startAudioRouteSession, stopAudioRouteSession, stopMessagePlayer]);

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
            stopMessagePlayer();
            cleanupPreviewPlayer();
            const shouldStopRecorder =
                recorderModeRef.current === "recording" ||
                recorderModeRef.current === "locked" ||
                isStartingRecordingRef.current;
            if (shouldStopRecorder) {
                try {
                    void audioRecorder.stop();
                } catch {
                    // native recorder may already be torn down on unmount
                }
            }
            stopAudioRouteSession();
        };
    }, [stopAudioRouteSession, stopMessagePlayer, cleanupPreviewPlayer, audioRecorder]);

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
        const showBubbleDelete = isMe && !item.clientUpload;
        const onDeleteMessage = showBubbleDelete ? () => handleDeleteMessage(item.id) : undefined;

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
                    item.clientUpload ? { overflow: "hidden", position: "relative" } : null,
                    item.type === "video" ? { alignItems: "flex-start" as const } : null,
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
                        onDelete={onDeleteMessage}
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
                        onDelete={onDeleteMessage}
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
                        onImagePress={item.clientUpload?.status === "uploading" ? undefined : handleImagePress}
                        onDelete={onDeleteMessage}
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
                        onVideoPress={item.clientUpload?.status === "uploading" ? undefined : handleVideoPress}
                        onDelete={onDeleteMessage}
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
                        onPlay={item.clientUpload?.status === "uploading" ? undefined : handleAudioPlay}
                        onDelete={onDeleteMessage}
                        onCopy={!isMe ? () => handleCopyMessage(item) : undefined}
                        onReaction={() => { setSelectedOtherMessage(item); setShowReactionPicker(true); }}
                        formatAudioDuration={formatAudioDuration}
                    />
                )}
                {item.type === "file" && (item.mediaUrl || item.fileName) && (
                    <FileMessageCard
                        message={item}
                        isMe={isMe}
                        isPoll={!!isPoll}
                        messageTime={messageTime}
                        reactions={item.reactions}
                        myReaction={item.myReaction}
                        onFilePress={item.clientUpload?.status === "uploading" ? undefined : handleFilePress}
                        onDelete={onDeleteMessage}
                        onCopy={!isMe ? () => handleCopyMessage(item) : undefined}
                        onReaction={!isMe ? () => { setSelectedOtherMessage(item); setShowReactionPicker(true); } : undefined}
                    />
                )}
                {item.type === "poll" && item.polls?.length && (
                    <>
                        <PollMessageCard
                            key={`${item.polls[0].id}-${item.polls[0].updatedAt ?? item.updatedAt}`}
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
                                const poll = item.polls?.[0];
                                if (poll) handleEditPoll(poll.id);
                            }}
                        />
                        {item.reactions && item.reactions.length > 0 && (
                            <ReactionRow reactions={item.reactions} myReaction={item.myReaction} />
                        )}
                        <View style={styles.messageFooter}>
                            <SpeakableText style={[styles.timeText, { color: theme.subText ?? '#666' }]}>
                                {messageTime}
                            </SpeakableText>
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
                {isMe && isLastReadMessage && !item.clientUpload && (item.userStatus === 'read' || (item as any).isRead) && (
                    <SpeakableText style={[styles.timeText, { fontSize: 9, marginTop: 2, fontStyle: 'italic' }, isPoll ? { color: theme.subText ?? '#666' } : { color: '#fff' }]}>
                        Read
                    </SpeakableText>
                )}
                {item.clientUpload && isMe && (
                    <MessageUploadStatus
                        message={item}
                        isMe={isMe}
                        onResend={
                            item.clientUpload.status === "failed"
                                ? () => handleResendPendingMessage(item)
                                : undefined
                        }
                        onDelete={() => handleRemovePendingMessage(item.id)}
                    />
                )}
            </View>
        );

        // Date header above the message group (first in JSX = top in layout)
        const contentWithHeader = (
            <>
                {showDateHeader && (
                    <View style={styles.dateHeader}>
                        <SpeakableText style={styles.dateHeaderText}>
                            {formatDateHeader(item.createdAt)}
                        </SpeakableText>
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
                <SpeakableText style={styles.avatarPlaceholderText}>{initials}</SpeakableText>
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

    const renderRecordingGestureBar = () => {
        if (!isRecording || isRecorderLocked) return null;
        return (
            <View style={styles.recordingGestureBar} pointerEvents="none">
                <View style={styles.recordingGestureChip}>
                    <Ionicons name="chevron-back" size={18} color={theme.subText || theme.text} />
                    <SpeakableText style={styles.recordingGestureChipText}>{t("common.cancel")}</SpeakableText>
                </View>
                <View style={styles.recordingGestureChip}>
                    <Ionicons name="lock-closed" size={16} color={theme.tint} />
                    <Ionicons name="arrow-up" size={16} color={theme.tint} />
                </View>
            </View>
        );
    };

    const renderChatComposer = () => {
        if (!canUserSendMessages) {
            return (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 }}>
                    <SpeakableText style={{ fontSize: 13, color: theme.subText || theme.text + "99", textAlign: "center" }}>
                        {sendDisabledReason}
                    </SpeakableText>
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
                                <SpeakableText style={styles.recordingTimer}>{formatAudioDuration(Math.max(0, Math.round(previewPositionMs / 1000)))}</SpeakableText>
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
                        <Ionicons name="add" size={24} color={theme.text} />
                    </TouchableOpacity>
                    {isRecording ? (
                        <View style={styles.recordingContainer}>
                            <View style={styles.recordingHeader}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: isRecorderLocked ? 68 : 54 }}>
                                    {isRecorderLocked ? (
                                        <Ionicons name="lock-closed" size={14} color={theme.tint} />
                                    ) : (
                                        <View style={styles.recordingDot} />
                                    )}
                                    <SpeakableText style={styles.recordingTimer}>{recordingDurationLabel}</SpeakableText>
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
                            editable={!sending}
                            accessibilityLabel="Message input"
                            accessibilityHint="Type your message here. Press Enter for a new line, use the send button to send."
                            accessibilityState={{ disabled: sending }}
                            textAlignVertical="top"
                        />
                    )}
                </View>

                {isRecorderLocked ? (
                    <>
                        <TouchableOpacity
                            style={[styles.recorderLockButton, { backgroundColor: theme.tint, borderColor: theme.tint }]}
                            onPress={() => void stopRecordingToPreview()}
                            accessibilityRole="button"
                            accessibilityLabel={t("chat.stopRecording")}
                        >
                            <Ionicons name="stop" size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.sendButton, sending && { opacity: 0.5 }]}
                            onPress={() => void stopRecordingToPreview()}
                            disabled={sending}
                            accessibilityRole="button"
                            accessibilityLabel={t("chat.previewVoice")}
                            accessibilityHint="Finish recording and review before sending"
                            accessibilityState={{ disabled: sending }}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <SendIcon color="#fff" size={16} />
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <View
                            style={[
                                styles.micButton,
                                isRecording && { backgroundColor: theme.tint + "1f", borderColor: theme.tint + "66" },
                                (sending || isRecorderPreview) && { opacity: 0.45 },
                            ]}
                            pointerEvents={sending || isRecorderPreview ? "none" : "auto"}
                            accessibilityRole="button"
                            accessibilityLabel={isRecording ? "Record voice message" : "Record voice message"}
                            accessibilityState={{ disabled: sending || isRecorderPreview }}
                            {...micPanResponder.panHandlers}
                        >
                            <VoiceIcon
                                color={isRecording ? theme.tint : (theme.text || "rgba(18, 18, 18, 1)")}
                                size={20}
                            />
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (sending || (!isRecording && !input.trim())) && { opacity: 0.5 },
                            ]}
                            onPress={() => {
                                if (isRecording) void stopRecordingToPreview();
                                else void handleSendMessage();
                            }}
                            disabled={sending || (!isRecording && !input.trim())}
                            accessibilityRole="button"
                            accessibilityLabel={isRecording ? t("chat.previewVoice") : "Send message"}
                            accessibilityHint={
                                isRecording
                                    ? "Finish recording and review before sending"
                                    : "Double tap to send your message"
                            }
                            accessibilityState={{ disabled: sending || (!isRecording && !input.trim()) }}
                        >
                            {sending ? (
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
            <View style={styles.container}>
                <HeaderThreeSections
                    title={getConversationName()}
                    titlePrefix={getConversationAvatar()}
                />
                <MessageListSkeleton />
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

                {showStickyAudioPlayer && playingMessage?.mediaUrl && (
                    <ChatStickyAudioPlayer
                        senderLabel={getPlayingAudioSenderLabel(playingMessage)}
                        position={audioPositions[playingMessage.id] ?? 0}
                        duration={
                            audioDurations[playingMessage.id] ??
                            (playingMessage.duration ? Number(playingMessage.duration) : 0)
                        }
                        isPlaying={playingAudioId === playingMessage.id}
                        onScrollToMessage={scrollToPlayingMessage}
                        onTogglePlay={() =>
                            void handleAudioPlay(
                                playingMessage.mediaUrl!,
                                playingMessage.id,
                                playingMessage.duration ? Number(playingMessage.duration) : undefined
                            )
                        }
                        formatDuration={formatAudioDuration}
                    />
                )}

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => renderMessage({ item, index })}
                    contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    inverted={true}
                    keyboardShouldPersistTaps="handled"
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    onScrollToIndexFailed={onScrollToIndexFailed}
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
                            <SpeakableText style={{ color: theme.text, fontSize: 14 }}>{t("common.cancel")}</SpeakableText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.editBarSaveButton}
                            onPress={handleSaveEdit}
                            disabled={!editDraft.trim()}
                        >
                            <SpeakableText style={{ color: "#fff", fontSize: 14 }}>{t("common.save")}</SpeakableText>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Input — parent cannot send in group chats */}
                {Platform.OS === 'android' ? (
                    <KeyboardStickyView offset={{ opened: -Math.max(insets.bottom, 10), closed: 0 }}>
                        <View>
                            {renderRecordingGestureBar()}
                            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                                {renderChatComposer()}
                            </View>
                        </View>
                    </KeyboardStickyView>
                ) : (
                    <View>
                        {renderRecordingGestureBar()}
                        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                            {renderChatComposer()}
                        </View>
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
                                <SpeakableText style={{ fontSize: 18, fontWeight: "600", color: theme.text, marginBottom: 16, textAlign: "center" }}>
                                    Add Reaction
                                </SpeakableText>
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
                                            <SpeakableText style={{ fontSize: 28 }}>{emoji}</SpeakableText>
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
                                        <SpeakableText style={{ color: theme.text, fontSize: 16 }}>
                                            {t("Remove reaction", "Remove reaction")}
                                        </SpeakableText>
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
                                    <SpeakableText style={{ color: theme.text, fontSize: 16 }}>Cancel</SpeakableText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Attaching Menu */}
                <AttachingMenu
                    visible={showAttachingMenu}
                    onClose={() => setShowAttachingMenu(false)}
                    onSelectPoll={() => {
                        if (!canUserSendMessages) {
                            feedback.toast.info("Messaging disabled", sendDisabledReason);
                            return;
                        }
                        setShowPollSheet(true);
                    }}
                    onSelectMedia={handleSelectMedia}
                    onSelectFiles={handleSelectFiles}
                    onSelectAnnouncement={() => {
                        if (!canUserSendMessages) {
                            feedback.toast.info("Messaging disabled", sendDisabledReason);
                            return;
                        }
                        setShowAttachingMenu(false);
                        setShowAnnouncementSheet(true);
                    }}
                    isGroup={conversation?.type === "group"}
                />

                {/* Poll Creation Bottom Sheet */}
                {conversationId && (
                    <CreatePollBottomSheet
                        visible={showPollSheet || !!editingPoll}
                        onClose={closePollSheet}
                        conversationId={conversationId}
                        canSendMessages={canUserSendMessages}
                        onPollCreated={handlePollCreated}
                        pollId={editingPoll?.pollId}
                        initialQuestion={editingPoll?.question}
                        initialOptions={editingPoll?.options}
                        onPollUpdated={handlePollUpdated}
                    />
                )}

                {/* Announcement Creation Bottom Sheet */}
                {conversationId && (
                    <CreateAnnouncementBottomSheet
                        visible={showAnnouncementSheet}
                        onClose={() => setShowAnnouncementSheet(false)}
                        conversationId={conversationId}
                        canSendMessages={canUserSendMessages}
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
                            <SpeakableText style={[styles.translateModalTitle, { color: theme.text }]}>{t("translate.modalTitle")}</SpeakableText>
                            <SpeakableText style={[styles.translateModalLabel, { color: theme.subText }]}>{t("translate.fromSource")}</SpeakableText>
                            <ScrollView style={styles.translateModalList} showsVerticalScrollIndicator={false}>
                                <TouchableOpacity
                                    style={[styles.translateModalRow, translateSource === "auto" && { backgroundColor: theme.tint + "30" }]}
                                    onPress={() => setTranslateSource("auto")}
                                >
                                    <SpeakableText style={{ color: theme.text, fontSize: 16 }}>{t("translate.autoDetect")}</SpeakableText>
                                    {translateSource === "auto" && <Ionicons name="checkmark-circle" size={22} color={theme.tint} />}
                                </TouchableOpacity>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[styles.translateModalRow, translateSource === lang.code && { backgroundColor: theme.tint + "30" }]}
                                        onPress={() => setTranslateSource(lang.code)}
                                    >
                                        <SpeakableText style={{ color: theme.text, fontSize: 16 }}>{lang.label}</SpeakableText>
                                        {translateSource === lang.code && <Ionicons name="checkmark-circle" size={22} color={theme.tint} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <SpeakableText style={[styles.translateModalLabel, { color: theme.subText, marginTop: 12 }]}>{t("translate.toTarget")}</SpeakableText>
                            <ScrollView style={styles.translateModalList} showsVerticalScrollIndicator={false}>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[styles.translateModalRow, translateTarget === lang.code && { backgroundColor: theme.tint + "30" }]}
                                        onPress={() => setTranslateTarget(lang.code)}
                                    >
                                        <SpeakableText style={{ color: theme.text, fontSize: 16 }}>{lang.label}</SpeakableText>
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
                                        <SpeakableText style={{ color: theme.subText, fontSize: 14 }}>{t("translate.turnOff")}</SpeakableText>
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
                                    <SpeakableText style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{t("buttons.apply")}</SpeakableText>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                <AppVideoPlayerModal
                    visible={!!videoModalUri}
                    uri={videoModalUri}
                    onClose={() => setVideoModalUri(null)}
                />
            </KeyboardAvoidingView>
        </View>
    );
}
