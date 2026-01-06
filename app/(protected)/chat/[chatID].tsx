import HeaderThreeSections from "@/components/reptitive-component/header-three-sections";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ConversationResponseDto, MessageResponseDto, messagingService } from "@/services/messaging.service";
import { useStore } from "@/store";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
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
        messageText: { color: '#fff' },
        messageOtherText: {
            color: t.text
        },
        timeText: { fontSize: 10, marginTop: 5, alignSelf: "flex-end" },
        messageFooter: { flexDirection: "row", alignItems: "flex-end", justifyContent: "flex-end", marginTop: 4, gap: 4 },
        readStatusContainer: { flexDirection: "row", alignItems: "center" },
        audioPlayer: { height: 50, backgroundColor: "#ddd", justifyContent: "center", padding: 5, borderRadius: 8 },
        videoThumbnail: { width: 150, height: 100, borderRadius: 8, marginTop: 5 },
        imageThumbnail: { width: 200, height: 150, borderRadius: 8, marginTop: 5 },
        inputContainer: { flexDirection: "row", paddingVertical: 10, borderTopWidth: 1, borderColor: t.border, alignItems: "flex-end", paddingHorizontal: 25, paddingBottom: 10, backgroundColor: t.bg },
        input: { flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, minHeight: 40, maxHeight: 100, color: t.text, backgroundColor: t.panel || t.bg, fontSize: 16 },
        sendButton: { backgroundColor: t.tint, padding: 10, borderRadius: 25, marginLeft: 10 },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const renderMessage = ({ item, index }: { item: MessageResponseDto; index: number }) => {
        const isMe = item.senderId === currentUserId;
        const messageTime = formatTime(item.createdAt);
        const isLastReadMessage = index === lastReadMessageIndex;
        
        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
                {item.type === "text" && item.content && (
                    <Text style={isMe ? styles.messageText : styles.messageOtherText}>{item.content}</Text>
                )}
                {item.type === "image" && item.mediaUrl && (
                    <Image 
                        source={{ uri: item.mediaUrl }} 
                        style={styles.imageThumbnail}
                        accessibilityRole="image"
                        accessibilityLabel="Image attachment"
                    />
                )}
                {item.type === "video" && item.mediaUrl && (
                    <Image 
                        source={{ uri: item.mediaUrl }} 
                        style={styles.videoThumbnail}
                        accessibilityRole="image"
                        accessibilityLabel="Video thumbnail"
                    />
                )}
                {item.type === "audio" && item.mediaUrl && (
                    <View style={styles.audioPlayer}>
                        <Text style={isMe ? styles.messageText : styles.messageOtherText}>
                            Audio Message
                        </Text>
                    </View>
                )}
                {item.type === "file" && (
                    <View>
                        <Text style={isMe ? styles.messageText : styles.messageOtherText}>
                            📎 {item.fileName || 'File'}
                        </Text>
                    </View>
                )}
                {item.type === "poll" && (
                    <View>
                        <Text style={isMe ? styles.messageText : styles.messageOtherText}>
                            📊 Poll
                        </Text>
                    </View>
                )}
                <View style={styles.messageFooter}>
                    <Text style={[styles.timeText, isMe ? { color: '#fff' } : { color: '#666' }]}>
                        {messageTime}
                    </Text>
                    {isMe && (
                        <View style={styles.readStatusContainer}>
                            {item.isRead ? (
                                <Ionicons name="checkmark-done" size={14} color="#fff" />
                            ) : (
                                <Ionicons name="checkmark" size={14} color="#fff" style={{ opacity: 0.7 }} />
                            )}
                        </View>
                    )}
                </View>
                {isMe && isLastReadMessage && item.isRead && (
                    <Text style={[styles.timeText, { color: '#fff', fontSize: 9, marginTop: 2, fontStyle: 'italic' }]}>
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
        }else if (conversation.type === 'group' && conversation.name) {
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
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={theme.subText || theme.text + '80'}
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
                    <TouchableOpacity 
                        style={[styles.sendButton, sending && { opacity: 0.5 }]}
                        onPress={handleSendMessage}
                        disabled={sending || !input.trim()}
                        accessibilityRole="button"
                        accessibilityLabel="Send message"
                        accessibilityHint="Double tap to send your message"
                        accessibilityState={{ disabled: sending || !input.trim() }}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Feather name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
