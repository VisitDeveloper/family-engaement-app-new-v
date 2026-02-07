import { ThemedText } from "@/components/themed-text";
import Badge from "@/components/ui/badge";
import Divider from "@/components/ui/divider";
import { CheckboxIcon, CheckedboxIcon } from "@/components/ui/icons/common-icons";
import { SmallUsersIcon } from "@/components/ui/icons/messages-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import {
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ListRenderItem,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_SIZE = 10;

export type InviteeItem = {
  id: string;
  name: string;
  subtitle?: string;
  avatar?: string | null;
  initials?: string;
  isAdmin?: boolean;
  role?: string;
};

export type ClassroomItem = {
  id: string;
  name: string;
  avatar?: string | null;
  initials?: string;
};

type Item = InviteeItem | ClassroomItem;

type Props = {
  visible: boolean;
  onClose: () => void;
  mode: "users" | "classrooms";
  items: Item[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  title: string;
};

export default function SelectListBottomSheet({
  visible,
  onClose,
  mode,
  items,
  selectedIds,
  onToggle,
  title,
}: Props) {
  const theme = useStore((state) => state.theme);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    if (visible) setVisibleCount(PAGE_SIZE);
  }, [visible]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
  }, [items.length]);

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.bg, paddingHorizontal: 16 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      paddingTop: 8,
    },
    closeText: { fontSize: 16, color: theme.tint, fontWeight: "500" },
    rows: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    leftRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#ECECF0",
      alignItems: "center",
      justifyContent: "center",
    },
    initials: { color: "#121212", fontWeight: "400", fontSize: 12 },
    name: { fontSize: 16, fontWeight: "400", color: theme.text },
    subtitle: { fontSize: 12, color: theme.subText },
  }));

  useEffect(() => {
    if (visible) {
      setTimeout(() => bottomSheetRef.current?.present(), 100);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <View
        {...props}
        style={[props.style, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
      />
    ),
    []
  );

  const snapPoints = useMemo(() => ["70%", "90%"], []);

  const renderRow: ListRenderItem<Item> = useCallback(
    ({ item }) => (
      <View>
        <TouchableOpacity
          style={styles.rows}
          onPress={() => onToggle(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.leftRow}>
            <View style={{ position: "relative" }}>
              {mode === "classrooms" ? (
                (item as ClassroomItem).avatar ? (
                  <Image
                    source={{ uri: (item as ClassroomItem).avatar! }}
                    style={styles.avatar}
                  />
                ) : (
                  <Image
                    source={require("@/assets/images/classroom-placeholder.png")}
                    style={styles.avatar}
                  />
                )
              ) : (
                (item as InviteeItem).avatar ? (
                  <Image
                    source={{ uri: (item as InviteeItem).avatar! }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <ThemedText style={styles.initials}>
                      {(item as InviteeItem).initials || item.name.substring(0, 2).toUpperCase()}
                    </ThemedText>
                  </View>
                )
              )}
              {mode === "classrooms" && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    backgroundColor: theme.bg,
                    borderRadius: 50,
                    width: 16,
                    height: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#2B7FFF",
                      borderRadius: 50,
                      width: 12,
                      height: 12,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SmallUsersIcon color="#fff" size={8} />
                  </View>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ThemedText style={styles.name}>{item.name}</ThemedText>
                {mode === "users" && (item as InviteeItem).isAdmin && (
                  <Badge title="Admin" />
                )}
                {mode === "users" && (item as InviteeItem).role === "teacher" && (
                  <View
                    style={{
                      marginLeft: 5,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      backgroundColor: theme.panel,
                      borderRadius: 4,
                    }}
                  >
                    <ThemedText style={{ fontSize: 10, color: theme.text }}>
                      Teacher
                    </ThemedText>
                  </View>
                )}
              </View>
              {mode === "users" && (item as InviteeItem).subtitle && (
                <ThemedText style={styles.subtitle}>
                  {(item as InviteeItem).subtitle}
                </ThemedText>
              )}
            </View>
          </View>
          {selectedIds.includes(item.id) ? (
            <CheckedboxIcon size={22} color={theme.tint} />
          ) : (
            <CheckboxIcon size={22} color={theme.text} />
          )}
        </TouchableOpacity>
        <Divider horizontal marginVertical={5} />
      </View>
    ),
    [mode, onToggle, selectedIds, styles, theme]
  );

  const keyExtractor = useCallback((item: Item) => item.id, []);

  const listFooter = useMemo(
    () =>
      hasMore ? (
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          <ThemedText style={{ fontSize: 13, color: theme.subText }}>
            Scroll for more
          </ThemedText>
        </View>
      ) : null,
    [hasMore, theme.subText]
  );

  const listHeader = useMemo(
    () => (
      <View style={[styles.header, { paddingHorizontal: 0 }]}>
        <ThemedText type="middleTitle" style={{ color: theme.text, fontWeight: "600" }}>
          {title}
        </ThemedText>
        <TouchableOpacity onPress={onClose}>
          <ThemedText style={styles.closeText}>Done</ThemedText>
        </TouchableOpacity>
      </View>
    ),
    [title, onClose, styles.header, styles.closeText, theme.text]
  );

  if (!visible) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.bg }}
      handleIndicatorStyle={{ backgroundColor: theme.subText }}
    >
      <BottomSheetFlatList<Item>
        data={visibleItems}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true}
      />
    </BottomSheetModal>
  );
}
