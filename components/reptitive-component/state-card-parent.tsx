import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

interface StatCardProps {
    label: string;
    labelIcon?: React.ReactNode | React.ReactElement;
    value: string;
    sub: string;
    positive?: boolean;
    negative?: boolean;
    rate?: number | string;
    icon?: React.ReactNode | React.ReactElement;

}

function StatCardParent({ label, value, sub, positive, negative, rate, icon, labelIcon }: StatCardProps) {
    const { theme } = useStore(state => state);

    const styles = useThemedStyles((t) => ({
        card: {
            flex: 1,
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            borderWidth: 1,
            backgroundColor: t.bg,
            borderColor: t.border,
        },
        cardTitle: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
        },
        statValue: {
            fontWeight: "700",
            color: t.iconDash
        },
        statLabel: {
            marginBottom: 10,
            color: t.text
        },
        statSubText: {
            color: positive ? "green" : negative ? "red" : t.subText,
            marginTop: 4,
        },
        progressBar: {
            height: 6,
            borderRadius: 6,
            overflow: "hidden",
            marginVertical: 5,
        },
        progressFill: {
            height: 6,
            borderRadius: 6,
        },
    }))

    return (

        <View style={styles.card}>
            <View style={styles.cardTitle}>
                <ThemedText type="subtitle" style={styles.statValue}>
                    {value}
                </ThemedText>
                {icon}
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 10, marginBottom: 4 }}>
                <ThemedText style={styles.statLabel}>{label}</ThemedText>
                <View>
                    {labelIcon}
                </View>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${Number(rate)}%`, backgroundColor: theme.tint }]} />
            </View>
            <ThemedText type="subText">
                {sub}
            </ThemedText>
        </View >
    );
}
export default StatCardParent;