import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";

interface ReplyInputProps {
  replyText: string;
  setReplyText: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReplyInput({
  replyText,
  setReplyText,
  onSubmit,
  isSubmitting,
}: ReplyInputProps) {
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);

  const styles = useThemedStyles(
    (t) =>
      ({
        commentInput: {
          flex: 1,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          color: t.text,
          backgroundColor: t.panel,
        },
        replyInputContainer: {
          marginLeft: 32,
          marginTop: 8,
          padding: 8,
          paddingRight: 16,
          borderRadius: 8,
        },
      } as const)
  );

  return (
    <View style={{ ...styles.replyInputContainer, paddingLeft: 0 }}>
      <View
        style={{
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          {user?.profilePicture ? (
            <Image
              source={{ uri: user?.profilePicture || "" }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
              }}
            />
          ) : (
            <Ionicons
              name="person-circle"
              size={24}
              color={theme.subText}
            />
          )}
          <TextInput
            style={[
              styles.commentInput,
              { height: 36, fontSize: 13, flex: 1 },
            ]}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Add a reply..."
            placeholderTextColor={theme.subText}
            editable={!isSubmitting}
            onSubmitEditing={onSubmit}
          />
        </View>

        <TouchableOpacity
          onPress={onSubmit}
          disabled={!replyText.trim() || isSubmitting}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor:
              replyText.trim() && !isSubmitting ? theme.tint : theme.subText,
            backgroundColor: "transparent",
          }}
        >
          <ThemedText
            style={{
              color:
                replyText.trim() && !isSubmitting ? theme.tint : theme.subText,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {isSubmitting ? "Sending..." : "Add Reply"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

