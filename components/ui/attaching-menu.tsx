import { useThemedStyles } from "@/hooks/use-theme-style";
import { AnnouncementIcon, FileIcon, MediaIcon, PollIcon } from "@/components/ui/messages-icons";
import { BlurView } from "expo-blur";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AttachingMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelectPoll: () => void;
  onSelectMedia: () => void;
  onSelectFiles: () => void;
  onSelectAnnouncement?: () => void;
  /** Distance from bottom to show dropdown above input (default ~100) */
  bottomOffset?: number;
}

export default function AttachingMenu({
  visible,
  onClose,
  onSelectPoll,
  onSelectMedia,
  onSelectFiles,
  onSelectAnnouncement,
  bottomOffset = 100,
}: AttachingMenuProps) {
  const styles = useThemedStyles((t) => ({
    modalOverlay: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: bottomOffset,
      alignItems: "flex-start",
    },
    dropdownWrapper: {
      borderRadius: 16,
      overflow: "hidden",
      minWidth: 260,
      maxWidth: 320,
      // Liquid glass: soft white border + shadow glow
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.85)",
      ...Platform.select({
        ios: {
          shadowColor: "#fff",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    blurBackground: {
      borderRadius: 16,
      overflow: "hidden",
    },
    menuInner: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      backgroundColor: Platform.OS === "android" ? "rgba(220, 220, 225, 0.92)" : undefined,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginHorizontal: 4,
    },
    menuItemIcon: {
      marginRight: 14,
      width: 28,
      alignItems: "center",
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#333",
      marginBottom: 0,
    },
    menuItemSubtitle: {
      fontSize: 12,
      color: "#666",
      marginTop: 2,
    },
  }));

  const iconColor = "#444";
  const menuItems = [
    {
      id: "announcement",
      icon: <AnnouncementIcon color={iconColor} size={22} />,
      title: "Announcement",
      subtitle: undefined,
      onPress: onSelectAnnouncement || onClose,
    },
    {
      id: "poll",
      icon: <PollIcon color={iconColor} size={22} />,
      title: "Poll",
      subtitle: undefined,
      onPress: () => {
        onSelectPoll();
        onClose();
      },
    },
    {
      id: "media",
      icon: <MediaIcon color={iconColor} size={22} />,
      title: "Media",
      subtitle: "Images / Videos",
      onPress: () => {
        onSelectMedia();
        onClose();
      },
    },
    {
      id: "files",
      icon: <FileIcon color={iconColor} size={22} />,
      title: "Files",
      subtitle: undefined,
      onPress: () => {
        onSelectFiles();
        onClose();
      },
    },
  ];

  const dropdownContent = (
    <View style={styles.menuInner}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuItem}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>{item.icon}</View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.subtitle != null && (
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0, 0, 0, 0.2)" }]}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <View style={styles.dropdownWrapper} pointerEvents="box-none">
            {Platform.OS === "ios" ? (
              <BlurView intensity={80} tint="light" style={styles.blurBackground}>
                {dropdownContent}
              </BlurView>
            ) : (
              dropdownContent
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
