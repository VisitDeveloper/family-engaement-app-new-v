import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import { useStore } from "@/store";
import { AntDesign, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";


const { width: screenWidth } = Dimensions.get("window");
const CONTENT_WIDTH = Math.min(420, screenWidth - 32); // responsive central column

export default function SettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const theme = useStore((state) => state.theme);
    const isHighContrast = useStore((state) => state.isHighContrast);
    const toggleHighContrast = useStore((state) => state.toggleHighContrast);


    const [pushNotifs, setPushNotifs] = useState(true);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [textMessages, setTextMessages] = useState(false);
    const [urgentAlerts, setUrgentAlerts] = useState(true);


    const isLargeFont = useStore((state) => state.isLargeFont);
    const toggleLargeFont = useStore((state) => state.toggleLargeFont);

    const voiceEnabled = useStore((state) => state.voiceNarrationEnabled);
    const toggleVoice = useStore((state) => state.toggleVoiceNarration);
    const speak = useStore((state) => state.speak);

    const [tone, setTone] = useState("Default");
    const [lang, setLang] = useState<OptionsList[]>([{
        label: 'English',
        value: 'en'
    }])


    return (
        <View style={[styles.page, { backgroundColor: theme.bg }]} >
            <View style={[styles.container, { width: CONTENT_WIDTH }]}>


                <HeaderInnerPage
                    title="Settings"
                    subTitle="Manage your app preferences and account"
                    addstyles={{ marginBottom: 20 }}
                />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Profile Card */}
                    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={styles.profileRow}>
                            <Image source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }} style={styles.avatar} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <ThemedText type="subtitle" style={{ color: theme.text }}>Maria Rodriguez</ThemedText>
                                <ThemedText type="subText" style={[styles.role, { color: theme.subText }]}>Parent - Sarah Rodriguez</ThemedText>
                                <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
                                    <View style={[styles.smallBadge, { backgroundColor: theme.panel, borderColor: theme.border }]}>
                                        <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold' }}>Math</ThemedText>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/user-profile')}>
                                <Ionicons name="chevron-forward" size={20} color={theme.subText} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Notifications Card */}
                    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={styles.cardHeader}>
                            <Feather name="bell" size={20} color={theme.text} />
                            <ThemedText type="middleTitle" style={[styles.cardTitle, { color: theme.text }]}>Notifications</ThemedText>
                        </View>

                        {/* Push */}
                        <View style={[styles.row]}>
                            <View style={{ flex: 1 }}>
                                <ThemedText type="middleTitle" style={{ color: theme.text }}>Push Notifications</ThemedText>
                                <ThemedText type="subText" style={[styles.rowSubtitle, { color: theme.subText }]}>Receive notifications on your device</ThemedText>
                            </View>
                            <Switch
                                value={pushNotifs}
                                onValueChange={setPushNotifs}
                                trackColor={{ false: "#ccc", true: '#a846c2' }}
                                thumbColor={pushNotifs ? "#fff" : "#fff"}
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <ThemedText type="middleTitle" style={{ color: theme.text }}>Email Notifications</ThemedText>
                                <ThemedText type="subText" style={[styles.rowSubtitle, { color: theme.subText }]}>Get updates via email</ThemedText>
                            </View>
                            <Switch
                                value={emailNotifs}
                                onValueChange={setEmailNotifs}
                                trackColor={{ false: "#ccc", true: '#a846c2' }}
                                thumbColor={emailNotifs ? "#fff" : "#fff"}
                            />
                        </View>

                        {/* Text Messages */}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <ThemedText type="middleTitle" style={{ color: theme.text }}>Text Messages</ThemedText>
                                <ThemedText type="subText" style={[styles.rowSubtitle, { color: theme.subText }]}>SMS alerts for important updates</ThemedText>
                            </View>
                            <Switch
                                value={textMessages}
                                onValueChange={setTextMessages}
                                trackColor={{ false: "#ccc", true: '#a846c2' }}
                                thumbColor={textMessages ? "#fff" : "#fff"}
                            />
                        </View>

                        <View style={styles.separator} />

                        {/* Urgent Alerts */}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <MaterialIcons name="error-outline" size={18} color="#e11d48" />
                                    <ThemedText type="middleTitle" style={{ color: theme.text, marginLeft: 8 }}>Urgent Alerts</ThemedText>
                                </View>
                                <ThemedText type="subText" style={[styles.rowSubtitle, { color: theme.subText }]}>Emergency broadcasts & safety alerts</ThemedText>
                            </View>
                            <Switch
                                value={urgentAlerts}
                                onValueChange={setUrgentAlerts}
                                trackColor={{ false: "#ccc", true: "#e11d48" }}
                                thumbColor={urgentAlerts ? "#fff" : "#fff"}
                            />
                        </View>

                        {/* Alert tone select (styled like a dropdown) */}
                        <View style={[styles.selectRow]}>
                            <ThemedText type="middleTitle" style={[styles.selectLabel, { color: theme.text }]}>Alert Tone</ThemedText>

                            <SelectBox
                                options={
                                    [
                                        {
                                            label: 'Tone 1',
                                            value: '1'
                                        },
                                        {
                                            label: 'Tone 2',
                                            value: '2'
                                        }
                                    ]
                                }
                                value={tone}
                                onChange={setTone}
                                title="List of Alert Tone"
                            />

                            {/* <Dropdown
                                options={["Default", "Tone 1", "Tone 2", "Tone 3"]}
                                value={tone}
                                onChange={setTone} /> */}
                        </View>

                    </View>

                    {/* Language & Accessibility Card */}
                    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={[styles.cardHeaderSmall]}>
                            <Feather name="globe" size={20} color={theme.text} />
                            <ThemedText type="middleTitle" style={[styles.cardTitle, { color: theme.text }]}>Language & Accessibility</ThemedText>
                        </View>

                        {/* App Language */}
                        <View style={[styles.selectRow]}>
                            <ThemedText type="middleTitle" style={[styles.selectLabel, { color: theme.text }]}>App Language</ThemedText>

                            <SelectBox
                                options={[
                                    { label: 'English', value: 'en' },
                                    { label: 'فارسی', value: 'fa' }
                                ]}
                                value={lang[0].value} // فقط label برای نمایش در SelectBox
                                onChange={(val) => {
                                    const selectedOption = [
                                        { label: 'English', value: 'en' },
                                        { label: 'فارسی', value: 'fa' }
                                    ].find(opt => opt.value === val);

                                    if (selectedOption) {
                                        setLang([selectedOption]); // کل گزینه رو ذخیره کن
                                    }
                                }}
                                title="List of Language"
                            />

                        </View>

                        <View style={styles.separatorSmall} />

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <ThemedText type="middleTitle" style={{ color: theme.text }} readString="Change Font Size">Large Font</ThemedText>
                                <ThemedText type="subText" style={[styles.rowSubtitle, { color: theme.subText }]} readString="Increase text size for better readability">Increase text size for better readability</ThemedText>
                            </View>
                            <Switch
                                value={isLargeFont}
                                onValueChange={toggleLargeFont}
                                trackColor={{ false: "#ccc", true: '#a846c2' }}
                                thumbColor={isLargeFont ? "#fff" : "#fff"}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <ThemedText type="middleTitle" style={{ color: theme.text }}>High Contrast Mode</ThemedText>
                                <ThemedText type="subText" style={[styles.rowSubtitle, { color: theme.subText }]}>Enhanced visibility for better reading</ThemedText>
                            </View>
                            <Switch
                                value={isHighContrast}
                                onValueChange={toggleHighContrast}
                                trackColor={{ false: "#ccc", true: '#a846c2' }}
                                thumbColor={isHighContrast ? "#fff" : "#fff"}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <ThemedText type="middleTitle" style={{ color: theme.text }}>Voice Narration</ThemedText>
                                <ThemedText type="subText" style={[styles.rowSubtitle, { color: theme.subText }]}>Read messages and content aloud</ThemedText>
                            </View>


                            <Switch
                                value={voiceEnabled}
                                onValueChange={toggleVoice}
                                trackColor={{ false: "#ccc", true: '#a846c2' }}
                                thumbColor={voiceEnabled ? "#fff" : "#fff"}
                            />
                        </View>
                    </View>


                    {/* Data Security */}
                    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={[styles.cardHeaderSmall]}>
                            <MaterialIcons name="security" size={20} color={theme.text} />
                            <ThemedText type="middleTitle" style={[styles.cardTitle, { color: theme.text }]}>Privacy & Security</ThemedText>
                        </View>

                        <View style={[styles.dataSecuritySection, { borderColor: theme.border }]}>
                            <AntDesign name="lock" size={16} color={theme.text} />
                            <ThemedText type="subText" style={[styles.dataSecurityDescription, { color: theme.text }]}>
                                his app does not intend to collect PII or
                                securing sensitive personal data. All
                                communications are for educational
                                purposes only.
                            </ThemedText>
                        </View>

                        <TouchableOpacity style={[styles.dataSecurityLink, { borderColor: theme.border, backgroundColor: theme.panel }]} >
                            {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
                            <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Family Member Permissions</ThemedText>
                            <AntDesign name="right" size={16} color={theme.text} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/data-privacy')} style={[styles.dataSecurityLink, { borderColor: theme.border, backgroundColor: theme.panel }]} >
                            {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
                            <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}> Data & Privacy Policy</ThemedText>
                            <AntDesign name="right" size={16} color={theme.text} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/blocklist')} style={[styles.dataSecurityLink, { borderColor: theme.border, backgroundColor: theme.panel }]} >
                            {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
                            <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Block/Unblock Contacts</ThemedText>
                            <AntDesign name="right" size={16} color={theme.text} />
                        </TouchableOpacity>

                    </View>


                    {/* accont manager  */}
                    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={[styles.cardHeaderSmall]}>
                            <Feather name="users" size={20} color={theme.text} />
                            <ThemedText type="middleTitle" style={[styles.cardTitle, { color: theme.text }]}>Account Management</ThemedText>
                        </View>



                        <TouchableOpacity onPress={() => speak(`Add Family Member`)} style={[styles.dataSecurityLink, { borderColor: theme.border, backgroundColor: theme.panel }]} >
                            {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
                            <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Add Family Member</ThemedText>
                            <AntDesign name="right" size={16} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dataSecurityLink, { borderColor: theme.border, backgroundColor: theme.panel }]} >
                            {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
                            <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Manage Children</ThemedText>
                            <AntDesign name="right" size={16} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dataSecurityLink, { borderColor: theme.border, backgroundColor: theme.panel }]} >
                            {/* <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Data is stored securely and encrypted</ThemedText> */}
                            <ThemedText type="subText" style={{ color: theme.text, fontWeight: 'bold', paddingHorizontal: 10, }}>Export Data</ThemedText>
                            <AntDesign name="download" size={16} color={theme.text} />
                        </TouchableOpacity>

                    </View>

                    {/* Copyright */}
                    <View style={{ height: 120, backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, padding: 10, borderRadius: 10, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <ThemedText type="middleTitle" style={[styles.cardTitle, { color: theme.text }]}>Family Connect</ThemedText>
                        <ThemedText type="subText" style={{ color: theme.subText }}>Version 2.1.0</ThemedText>
                        <View style={{ width: '80%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, marginTop: 15 }}>
                            <ThemedText type="default" style={{ color: theme.subText, fontWeight: '600' }}>Support</ThemedText>
                            <ThemedText type="default" style={{ color: theme.subText, fontWeight: '600' }}>Terms of Service </ThemedText>
                        </View>
                    </View>

                </ScrollView>


            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, padding: 10, paddingTop: 0 },
    container: {
        alignSelf: "center",
        marginBottom: 30
    },
    headerRow: {
        paddingVertical: 16,
        // paddingHorizontal:-10,
        borderBottomWidth: 1,
        marginBottom: 18,
        // borderRadius: 8,
    },
    headerLeft: {
        position: "absolute",
        left: 8,
        top: 28,
    },
    headerTitleWrap: {
        // alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        marginLeft: 50,
        paddingHorizontal: 12,
    },
    headerSubtitle: {
        marginTop: 6,
    },

    card: {
        borderRadius: 10,
        padding: 14,
        marginBottom: 18,
        borderWidth: 1,
    },

    profileRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: { width: 48, height: 48, borderRadius: 24, marginLeft: 2 },
    role: { marginTop: 4 },

    smallBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
    },
    badgeText: { fontSize: 12 },

    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    cardHeaderSmall: { flexDirection: "row", alignItems: "center", marginBottom: 12 },

    cardTitle: { marginLeft: 10 },

    row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingVertical: 10 },
    rowSubtitle: { marginTop: 6 },

    dataSecuritySection: {

        borderWidth: 1,
        borderRadius: 10,
        marginVertical: 10,
        padding: 5,
        flexDirection: 'row',
        gap: 5,
        alignItems: 'baseline',
        justifyContent: 'space-between'
    },
    dataSecurityDescription: {
        lineHeight: 15, paddingHorizontal: 5, textAlign: 'justify', marginHorizontal: 20,
    },
    dataSecurityLink: {
        paddingVertical: 10,
        borderWidth: 1,
        marginVertical: 5,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 5
    },

    separator: { height: 1, backgroundColor: "#e6e6e6", marginVertical: 12, borderRadius: 1 },
    separatorSmall: { height: 1, backgroundColor: "#e9e9e9", marginVertical: 8 },

    selectRow: { marginTop: 12, flexDirection: "column", alignItems: "flex-start", justifyContent: "center" },
    selectLabel: { marginBottom: 6 },
});
