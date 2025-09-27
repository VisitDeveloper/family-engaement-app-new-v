import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { ScrollView, View } from "react-native";

export default function DataPrivacyScreen() {
    const theme = useStore((state) => state.theme)


    const styles = useThemedStyles((theme) => ({
        container: { flex: 1, paddingHorizontal: 10, backgroundColor: theme.bg, },
        containerScrollView: { flex: 1, backgroundColor: theme.bg },
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
            backgroundColor: theme.bg,
            borderColor: theme.border
        },
        subText: { fontSize: 14, textAlign: "center", marginBottom: 6 },
        row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
        sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 5, color: theme.text },


    }))

    return (
        <View style={styles.container}>
            <HeaderInnerPage
                title="Data & Privacy Policy"
                addstyles={{ marginBottom: 20 }}
            />

            <ScrollView style={styles.containerScrollView}>

                {/* Contact */}
                <View style={styles.card}>

                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>Data Protection Policy</ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        This policy outlines how we collect, use, and
                        protect your personal information.
                    </ThemedText>


                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Privacy Commitment
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        We are dedicated to safeguarding your privacy
                        and ensuring your data is handled responsibly.
                    </ThemedText>

                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Information Collection
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        We gather personal data only when necessary,
                        and we inform you about its purpose.
                    </ThemedText>

                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Data Usage
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        Your information is used to enhance our services
                        and improve user experience.
                    </ThemedText>

                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            User Rights
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        You have the right to access, modify, or delete
                        your personal data at any time.
                    </ThemedText>
                </View>


            </ScrollView>
        </View>
    );
}


