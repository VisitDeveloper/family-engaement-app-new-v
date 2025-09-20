import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { useStore } from "@/store";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
    const theme = useStore((state) => state.theme)
    const router = useRouter();


    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>


            <HeaderInnerPage
                title="Profile & Account Settings"
                addstyles={{ marginBottom: 20 }}
            />

            {/* User Info */}
            <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Image source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }} style={styles.avatar} />
                <TouchableOpacity style={styles.cameraIcon}>
                    <Feather name="camera" size={18} color="#fff" />
                </TouchableOpacity>
                <ThemedText type="subtitle" style={[styles.name, { color: theme.text }]}>Maria Rodriguez</ThemedText>
                <ThemedText type="subText" style={[styles.subText, { color: theme.subText }]}>Parent - Sarah Rodriguez</ThemedText>
                <View style={[styles.badge, { backgroundColor: theme.panel, borderColor: theme.border, borderWidth: 1 }]}>
                    <ThemedText type="subText" style={{ color: theme.text }}>Math</ThemedText>
                </View>
            </View>

            {/* Contact */}
            <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={styles.row}>
                    <Feather name="phone" size={18} color={theme.text} />
                    <ThemedText type="middleTitle" style={[styles.sectionTitle, { color: theme.text }]}>Contact</ThemedText>
                </View>
                <ThemedText type="subText" style={[styles.label, { color: theme.subText }]}>Email</ThemedText>
                <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.panel }]}
                    value="mrodriguez@gmail.com"
                    editable={true}
                />
                <ThemedText type="subText" style={[styles.label, { color: theme.subText }]}>Phone</ThemedText>
                <View style={[styles.input, { flexDirection: "row", alignItems: "center", borderColor: theme.border, backgroundColor: theme.panel }]}>
                    <ThemedText style={{ color: theme.text, marginRight: 8 }}>+1</ThemedText>
                    <ThemedText style={{ color: theme.text }}>(555) 123-4567</ThemedText>
                </View>
            </View>

            {/* Manage Password */}
            <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={styles.row}>
                    <MaterialIcons name="lock-outline" size={20} color={theme.text} />
                    <ThemedText type="middleTitle" style={[styles.sectionTitle, { color: theme.text }]}>Manage Passwords</ThemedText>
                </View>
                <TouchableOpacity onPress={() => router.push('/change-password')} style={[styles.changeBtn, { borderColor: theme.border }]}>
                    <ThemedText type="middleTitle" style={{ color: theme.text, fontWeight: "500" }}>Change Password</ThemedText>
                    <Feather name="chevron-right" size={18} color={theme.text} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    header: {
        paddingVertical: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 20
    },
    card: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
    },
    avatar: { width: 90, height: 90, borderRadius: 45, alignSelf: "center" },
    cameraIcon: {
        position: "absolute",
        right: "38%",
        top: 65,
        backgroundColor: "#6200EE",
        padding: 6,
        borderRadius: 20,
    },
    name: { textAlign: "center", marginTop: 8 },
    subText: { textAlign: "center", marginBottom: 6 },
    badge: {
        alignSelf: "center",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 6,
    },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    sectionTitle: { marginLeft: 6 },
    // fontSize: 14,
    label: { marginTop: 8, marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        fontSize: 14,
    },
    changeBtn: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 10,
    },
});
