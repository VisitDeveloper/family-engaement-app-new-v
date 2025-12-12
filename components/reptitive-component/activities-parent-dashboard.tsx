import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Text, View } from "react-native";
import { ThemedText } from "../themed-text";
import Card from "./card";

export type ActivityItem = {
    title: string;
    time: string;
    active?: boolean;
};

interface RecentActivityCardProps {
    activities: Array<ActivityItem>;
}

function RecentActivityCard({ activities }: RecentActivityCardProps) {
    const theme = useStore((s) => s.theme);

    const styles = useThemedStyles((t) => ({
        title: {
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 12,
        },
        row: {
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 12,
        },
        dot: {
            width: 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 2,
            marginTop: 6,
            marginRight: 10,
        },
        textContainer: {
            flex: 1,
        },
        itemText: {
            fontSize: 14,
            fontWeight: "500",
        },
        timeText: {
            fontSize: 12,
            marginTop: 2,
        },
    }));

    return (
        <Card >
            <Text style={[styles.title, { color: theme.text }]}>
                Recent Activity
            </Text>

            {activities.map((item, index) => (
                <View key={index} style={styles.row}>
                    {/* Dot */}
                    <View
                        style={[
                            styles.dot,
                            {
                                backgroundColor: item.active
                                    ? theme.tint
                                    : "transparent",
                                borderColor: theme.tint,
                            },
                        ]}
                    />

                    {/* Text */}
                    <View style={styles.textContainer}>
                        <ThemedText style={[styles.itemText, { color: theme.text }]}>
                            {item.title}
                        </ThemedText>
                        <ThemedText style={[styles.timeText, { color: theme.subText }]}>
                            {item.time}
                        </ThemedText>
                    </View>
                </View>
            ))}
        </Card>
    );
}
export default RecentActivityCard