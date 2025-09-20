import { ThemedText } from "@/components/themed-text";
import { useStore } from "@/store";
import { AntDesign, Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ChangePassword() {
    const theme = useStore((state) => state.theme)
    const router = useRouter();

    const [oldPassClosed, setOldPassClosed] = useState(true);
    const [NewPassClosed, setNewPassClosed] = useState(true);
    const [RetypeNewClosed, setRetypeNewClosed] = useState(true);



    return (
        <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Header */}
            <TouchableOpacity onPress={() => router.back()} style={[styles.header, { borderBottomColor: theme.border }]}>
                <AntDesign name="left" size={20} color={theme.text} />
                <Text style={[styles.title, { color: theme.text }]}>Change Password</Text>
            </TouchableOpacity>




            {/* Contact */}
            <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                <View style={styles.row}>
                    <Ionicons name="key-outline" size={24} color={theme.text} />
                    <ThemedText type="subtitle" style={{ color: theme.text, marginLeft: 18 }}>Manage Password</ThemedText>
                </View>

                <View style={{ flexDirection: 'column', borderBottomColor: theme.border, borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 }}>
                    <ThemedText style={{ color: theme.text, fontSize: 16, fontWeight: '600', marginVertical: 10 }}>
                        Old Password
                    </ThemedText>
                    <View style={{ position: "relative" }}>
                        <TextInput placeholder="Old Password" secureTextEntry={oldPassClosed} style={[styles.input, { color: theme.text, backgroundColor: theme.panel, borderRadius: 10 }]} />
                        {
                            oldPassClosed ?
                                <TouchableOpacity onPress={() => setOldPassClosed(false)} style={{ position: "absolute", right: 10, top: 10 }}>
                                    <Octicons name="eye-closed" size={20} color={theme.text} />
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={() => setOldPassClosed(true)} style={{ position: "absolute", right: 10, top: 10 }}>
                                    <Octicons name="eye" size={20} color={theme.text} />
                                </TouchableOpacity>
                        }
                    </View>
                </View>

                <View style={{ flexDirection: 'column', borderBottomColor: theme.border, borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 }}>
                    <ThemedText style={{ color: theme.text, fontSize: 16, fontWeight: '600', marginVertical: 10 }}>
                        New Password
                    </ThemedText>
                    <View style={{ position: "relative" }}>
                        <TextInput placeholder="Old Password" secureTextEntry={NewPassClosed} style={[styles.input, { color: theme.text, backgroundColor: theme.panel, borderRadius: 10 }]} />
                        {
                            NewPassClosed ?
                                <TouchableOpacity onPress={() => setNewPassClosed(false)} style={{ position: "absolute", right: 10, top: 10 }}>
                                    <Octicons name="eye-closed" size={20} color={theme.text} />
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={() => setNewPassClosed(true)} style={{ position: "absolute", right: 10, top: 10 }}>
                                    <Octicons name="eye" size={20} color={theme.text} />
                                </TouchableOpacity>
                        }
                    </View>
                </View>


                <View style={{ flexDirection: 'column', borderBottomColor: theme.border, borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 }}>
                    <ThemedText style={{ color: theme.text, fontSize: 16, fontWeight: '600', marginVertical: 10 }}>
                         Retype New Password
                    </ThemedText>
                    <View style={{ position: "relative" }}>
                        <TextInput placeholder="Old Password" secureTextEntry={RetypeNewClosed} style={[styles.input, { color: theme.text, backgroundColor: theme.panel, borderRadius: 10 }]} />
                        {
                            RetypeNewClosed ?
                                <TouchableOpacity onPress={() => setRetypeNewClosed(false)} style={{ position: "absolute", right: 10, top: 10 }}>
                                    <Octicons name="eye-closed" size={20} color={theme.text} />
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={() => setRetypeNewClosed(true)} style={{ position: "absolute", right: 10, top: 10 }}>
                                    <Octicons name="eye" size={20} color={theme.text} />
                                </TouchableOpacity>
                        }
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: "flex-start", marginTop: 10 }}>
                    <MaterialCommunityIcons name="check" size={16} color={'#467938'} />
                    <ThemedText type="subText" style={{ color: '#467938', marginLeft: 10 }}>
                        Must be at least 8 characters.
                    </ThemedText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: "flex-start", marginTop: 10 }}>
                    <MaterialCommunityIcons name="check" size={16} color={'#467938'} />
                    <ThemedText type="subText" style={{ color: '#467938', marginLeft: 10 }}>
                        Must include a mix of uppercase and
                        lowercase letters, numbers, and special
                        characters.
                    </ThemedText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: "flex-start", marginTop: 10 }}>
                    <MaterialCommunityIcons name="check" size={16} color={'#467938'} />
                    <ThemedText type="subText" style={{ color: '#467938', marginLeft: 10 }}>
                        Must not include your name, birthday, or any
                        other readily available information.
                    </ThemedText>
                </View>

                <View style={{ flexDirection: 'row', alignItems: "flex-start", marginTop: 10 }}>
                    <AntDesign name="close" size={16} color={'#e6000a'} />
                    <ThemedText type="subText" style={{ color: '#e6000a', marginLeft: 10 }}>
                        Password Mismatch
                    </ThemedText>
                </View>

            </View>

            <TouchableOpacity style={[styles.btn, { backgroundColor: '#e6000a', borderColor: theme.border }]}>
                <ThemedText style={{ color: '#fff' }}>
                    Change Password
                </ThemedText>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    header: {
        paddingVertical: 15,
        marginBottom: 20,
        borderBottomWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 20
    },
    title: { fontSize: 18, fontWeight: "600", },
    card: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
    },
    btn: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 16,
        marginBottom: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    subText: { fontSize: 14, textAlign: "center", marginBottom: 6 },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 5 },
    input: {
        padding: 10,
        marginBottom: 10,
        borderRadius: 10,
    }

});
