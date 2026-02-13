import { useThemedStyles } from "@/hooks/use-theme-style";
import { messagingService, MessageResponseDto } from "@/services/messaging.service";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CreateAnnouncementBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  onAnnouncementCreated?: (message: MessageResponseDto) => void;
}

export default function CreateAnnouncementBottomSheet({
  visible,
  onClose,
  conversationId,
  onAnnouncementCreated,
}: CreateAnnouncementBottomSheetProps) {
  const theme = useStore((state) => state.theme);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const snapPoints = useMemo(() => ["60%"], []);

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: "#FFFFFF", padding: 20 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    announcementBadge: {
      backgroundColor: "rgba(33, 150, 243, 0.15)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
      borderColor: "rgba(33, 150, 243, 0.3)",
      borderWidth: 1,
      borderStyle: "solid"
    },
    announcementBadgeText: {
      color: "#1976D2",
      fontSize: 12,
      fontWeight: "600",
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "400",
      color: "#333333",
      marginBottom: 8,
      marginTop: 16,
    },
    sectionLabelFirst: {
      marginTop: 0,
    },
    input: {
      backgroundColor: "#F7F7F7",
      borderRadius: 12,
      padding: 14,
      borderWidth: 0,
      color: "#333333",
      fontSize: 16,
      minHeight: 120,
      textAlignVertical: "top",
    },
    submitButton: {
      backgroundColor: "#1976D2",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
      width: "100%",
      minHeight: 48,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  }));

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 100);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
        // Reset form when closing
        setContent("");
      }
    },
    [onClose]
  );

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      Alert.alert("Error", "Please enter announcement content");
      return;
    }

    try {
      setIsSubmitting(true);

      const message = await messagingService.createMessage({
        conversationId,
        type: "announcement",
        content: trimmedContent,
      });

      if (onAnnouncementCreated) {
        onAnnouncementCreated(message);
      }

      // Reset form
      setContent("");
      onClose();
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      Alert.alert("Error", error.message || "Failed to create announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <View
        {...props}
        style={[
          props.style,
          {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        ]}
      />
    ),
    []
  );

  if (!visible) {
    return null;
  }

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: "#FFFFFF",
      }}
      handleIndicatorStyle={{ backgroundColor: theme.subText }}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <View style={styles.announcementBadge}>
              <Text style={styles.announcementBadgeText}>New Announcement</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>Announcement Content</Text>
          <TextInput
            style={styles.input}
            placeholder="We are excited to invite you all for an informative session on parenting tips and resources. See the video below for more details!"
            placeholderTextColor="#BBBBBB"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Send Announcement</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
