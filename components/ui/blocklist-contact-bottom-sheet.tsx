import { ThemedText } from "@/components/themed-text";
import Divider from "@/components/ui/divider";
import { UserAllowIcon, UserBlockIcon } from "@/components/ui/icons/settings-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { userService } from "@/services/user.service";
import { useStore } from "@/store";
import type { UserListItemDto } from "@/types";
import {
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ListRenderItem,
  TouchableOpacity,
  View,
} from "react-native";

interface BlocklistContactBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  mode: 'block' | 'allow';
  onBlock: (userId: string) => Promise<void>;
  onAllow: (userId: string) => Promise<void>;
  onUnblock: (userId: string) => Promise<void>;
  blockedUserIds: string[];
  allowedUserIds: string[];
}

export default function BlocklistContactBottomSheet({
  visible,
  onClose,
  mode,
  onBlock,
  onAllow,
  onUnblock,
  blockedUserIds,
  allowedUserIds,
}: BlocklistContactBottomSheetProps) {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const currentUser = useStore((state: any) => state.user);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [contacts, setContacts] = useState<UserListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 20;

  const loadContacts = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const currentUserRole = currentUser?.role;

        let apiParams: {
          page: number;
          limit: number;
          role?:
          | "parent"
          | "teacher"
          | "student"
          | ("parent" | "teacher" | "student")[];
        } = {
          page: pageNum,
          limit: PAGE_SIZE,
        };

        if (currentUserRole === "teacher") {
          apiParams.role = ["parent"];
        } else if (currentUserRole === "parent") {
          apiParams.role = ["teacher"];
        } else if (currentUserRole === "admin") {
          apiParams.role = ["parent", "teacher"];
        }

        const response = await userService.getAll(apiParams);

        const filteredContacts = response.users.filter((user) => {
          if (user.id === currentUser?.id) return false;
          if (user.role === "admin") return false;
          return true;
        });

        if (append) {
          setContacts((prev) => [...prev, ...filteredContacts]);
        } else {
          setContacts(filteredContacts);
        }

        setPage(pageNum);
        setHasMore(
          pageNum <
          (response.totalPages || Math.ceil(response.total / response.limit))
        );
      } catch (error: any) {
        console.error("Error loading contacts:", error);
        if (!append) {
          Alert.alert("Error", error.message || "Failed to load contacts");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    if (visible) {
      setTimeout(() => bottomSheetRef.current?.present(), 100);
      loadContacts(1, false);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, loadContacts]);

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

  const styles = useThemedStyles((t) => ({
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
      paddingVertical: 12,
    },
    leftRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: t.border,
      alignItems: "center",
      justifyContent: "center",
    },
    initials: { color: t.subText, fontWeight: "600", fontSize: 16 },
    name: { fontSize: 16, fontWeight: "500", color: theme.text },
    actionButton: {
      padding: 8,
    },
    iconButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    iconOverlay: {
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
  }));

  const handleBlock = useCallback(async (userId: string) => {
    if (processingIds.has(userId)) return;
    setProcessingIds((prev) => new Set(prev).add(userId));
    try {
      await onBlock(userId);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [onBlock, processingIds]);

  const handleAllow = useCallback(async (userId: string) => {
    if (processingIds.has(userId)) return;
    setProcessingIds((prev) => new Set(prev).add(userId));
    try {
      await onAllow(userId);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [onAllow, processingIds]);

  const handleUnblock = useCallback(async (userId: string) => {
    if (processingIds.has(userId)) return;
    setProcessingIds((prev) => new Set(prev).add(userId));
    try {
      await onUnblock(userId);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [onUnblock, processingIds]);

  const renderRow: ListRenderItem<UserListItemDto> = useCallback(
    ({ item }) => {
      const displayName =
        item.firstName && item.lastName
          ? `${item.firstName} ${item.lastName}`
          : item.firstName || item.lastName || item.email;

      const initials = `${item.firstName?.[0] || ""}${item.lastName?.[0] || ""}`.toUpperCase();

      const isBlocked = blockedUserIds.includes(item.id);
      const isAllowed = allowedUserIds.includes(item.id);
      const isProcessing = processingIds.has(item.id);

      return (
        <View>
          <View style={styles.rows}>
            <View style={styles.leftRow}>
              {item.profilePicture ? (
                <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.initials}>
                    {initials || "?"}
                  </ThemedText>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.name}>{displayName}</ThemedText>
              </View>
            </View>
            {isProcessing ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : isBlocked ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleUnblock(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconButton]}>
                  <UserAllowIcon size={16} color="#467A39" />
                </View>
              </TouchableOpacity>
            ) : isAllowed ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleBlock(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconButton]}>
                  <UserBlockIcon size={16} color="#E7000B" />
                </View>
              </TouchableOpacity>
            ) : mode === 'allow' ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAllow(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconButton]}>
                  <UserAllowIcon size={16} color="#467A39" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleBlock(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconButton]}>
                  <UserBlockIcon size={16} color="#E7000B" />
                </View>
              </TouchableOpacity>
            )}
          </View>
          <Divider horizontal marginVertical={5} />
        </View>
      );
    },
    [
      blockedUserIds,
      allowedUserIds,
      processingIds,
      styles,
      theme.tint,
      mode,
      handleBlock,
      handleAllow,
      handleUnblock,
    ]
  );

  const keyExtractor = useCallback((item: UserListItemDto) => item.id, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadContacts(page + 1, true);
    }
  }, [loadingMore, hasMore, loading, page, loadContacts]);

  const listFooter = useMemo(
    () =>
      loadingMore ? (
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          <ActivityIndicator size="small" color={theme.tint} />
        </View>
      ) : hasMore ? (
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          <ThemedText style={{ fontSize: 13, color: theme.subText }}>
            {t("blocklist.scrollForMore")}
          </ThemedText>
        </View>
      ) : null,
    [loadingMore, hasMore, theme.tint, theme.subText, t]
  );

  const listHeader = useMemo(
    () => (
      <View style={[styles.header, { paddingHorizontal: 0 }]}>
        <ThemedText type="middleTitle" style={{ color: theme.text, fontWeight: "600" }}>
          {mode === 'allow' ? t("blocklist.selectContactToAllow") : t("blocklist.selectContact")}
        </ThemedText>
        <TouchableOpacity onPress={onClose}>
          <ThemedText style={styles.closeText}>{t("common.done")}</ThemedText>
        </TouchableOpacity>
      </View>
    ),
    [onClose, styles.header, styles.closeText, theme.text, t, mode]
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
      {loading && contacts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <BottomSheetFlatList<UserListItemDto>
          data={contacts}
          keyExtractor={keyExtractor}
          renderItem={renderRow}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: "center" }}>
              <ThemedText style={{ color: theme.subText }}>
                {t("blocklist.noContactsFound")}
              </ThemedText>
            </View>
          }
        />
      )}
    </BottomSheetModal>
  );
}
