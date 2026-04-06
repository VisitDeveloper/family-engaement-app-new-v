import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function DataPrivacyScreen() {
    const { t } = useTranslation();
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
                title={t("dataPrivacy.title")}
                addstyles={{ marginBottom: 20 }}
            />

            <ScrollView style={styles.containerScrollView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>

                {/* Contact */}
                <View style={styles.card}>

                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            {t("dataPrivacy.dataProtectionTitle")}
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        {t("dataPrivacy.dataProtectionIntro")}
                    </ThemedText>

                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            {t("dataPrivacy.privacyCommitmentTitle")}
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        {t("dataPrivacy.privacyCommitmentBody")}
                    </ThemedText>

                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            {t("dataPrivacy.informationCollectionTitle")}
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        {t("dataPrivacy.informationCollectionBody")}
                    </ThemedText>

                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            {t("dataPrivacy.dataUsageTitle")}
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        {t("dataPrivacy.dataUsageBody")}
                    </ThemedText>

                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            {t("dataPrivacy.userRightsTitle")}
                        </ThemedText>
                    </View>
                    <ThemedText type="subText" style={{ color: theme.text, marginBottom: 10 }}>
                        {t("dataPrivacy.userRightsBody")}
                    </ThemedText>
                </View>


            </ScrollView>
        </View>
    );
}


