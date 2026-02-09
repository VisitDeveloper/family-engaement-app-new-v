import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import BlocklistContactBottomSheet from "@/components/ui/blocklist-contact-bottom-sheet";
import { UserAllowIcon, UserBlockIcon } from "@/components/ui/icons/settings-icons";
import { useBlocklist } from "@/hooks/use-blocklist";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import type { UserListItemDto } from "@/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function BlocklistScreen() {
    const { t } = useTranslation();
    const theme = useStore((state) => state.theme);
    const [showBlockSheet, setShowBlockSheet] = useState(false);
    const [showAllowSheet, setShowAllowSheet] = useState(false);
    const {
        blockedUsers,
        allowedUsers,
        loading,
        error,
        refreshLists,
        blockUser,
        unblockUser,
        allowUser,
        removeFromAllowList,
    } = useBlocklist();

    const styles = useThemedStyles((t) => ({
        container: {
            flex: 1,
            backgroundColor: t.bg
        },
        sectionTitle: {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            fontWeight: "600",
            color: t.text
        },
        sectionHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
        },
        sectionTitleText: {
            fontWeight: "600",
            color: t.text
        },
        contactItem: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
        },
        contactLeft: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            marginRight: 12,
        },
        avatarPlaceholder: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: t.panel,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },
        avatarText: {
            fontSize: 18,
            fontWeight: "600",
            color: t.text,
        },
        contactInfo: {
            flex: 1,
        },
        contactName: {
            fontSize: 16,
            fontWeight: "500",
            color: t.text,
            marginBottom: 4,
        },
        blockedBadge: {
            backgroundColor: "#FFEDD4",
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            alignSelf: "flex-start",
        },
        blockedBadgeText: {
            color: "#9F2D00",
            fontSize: 12,
            fontWeight: "400",
        },
        actionButton: {
            padding: 8,
        },
        iconButton: {
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
        },
        centerContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        },
        errorText: {
            color: "#F44336",
            fontSize: 16,
            paddingHorizontal: 16,
        },
        emptyText: {
            color: t.subText,
            fontSize: 14,
            paddingHorizontal: 16,
            fontStyle: "italic",
            paddingTop: 8,
        },
    }) as const);

    const renderAvatar = (user: UserListItemDto) => {
        if (user.profilePicture) {
            return (
                <Image
                    source={{ uri: user.profilePicture }}
                    style={styles.avatar}
                />
            );
        }

        // Fallback to initials
        const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
        return (
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initials || '?'}</Text>
            </View>
        );
    };

    const renderContactItem = (
        user: UserListItemDto,
        type: 'blocked' | 'allowed',
        onAction: () => void
    ) => {
        const displayName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.lastName || user.email;

        return (
            <View style={styles.contactItem}>
                <View style={styles.contactLeft}>
                    {renderAvatar(user)}
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{displayName}</Text>
                        {type === 'blocked' && (
                            <View style={styles.blockedBadge}>
                                <Text style={styles.blockedBadgeText}>{t("blocklist.blocked")}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onAction}
                    activeOpacity={0.7}
                >
                    {type === 'blocked' ? (
                        // Green person icon with checkmark overlay (unblock)
                        <View style={[styles.iconButton]}>
                            <UserAllowIcon size={16} color="#467A39" />
                        </View>
                    ) : (
                        // Red person icon with minus overlay (block)
                        <View style={[styles.iconButton]}>
                            <UserBlockIcon size={16} color="#E7000B" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    if (loading && blockedUsers.length === 0 && allowedUsers.length === 0) {
        return (
            <View style={styles.container}>
                <HeaderInnerPage
                    title={t("blocklist.title")}
                    addstyles={{ marginBottom: 20 }}
                />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.text} />
                </View>
            </View>
        );
    }

    if (error && blockedUsers.length === 0 && allowedUsers.length === 0) {
        return (
            <View style={styles.container}>
                <HeaderInnerPage
                    title={t("blocklist.title")}
                    addstyles={{ marginBottom: 20 }}
                />
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        onPress={refreshLists}
                        style={{ marginTop: 16, padding: 12, backgroundColor: theme.text, borderRadius: 8 }}
                    >
                        <Text style={{ color: theme.bg }}>{t("buttons.retry")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleBlockFromSheet = async (userId: string) => {
        await blockUser(userId);
        await refreshLists();
    };

    const handleUnblockFromSheet = async (userId: string) => {
        await unblockUser(userId);
        await refreshLists();
    };

    const handleAllowFromSheet = async (userId: string) => {
        await allowUser(userId);
        await refreshLists();
    };

    const blockedUserIds = blockedUsers.map((u) => u.id);
    const allowedUserIds = allowedUsers.map((u) => u.id);

    return (
        <View style={styles.container}>
            <HeaderInnerPage
                title={t("blocklist.title")}
                addstyles={{ marginBottom: 20 }}
            />

            <ScrollView
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refreshLists}
                    />
                }
            >
                {/* Blocked Contacts Section */}
                <View>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="middleTitle" style={styles.sectionTitleText}>
                            {t("blocklist.blockedContacts")}
                        </ThemedText>
                        <TouchableOpacity
                            onPress={() => setShowBlockSheet(true)}
                            style={{
                                padding: 8,
                            }}
                        >
                            <UserBlockIcon size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    {blockedUsers.length === 0 ? (
                        <Text style={styles.emptyText}>{t("blocklist.noBlockedContacts")}</Text>
                    ) : (
                        blockedUsers.map((user) =>
                            renderContactItem(user, 'blocked', () => unblockUser(user.id))
                        )
                    )}
                </View>

                {/* Allowed Contacts Section */}
                <View>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="middleTitle" style={styles.sectionTitleText}>
                            {t("blocklist.allowedContacts")}
                        </ThemedText>
                        <TouchableOpacity
                            onPress={() => setShowAllowSheet(true)}
                            style={{
                                padding: 8,
                            }}
                        >
                            <UserAllowIcon size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    {allowedUsers.length === 0 ? (
                        <Text style={styles.emptyText}>{t("blocklist.noAllowedContacts")}</Text>
                    ) : (
                        allowedUsers.map((user) =>
                            renderContactItem(user, 'allowed', () => removeFromAllowList(user.id))
                        )
                    )}
                </View>
            </ScrollView>

            <BlocklistContactBottomSheet
                visible={showBlockSheet}
                mode="block"
                onClose={() => setShowBlockSheet(false)}
                onBlock={handleBlockFromSheet}
                onAllow={handleAllowFromSheet}
                onUnblock={handleUnblockFromSheet}
                blockedUserIds={blockedUserIds}
                allowedUserIds={allowedUserIds}
            />

            <BlocklistContactBottomSheet
                visible={showAllowSheet}
                mode="allow"
                onClose={() => setShowAllowSheet(false)}
                onBlock={handleBlockFromSheet}
                onAllow={handleAllowFromSheet}
                onUnblock={handleUnblockFromSheet}
                blockedUserIds={blockedUserIds}
                allowedUserIds={allowedUserIds}
            />
        </View>
    );
}
