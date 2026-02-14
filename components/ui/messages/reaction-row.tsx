import type { MessageReactionItemDto } from "@/types";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { Text, View } from "react-native";

interface ReactionRowProps {
  reactions: MessageReactionItemDto[];
  myReaction?: string | null;
}

export default function ReactionRow({ reactions, myReaction }: ReactionRowProps) {
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    bubble: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: "rgba(128,128,128,0.2)",
      gap: 4,
    },
    bubbleHighlight: {
      backgroundColor: "rgba(128,128,128,0.5)",
    },
    emoji: { fontSize: 14 },
    count: { fontSize: 12, color: t.subText },
  }));

  if (!reactions?.length) return null;

  return (
    <View style={styles.row}>
      {reactions.map((r, i) => (
        <View
          key={`${r.emoji}-${i}`}
          style={[
            styles.bubble,
            myReaction === r.emoji && styles.bubbleHighlight,
          ]}
        >
          <Text style={styles.emoji}>{r.emoji}</Text>
          {r.count > 1 && <Text style={styles.count}>{r.count}</Text>}
        </View>
      ))}
    </View>
  );
}
