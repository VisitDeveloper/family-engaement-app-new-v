import HeaderThreeSections from "@/components/reptitive-component/header-three-sections";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ConversationResponseDto, MessageResponseDto, messagingService } from "@/services/messaging.service";
import { useStore } from "@/store";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ChatScreen() {
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const param = usePathname();
    const pathID = param.split('/');
    const conversationId = pathID.pop();
    
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
        audioPlayer: { height: 50, backgroundColor: "#ddd", justifyContent: "center", padding: 5, borderRadius: 8 },
        videoThumbnail: { width: 150, height: 100, borderRadius: 8, marginTop: 5 },
        imageThumbnail: { width: 200, height: 150, borderRadius: 8, marginTop: 5 },
        inputContainer: { flexDirection: "row", paddingVertical: 10, borderTopWidth: 1, borderColor: t.border, alignItems: "center", paddingHorizontal: 25, marginBottom: 10 },
        input: { flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 10, height: 40, color: t.text },
        sendButton: { backgroundColor: t.tint, padding: 10, borderRadius: 25, marginLeft: 10 },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    }) as const);

    const loadConversation = useCallback(async () => {
        if (!conversationId) return;
        
        try {
            const conv = await messagingService.getConversationById(conversationId);
            // Update store if needed
        } catch (error) {
            console.error('Error loading conversation:', error);
            Alert.alert('Error', 'Failed to load conversation');
        }
    }, [conversationId]);

    const loadMessages = useCallback(async () => {
        if (!conversationId) return;
        
        setLoading(true);
        try {
            const response = await messagingService.getMessages(conversationId, { limit: 50 });
            setMessages(conversationId, response.messages.reverse()); // Reverse to show oldest first
        } catch (error) {
            console.error('Error loading messages:', error);
            Alert.alert('Error', 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [conversationId, setMessages]);

    useEffect(() => {
        loadConversation();
        loadMessages();
        
        // Mark conversation as read when component mounts
        if (conversationId) {
            messagingService.markConversationAsRead(conversationId).catch(console.error);
            markConversationAsRead(conversationId, { unreadCount: 0 });
        }
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

    const renderMessage = ({ item }: { item: MessageResponseDto }) => {
        const isMe = item.senderId === currentUserId;
        const messageTime = formatTime(item.createdAt);
        
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
                <Text style={[styles.timeText, isMe ? { color: '#fff' } : { color: '#666' }]}>
                    {messageTime}
                </Text>
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
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <HeaderThreeSections
                    title={getConversationName()}
                    desc={conversation?.unreadCount ? `${conversation.unreadCount} unread` : 'All read'}
                    icon={<MaterialIcons name="translate" size={24} color={theme.text} />}
                    colorDesc={conversation?.unreadCount ? 'blue' : 'green'}
                />

                {/* Messages */}
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 15 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    inverted={true}
                />

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleSendMessage}
                        editable={!sending}
                        accessibilityLabel="Message input"
                        accessibilityHint="Type your message here"
                        accessibilityState={{ disabled: sending }}
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

const styles = StyleSheet.create({

});
