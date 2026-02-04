import { useThemedStyles } from "@/hooks/use-theme-style";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MessageActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  /** Position from top of screen */
  top: number;
  /** Position from left/right of screen */
  left?: number;
  right?: number;
  /** Whether message is from current user (affects alignment) */
  isMe?: boolean;
}

export default function MessageActionsMenu({
  visible,
  onClose,
  onEdit,
  onDelete,
  top,
  left,
  right,
  isMe = false,
}: MessageActionsMenuProps) {
  const styles = useThemedStyles((t) => ({
    modalOverlay: {
      position: "absolute",
      top: top - 10, // Offset above message
      ...(isMe && right !== undefined
        ? { right: right }
        : left !== undefined
        ? { left: left }
        : { left: 16 }),
      alignItems: isMe ? "flex-end" : "flex-start",
    },
    dropdownWrapper: {
      borderRadius: 16,
      overflow: "hidden",
      minWidth: 180,
      maxWidth: 240,
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
    },
    deleteItem: {
      // Red tint for delete
    },
    deleteText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FF3B30",
    },
  }));

  const iconColor = "#444";
  const deleteIconColor = "#FF3B30";

  const menuItems = [
    ...(onEdit
      ? [
          {
            id: "edit",
            icon: <Ionicons name="create-outline" size={22} color={iconColor} />,
            title: "Edit",
            onPress: () => {
              onEdit();
              onClose();
            },
            isDelete: false,
          },
        ]
      : []),
    {
      id: "delete",
      icon: <Ionicons name="trash-outline" size={22} color={deleteIconColor} />,
      title: "Delete",
      onPress: () => {
        onDelete();
        onClose();
      },
      isDelete: true,
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
            <Text style={item.isDelete ? styles.deleteText : styles.menuItemTitle}>
              {item.title}
            </Text>
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
