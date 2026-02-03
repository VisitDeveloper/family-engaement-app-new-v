import HeaderThreeSections from "@/components/reptitive-component/header-three-sections";
import AttachingMenu from "@/components/ui/attaching-menu";
import CreatePollBottomSheet from "@/components/ui/create-poll-bottom-sheet";
import PollMessageCard from "@/components/ui/poll-message-card";
import PollViewBottomSheet from "@/components/ui/poll-view-bottom-sheet";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ConversationResponseDto, MessageResponseDto, messagingService, PollResponseDto } from "@/services/messaging.service";
import { useStore } from "@/store";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Audio, ResizeMode, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, KeyboardAvoidingView, Linking, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
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
    const videoRef = useRef<Video | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [audioPositions, setAudioPositions] = useState<Record<string, number>>({});
    const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
    const soundRef = useRef<Audio.Sound | null>(null);
    const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
    const { chatID } = useLocalSearchParams<{ chatID: string }>();
    const conversationId = chatID;
    const insets = useSafeAreaInsets();

    // Select data from store instead of calling functions
    const conversations = useStore((state: any) => state.conversations);
    const messagesStore = useStore((state: any) => state.messages);
    const addMessage = useStore((state: any) => state.addMessage);
    const setMessages = useStore((state: any) => state.setMessages);
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
        debugger
        if (!conversationId || !messagesStore) return [];
        return messagesStore[conversationId] || [];
    }, [conversationId, messagesStore]);

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


    const uploadAndSendFile = async (
        uri: string,
        type: 'image' | 'video' | 'audio' | 'file',
        mimeType: string,
        fileName?: string,
        durationSeconds?: number
    ) => {
        if (!conversationId || uploadingFile) return;

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
        addMessage(conversationId, message);
        setShowPollSheet(false);
    };

    const handleSelectMedia = () => {
        Alert.alert(
            "Select Media",
            "Choose an option",
            [
                { text: "Image", onPress: pickImage },
                { text: "Video", onPress: pickVideo },
                { text: "Cancel", style: "cancel" },
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
    }, [conversationId, uploadingFile, sending, requestRecordingPermission]);

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
        // روی iOS باید مودال منو کاملاً بسته شود؛ تأخیر بیشتر برای iOS
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

    const renderMessage = ({ item, index }: { item: MessageResponseDto; index: number }) => {
        const isMe = item.senderId === currentUserId;
        const messageTime = formatTime(item.createdAt);
        const isLastReadMessage = index === lastReadMessageIndex;

        const isPoll = item.type === "poll" && item.polls?.length;

        return (
            <View style={[
                styles.messageContainer,
                isPoll
                    ? [styles.messageContainerPoll, isMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]
                    : (isMe ? styles.myMessage : styles.otherMessage),
            ]}>
                {item.type === "text" && item.content && (
                    <Text style={isMe ? styles.messageText : styles.messageOtherText}>{item.content}</Text>
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
                                {item.isRead ? (
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
                            {item.isRead ? (
                                <Ionicons name="checkmark-done" size={14} color="#fff" />
                            ) : (
                                <Ionicons name="checkmark" size={14} color="#fff" style={{ opacity: 0.7 }} />
                            )}
                        </View>
                    </View>
                )}
                {isMe && isLastReadMessage && item.isRead && (
                    <Text style={[styles.timeText, { fontSize: 9, marginTop: 2, fontStyle: 'italic' }, isPoll ? { color: theme.subText ?? '#666' } : { color: '#fff' }]}>
                        Read
                    </Text>
                )}
            </View>
        );
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
            if (msg.senderId === currentUserId && msg.isRead) {
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
                    desc={getOnlineStatus || undefined}
                    icon={<MaterialIcons name="translate" size={24} color={theme.text} />}
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

                {/* Input */}
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
                        <Ionicons
                            name={isRecording ? 'stop' : 'mic'}
                            size={20}
                            color={isRecording ? theme.tint : (theme.text || 'rgba(18, 18, 18, 1)')}
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
                            <Feather name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>



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
                            <Text style={{ color: "#fff", fontSize: 16 }}>Video</Text>
                            <View style={{ width: 28 }} />
                        </View>
                        {videoModalUri && (
                            <Video
                                ref={videoRef}
                                source={{ uri: videoModalUri }}
                                style={{ flex: 1, width: "100%" }}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                onPlaybackStatusUpdate={() => {}}
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
