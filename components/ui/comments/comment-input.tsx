import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";

interface CommentInputProps {
  comment: string;
  setComment: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function CommentInput({
  comment,
  setComment,
  onSubmit,
  isSubmitting,
}: CommentInputProps) {
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
        inputContainer: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: t.border,
          backgroundColor: t.bg,
        },
      } as const)
  );

  return (
    <View
      style={{
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        paddingBottom: 16,
      }}
    >
      <View style={styles.inputContainer}>
        {user?.profilePicture ? (
          <Image
            source={{ uri: user?.profilePicture || "" }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
            }}
          />
        ) : (
          <Ionicons name="person-circle" size={32} color={theme.subText} />
        )}
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment..."
          placeholderTextColor={theme.subText}
          editable={!isSubmitting}
          onSubmitEditing={() => {
            // Don't submit on enter for multiline, use button instead
          }}
          blurOnSubmit={false}
          multiline
        />
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <TouchableOpacity
          onPress={onSubmit}
          disabled={!comment.trim() || isSubmitting}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor:
              comment.trim() && !isSubmitting ? theme.tint : theme.subText,
            backgroundColor: "transparent",
          }}
        >
          <ThemedText
            style={{
              color:
                comment.trim() && !isSubmitting ? theme.tint : theme.subText,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {isSubmitting ? "Sending..." : "Add Comment"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

