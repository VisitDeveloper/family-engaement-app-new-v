import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { useStore } from "@/store";
import { StyleSheet, View } from "react-native";

const ROW_COUNT = 8;

function ConversationRowSkeleton() {
  const theme = useStore((s) => s.theme);
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: theme.border },
      ]}
    >
      <SkeletonBlock style={styles.avatar} />
      <View style={styles.body}>
        <View style={styles.headerLine}>
          <SkeletonBlock style={styles.nameLine} />
          <SkeletonBlock style={styles.timeLine} />
        </View>
        <SkeletonBlock style={styles.previewLine} />
      </View>
    </View>
  );
}

export function ConversationListSkeleton() {
  return (
    <View style={styles.list}>
      {Array.from({ length: ROW_COUNT }, (_, i) => (
        <ConversationRowSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  body: { flex: 1, marginLeft: 10 },
  headerLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  nameLine: { flex: 1, height: 14, borderRadius: 6, marginRight: 12 },
  timeLine: { width: 48, height: 12, borderRadius: 6 },
  previewLine: { height: 12, borderRadius: 6, width: "72%" },
});
