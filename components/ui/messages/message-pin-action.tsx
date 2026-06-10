import { PinIcon } from "@/components/ui/icons/messages-icons";
import { TouchableOpacity } from "react-native";

interface MessagePinActionProps {
  onPin?: () => void;
  onUnpin?: () => void;
  color: string;
  size?: number;
}

export default function MessagePinAction({
  onPin,
  onUnpin,
  color,
  size = 12,
}: MessagePinActionProps) {
  const onPress = onUnpin ?? onPin;
  if (!onPress) return null;

  return (
    <TouchableOpacity
      style={{ padding: 2 }}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={onUnpin ? "Unpin message" : "Pin message"}
    >
      <PinIcon size={size} color={color} filled={!!onUnpin} />
    </TouchableOpacity>
  );
}
