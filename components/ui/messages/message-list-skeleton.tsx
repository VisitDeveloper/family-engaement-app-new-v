import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { useStore } from "@/store";
import { StyleSheet, View } from "react-native";

type BubbleSide = "left" | "right";

function MessageBubbleSkeleton({ side }: { side: BubbleSide }) {
  const isMine = side === "right";
  return (
    <View
      style={[
        styles.bubbleRow,
        isMine ? styles.bubbleRowRight : styles.bubbleRowLeft,
      ]}
    >
      <SkeletonBlock
        style={[
          styles.bubble,
          isMine ? styles.bubbleWideRight : styles.bubbleWideLeft,
        ]}
      />
    </View>
  );
}

const PATTERN: BubbleSide[] = ["right", "left", "right", "left", "right", "left"];

export function MessageListSkeleton() {
  const theme = useStore((s) => s.theme);
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {PATTERN.map((side, i) => (
        <MessageBubbleSkeleton key={i} side={side} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    paddingBottom: 20,
    justifyContent: "flex-end",
  },
  bubbleRow: { marginVertical: 6, maxWidth: "80%" },
  bubbleRowLeft: { alignSelf: "flex-start" },
  bubbleRowRight: { alignSelf: "flex-end" },
  bubble: {
    minHeight: 44,
    borderRadius: 12,
  },
  bubbleWideLeft: { width: "68%" },
  bubbleWideRight: { width: "55%" },
});
