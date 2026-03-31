import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface EditNameBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  firstName: string;
  lastName: string;
  onChangeFirstName: (value: string) => void;
  onChangeLastName: (value: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
}

export default function EditNameBottomSheet({
  visible,
  onClose,
  firstName,
  lastName,
  onChangeFirstName,
  onChangeLastName,
  onSubmit,
  canSubmit,
  isSubmitting,
}: EditNameBottomSheetProps) {
  const theme = useStore((state) => state.theme);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["45%"], []);

  const styles = useThemedStyles(() => ({
    container: { flex: 1, backgroundColor: "#FFFFFF", padding: 20 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      color: "#121212",
      fontSize: 16,
      fontWeight: "600",
    },
    label: {
      color: "#333333",
      fontSize: 14,
      marginBottom: 8,
      marginTop: 10,
    },
    input: {
      backgroundColor: "#F7F7F7",
      borderRadius: 12,
      padding: 14,
      color: "#333333",
      fontSize: 16,
      marginBottom: 6,
    },
    submitButton: {
      backgroundColor: "#A846C3",
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      minHeight: 46,
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

  useEffect(() => {
    if (!visible) return;

    const resetSheetPosition = () => {
      // Keep sheet open and only restore it to the initial snap point.
      bottomSheetRef.current?.snapToIndex(0);
    };

    const keyboardDidHideSub = Keyboard.addListener("keyboardDidHide", resetSheetPosition);
    const keyboardWillHideSub =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", resetSheetPosition)
        : null;

    return () => {
      keyboardDidHideSub.remove();
      keyboardWillHideSub?.remove();
    };
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

  if (!visible) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: theme.subText }}
      keyboardBehavior={Platform.OS === "ios" ? "interactive" : "fillParent"}
      keyboardBlurBehavior="restore"
      enableDynamicSizing={false}
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Name</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>First Name</Text>
        <BottomSheetTextInput
          style={styles.input}
          value={firstName}
          onChangeText={onChangeFirstName}
          editable={!isSubmitting}
          placeholder="First Name"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Last Name</Text>
        <BottomSheetTextInput
          style={styles.input}
          value={lastName}
          onChangeText={onChangeLastName}
          editable={!isSubmitting}
          placeholder="Last Name"
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!canSubmit || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
