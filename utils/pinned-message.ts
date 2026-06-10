import type { MessageResponseDto } from "@/types";
import { getDisplayName } from "@/utils/user-name";

export function getPinnedMessagePreview(message: MessageResponseDto): string {
  const trimmed = message.content?.trim();
  if (trimmed) {
    return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
  }

  switch (message.type) {
    case "image":
      return "Photo";
    case "video":
      return "Video";
    case "audio":
      return "Voice message";
    case "file":
      return message.fileName?.trim() || "File";
    case "poll":
      return message.polls?.[0]?.question?.trim() || "Poll";
    case "announcement":
      return "Announcement";
    default:
      return "Message";
  }
}

export function getPinnedMessageSenderLabel(
  message: MessageResponseDto
): string {
  if (!message.sender) return "";
  return getDisplayName(
    message.sender.firstName,
    message.sender.lastName,
    message.sender.email
  );
}
