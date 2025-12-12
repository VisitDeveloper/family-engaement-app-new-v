import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { AntDesign, Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";

export default function ChangePassword() {
    const theme = useStore((state) => state.theme)

    const [oldPassClosed, setOldPassClosed] = useState(true);
    const [NewPassClosed, setNewPassClosed] = useState(true);
    const [RetypeNewClosed, setRetypeNewClosed] = useState(true);

    const styles = useThemedStyles((theme) => ({
        container: { flex: 1, padding: 10, backgroundColor: theme.bg },
        containerScrollView: { flex: 1, backgroundColor: theme.bg },
        card: {
            borderWidth: 1,
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            backgroundColor: theme.bg,
            borderColor: theme.border
        },
        inputSection: {
            flexDirection: 'column',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            paddingBottom: 10,
            marginBottom: 10
        },
        label: {
            color: theme.text,
            fontSize: 16,
            fontWeight: '600',
            marginVertical: 10
        },
        btn: {
            borderWidth: 1,
            borderRadius: 10,
            padding: 16,
            marginBottom: 60,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.emergencyColor, borderColor: theme.border
        },
        subText: { fontSize: 14, textAlign: "center", marginBottom: 6 },
        row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
        sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 5 },
        input: {
            padding: 10,
            marginBottom: 10,
            borderRadius: 10,
            color: theme.text,
            backgroundColor: theme.panel,
        },
        eyeCatch: {
            position: "absolute", right: 10, top: 10
        },
        desc: {
            flexDirection: 'row', alignItems: "flex-start", marginTop: 10
        }
    }));



    return (
        <View style={styles.container}>
            <HeaderInnerPage
                title="Change Password"
                addstyles={{ marginBottom: 10 }}
            />

            <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} style={styles.containerScrollView}>

                {/* Contact */}
                <View style={styles.card}>

                    <View style={styles.row}>
                        <Ionicons name="key-outline" size={24} color={theme.text} />
                        <ThemedText type="subtitle" style={{ color: theme.text, marginLeft: 18 }}>Manage Password</ThemedText>
                    </View>

                    <View style={styles.inputSection}>
                        <ThemedText style={styles.label}>
                            Old Password
                        </ThemedText>
                        <View style={{ position: "relative" }}>
                            <TextInput placeholder="Old Password" secureTextEntry={oldPassClosed} style={styles.input} />
                            {
                                oldPassClosed ?
                                    <TouchableOpacity onPress={() => setOldPassClosed(false)} style={styles.eyeCatch}>
                                        <Octicons name="eye-closed" size={20} color={theme.text} />
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity onPress={() => setOldPassClosed(true)} style={styles.eyeCatch}>
                                        <Octicons name="eye" size={20} color={theme.text} />
                                    </TouchableOpacity>
                            }
                        </View>
                    </View>

                    <View style={styles.inputSection}>
                        <ThemedText style={styles.label}>
                            New Password
                        </ThemedText>
                        <View style={{ position: "relative" }}>
                            <TextInput placeholder="Old Password" secureTextEntry={NewPassClosed} style={styles.input} />
                            {
                                NewPassClosed ?
                                    <TouchableOpacity onPress={() => setNewPassClosed(false)} style={styles.eyeCatch}>
                                        <Octicons name="eye-closed" size={20} color={theme.text} />
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity onPress={() => setNewPassClosed(true)} style={styles.eyeCatch}>
                                        <Octicons name="eye" size={20} color={theme.text} />
                                    </TouchableOpacity>
                            }
                        </View>
                    </View>


                    <View style={styles.inputSection}>
                        <ThemedText style={styles.label}>
                            Retype New Password
                        </ThemedText>
                        <View style={{ position: "relative" }}>
                            <TextInput placeholder="Old Password" secureTextEntry={RetypeNewClosed} style={styles.input} />
                            {
                                RetypeNewClosed ?
                                    <TouchableOpacity onPress={() => setRetypeNewClosed(false)} style={styles.eyeCatch}>
                                        <Octicons name="eye-closed" size={20} color={theme.text} />
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity onPress={() => setRetypeNewClosed(true)} style={styles.eyeCatch}>
                                        <Octicons name="eye" size={20} color={theme.text} />
                                    </TouchableOpacity>
                            }
                        </View>
                    </View>

                    <View style={styles.desc}>
                        <MaterialCommunityIcons name="check" size={16} color={theme.passDesc} />
                        <ThemedText type="subText" style={{ color: theme.passDesc, marginLeft: 10 }}>
                            Must be at least 8 characters.
                        </ThemedText>
                    </View>
                    <View style={styles.desc}>
                        <MaterialCommunityIcons name="check" size={16} color={theme.passDesc} />
                        <ThemedText type="subText" style={{ color: theme.passDesc, marginLeft: 10 }}>
                            Must include a mix of uppercase and
                            lowercase letters, numbers, and special
                            characters.
                        </ThemedText>
                    </View>
                    <View style={styles.desc}>
                        <MaterialCommunityIcons name="check" size={16} color={theme.passDesc} />
                        <ThemedText type="subText" style={{ color: theme.passDesc, marginLeft: 10 }}>
                            Must not include your name, birthday, or any
                            other readily available information.
                        </ThemedText>
                    </View>

                    <View style={styles.desc}>
                        <AntDesign name="close" size={16} color={theme.emergencyColor} />
                        <ThemedText type="subText" style={{ color: theme.emergencyColor, marginLeft: 10 }}>
                            Password Mismatch
                        </ThemedText>
                    </View>

                </View>

                <TouchableOpacity style={styles.btn}>
                    <ThemedText style={{ color: '#fff' }}>
                        Change Password
                    </ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}


