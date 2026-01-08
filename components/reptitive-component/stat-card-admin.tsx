import { useThemedStyles } from "@/hooks/use-theme-style";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

interface StatCardProps {
    label: string;
    value: string;
    sub: string;
    positive?: boolean;
    negative?: boolean;
    rate?: number | string;
    icon?: React.ReactNode | React.ReactElement;
}

function StatCard({ label, value, sub, positive, negative, rate, icon }: StatCardProps) {

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
            color: t.subText,
            marginBottom: 10
        },
        statSubText: {
            color: positive ? "green" : negative ? "red" : t.subText,
            marginTop: 4,
        }
    }))

    return (

        <View style={styles.card}>
            <View style={styles.cardTitle}>
                <ThemedText type="subtitle" style={styles.statValue}>
                    {value}
                </ThemedText>
                {icon}
            </View>
            <ThemedText type="text" style={styles.statLabel}>{label}</ThemedText>
            <ThemedText type="subText" style={styles.statSubText}>
                {sub}
            </ThemedText>
        </View >
    );
}
export default StatCard;