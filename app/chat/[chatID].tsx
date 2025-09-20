import HeaderThreeSections from "@/components/reptitive-component/header-three-sections";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { usePathname } from 'expo-router';
import { useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Message {
    id: string;
    type: "text" | "audio" | "video";
    content: string;
    time: string;
    sender: "me" | "other";
    mediaUri?: string;
}

const messagesData: Message[] = [
    { id: "1", type: "text", content: "Sarah did wonderful work on her math worksheet today! ...", time: "2:30 PM", sender: "other" },
    { id: "2", type: "audio", content: "", time: "2:32 PM", sender: "other", mediaUri: "audio.mp3" },
    { id: "3", type: "text", content: "That's wonderful to hear! Thank you for the update.", time: "2:45 PM", sender: "me" },
    { id: "4", type: "video", content: "", time: "2:47 PM", sender: "me", mediaUri: "video.mp4" },
];

export default function ChatScreen() {
    const [input, setInput] = useState("");
    const param = usePathname();
    const pathID = param.split('/');
    const id = pathID.pop();
    const chat = useStore((state: any) => state.getChatById(id));

    const theme = useStore((state) => state.theme);

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
        inputContainer: { flexDirection: "row", paddingVertical: 10, borderTopWidth: 1, borderColor: t.border, alignItems: "center", paddingHorizontal: 25, marginBottom: 10 },
        input: { flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 10, height: 40, color: t.text },
        sendButton: { backgroundColor: t.tint, padding: 10, borderRadius: 25, marginLeft: 10 },
    }) as const);


    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender === "me";
        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
                {item.type === "text" && <Text style={isMe ? styles.messageText : styles.messageOtherText}>{item.content}</Text>}
                {item.type === "audio" && <View style={styles.audioPlayer}><Text>Audio Player: {item.mediaUri}</Text></View>}
                {item.type === "video" && <Image source={require('./../../assets/images/timeline-1.jpg')} style={styles.videoThumbnail} />}
                <Text style={[styles.timeText, isMe ? { color: '#fff' } : { color: '#666' }]}>{item.time}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1, }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >

                <HeaderThreeSections
                    title={chat.name}
                    desc={chat.online === true ? 'Online' : 'Offline'}
                    icon={<MaterialIcons name="translate" size={24} color={theme.text} />}
                    colorDesc={chat.online === true ? 'green' : 'red'}
                />


                {/* Messages */}
                <FlatList
                    data={messagesData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 15 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                />

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={input}
                        onChangeText={setInput}
                    />
                    <TouchableOpacity style={styles.sendButton}>
                        <Feather name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({

});
