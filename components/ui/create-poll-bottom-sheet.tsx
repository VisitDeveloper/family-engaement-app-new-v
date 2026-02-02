import { useThemedStyles } from "@/hooks/use-theme-style";
import { CreatePollDto, messagingService, PollResponseDto } from "@/services/messaging.service";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CreatePollBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  onPollCreated?: (poll: PollResponseDto, message: any) => void;
}

export default function CreatePollBottomSheet({
  visible,
  onClose,
  conversationId,
  onPollCreated,
}: CreatePollBottomSheetProps) {
  const theme = useStore((state) => state.theme);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const snapPoints = useMemo(() => ["80%"], []);

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: "#FFFFFF", padding: 20 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    newPollBadge: {
      backgroundColor: "rgba(215, 169, 227, 0.25)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: "flex-start",
      borderColor: "#D7A9E3",
      borderWidth: 1,
      borderStyle: "solid"
    },
    newPollBadgeText: {
      color: "#87189D",
      fontSize: 12,
      fontWeight: "400",
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
      marginBottom: 15,
    },
    optionContainer: {
      marginBottom: 12,
    },
    optionInput: {
      backgroundColor: "#F7F7F7",
      borderRadius: 12,
      padding: 14,
      borderWidth: 0,
      color: "#333333",
      fontSize: 16,
      width: "100%",
    },
    addRemoveButtonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      gap: 12,
      marginTop: 16,
    },
    addRemoveButton: {
      width: 32,
      height: 32,
      borderRadius: 22,
      backgroundColor: "#A846C3",
      alignItems: "center",
      justifyContent: "center",
    },
    addRemoveButtonText: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "300",
    },
    submitButton: {
      backgroundColor: "#A846C3",
      borderRadius: 4,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
      width: "100%",
      minHeight: 42,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "400" },
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
        setQuestion("");
        setOptions(["", ""]);
      }
    },
    [onClose]
  );

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    const trimmedQuestion = question.trim();
    const trimmedOptions = options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (!trimmedQuestion) {
      Alert.alert("Error", "Please enter a question");
      return;
    }

    if (trimmedOptions.length < 2) {
      Alert.alert("Error", "Please add at least 2 options");
      return;
    }

    try {
      setIsSubmitting(true);

      // Step 1 – Create a poll-type message
      const message = await messagingService.createMessage({
        conversationId,
        type: "poll",
      });

      // Step 2 – Create the poll for that message (use message.id from step 1)
      const pollData: CreatePollDto = {
        messageId: message.id,
        question: trimmedQuestion,
        options: trimmedOptions.map((text) => ({ text })),
      };

      const poll = await messagingService.createPoll(pollData);

      if (onPollCreated) {
        onPollCreated(poll, message);
      }

      // Reset form
      setQuestion("");
      setOptions(["", ""]);
      onClose();
    } catch (error: any) {
      console.error("Error creating poll:", error);
      Alert.alert("Error", error.message || "Failed to create poll");
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

  const canSubmit =
    question.trim().length > 0 &&
    options.filter((opt) => opt.trim().length > 0).length >= 2 &&
    !isSubmitting;

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
            <View style={styles.newPollBadge}>
              <Text style={styles.newPollBadgeText}>New Poll</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>Poll Description</Text>
          <TextInput
            style={styles.input}
            placeholder="What are your thoughts on DAP??"
            placeholderTextColor="#BBBBBB"
            value={question}
            onChangeText={setQuestion}
            multiline
            maxLength={500}
          />

          <Text style={styles.sectionLabel}>Options</Text>
          {options.map((option, index) => (
            <View key={index} style={styles.optionContainer}>
              <TextInput
                style={styles.optionInput}
                placeholder={index === 0 ? "I like it." : index === 1 ? "I don't like it." : "No opinion."}
                placeholderTextColor="#BBBBBB"
                value={option}
                onChangeText={(value) => updateOption(index, value)}
                maxLength={200}
              />
            </View>
          ))}

          <View style={styles.addRemoveButtonsContainer}>
            {options.length < 10 && (
              <TouchableOpacity style={styles.addRemoveButton} onPress={addOption}>
                <Feather name="plus" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {options.length > 2 && (
              <TouchableOpacity
                style={styles.addRemoveButton}
                onPress={() => {
                  if (options.length > 2) {
                    removeOption(options.length - 1);
                  }
                }}
              >
                <Feather name="minus" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Poll</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
