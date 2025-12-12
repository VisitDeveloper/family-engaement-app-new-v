import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import { useStore } from '@/store';
import { Entypo, Feather, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const messages = [
    { id: '1', type: 'greeting', text: "Hi! I'm your AI Teaching Assistant. I can help you interpret assessment reports, suggest learning activities, and create personalized insights for your students. How can I help you today?", time: 'Just Now' },
    { id: '2', type: 'quick', text: 'Interpret reading assessment' },
    { id: '3', type: 'quick', text: 'Suggest math activities' },
    { id: '4', type: 'quick', text: 'Generate parent communication' },
    { id: '5', type: 'quick', text: 'Create learning goals' },
    { id: '6', type: 'upload', text: 'Upload Assessment Report' },
];

const TeachingAssistantScreen = () => {
    const [inputText, setInputText] = useState('');
    const router = useRouter();

    const colorScheme = useColorScheme();
    const renderItem = ({ item }: any) => {
        switch (item.type) {
            case 'greeting':
                return (
                    // lightColor={Colors.light.backgroundElement} darkColor={Colors.dark.backgroundElement}
                    <ThemedView lightColor={Colors.light.backgroundElementSecondary} darkColor={Colors.dark.backgroundElementSecondary} style={styles.greeting}>
                        <ThemedText type='subText' lightColor={Colors.light.text} darkColor={Colors.dark.text}>{item.text}</ThemedText>
                        <View style={styles.timeContainer}>
                            <Text style={styles.time}>{item.time}</Text>
                            <ThemedView style={[styles.icongreeting, { backgroundColor: 'transparent' }]}>
                                <FontAwesome5 name="copy" size={12} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} />
                                <Feather name="refresh-cw" size={12} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} />
                            </ThemedView>
                        </View>
                    </ThemedView>
                );
            case 'quick':
                return (
                    <View>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionText}>{item.text}</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'upload':
                return (
                    <TouchableOpacity style={styles.uploadButton}>
                        <Feather name="upload" size={20} color={Colors.light.tint} />
                        <Text style={styles.uploadText}>{item.text}</Text>
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };
    const theme = useStore(state => state.theme);

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

                        <FontAwesome5 style={styles.logo} name="robot" size={24} />
                        <View style={{ flexDirection: 'column', marginRight: 20 }}>
                            <ThemedText type='subtitle' style={styles.title}>AI Teaching Assistant</ThemedText>
                            <ThemedText type='subText' style={[styles.subtitle, { color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }]}>Always ready to help</ThemedText>
                        </View>
                        <View>
                            <MaterialIcons name="translate" size={24} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} />
                        </View>
                    </View>
                </ThemedView>


                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15, paddingBottom: 120 }} // فاصله پایین برای input
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                />

                {/* Input */}
                <View style={[styles.inputContainer, { borderTopColor: colorScheme === 'dark' ? Colors.dark.borderColor : Colors.light.borderColor }]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Entypo name="attachment" size={20} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} />
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colorScheme === 'dark' ? Colors.dark.backgroundElementSecondary : Colors.light.backgroundElementSecondary,
                            color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
                            borderColor: colorScheme === 'dark' ? Colors.dark.borderColor : Colors.light.borderColor
                        }]}
                        placeholder="Ask me anything..."
                        value={inputText}
                        onChangeText={setInputText}
                        returnKeyType="send"
                    />
                    <View style={styles.micButton}>
                        <TouchableOpacity>
                            <MaterialCommunityIcons name="microphone-outline" size={20} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sendBtn}>
                            <Feather name="send" size={20} color={Colors.dark.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#fff'
        marginBottom:10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
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
        marginLeft: 15,
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
        marginTop: 15
    },
    time: {
        fontSize: 12,
        color: '#999',
        textAlign: 'left',
        marginTop: 15
    },
    icongreeting: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 15
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
        fontSize: 16,
        color: Colors.light.tint
    },
    uploadButton: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.tint, padding: 10,
        borderRadius: 5, marginTop: 10
    },

    uploadText: {
        color: Colors.light.tint,
        fontSize: 16
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        backgroundColor: 'transparent',
        borderTopWidth: 1,
        height: 80,
        width: '100%',
        // marginBottom: 10
    },

    attachButton: {
        padding: 10
    },
    input: {
        flex: 1,
        borderColor: '#fff',
        borderWidth: 1,
        backgroundColor: '#eee',
        borderRadius: 10,
        padding: 10,
        marginHorizontal: 10,
        height: 40
    },
    micButton: {
        padding: 10,
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendBtn: {
        borderRadius: 8,
        width: 35,
        height: 35,
        backgroundColor: Colors.light.tint,
        padding: 7,
        color: '#fff',
        
    },
});

export default TeachingAssistantScreen;
