import { useVoiceText } from "@/hooks/use-voice-text";
import {
  Text,
  TouchableOpacity,
  type TextProps,
} from "react-native";

export type SpeakableTextProps = TextProps & {
  /** Spoken text when it differs from visible children. */
  readString?: string;
  /** Skip tap-to-speak when a parent control handles narration. */
  narrationDisabled?: boolean;
};

/** Drop-in Text that reads its content aloud when voice narration is on. */
export function SpeakableText({
  children,
  readString,
  narrationDisabled = false,
  ...rest
}: SpeakableTextProps) {
  const { voiceEnabled, speechText, onSpeak } = useVoiceText(
    children,
    readString
  );

  if (!voiceEnabled || narrationDisabled || !speechText) {
    return <Text {...rest}>{children}</Text>;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onSpeak}
      accessibilityRole="button"
      accessibilityLabel={speechText}
    >
      <Text {...rest}>{children}</Text>
    </TouchableOpacity>
  );
}
