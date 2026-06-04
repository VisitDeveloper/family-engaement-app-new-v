import type { MessageResponseDto, ClientMessageUpload } from "@/types";

export type PendingMediaType = "image" | "video" | "audio" | "file";

export type PendingUploadPayload = ClientMessageUpload["retryPayload"];

export function isPendingMessageId(messageId: string): boolean {
  return messageId.startsWith("pending-");
}

export function createPendingOutgoingMessage(params: {
  conversationId: string;
  senderId: string;
  sender?: MessageResponseDto["sender"];
  type: PendingMediaType;
  localUri: string;
  fileName?: string;
  mimeType?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  retryPayload: PendingUploadPayload;
}): MessageResponseDto {
  const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();

  return {
    id,
    conversationId: params.conversationId,
    senderId: params.senderId,
    sender: params.sender ?? null,
    type: params.type,
    mediaUrl: params.localUri,
    fileName: params.fileName ?? null,
    mimeType: params.mimeType ?? null,
    duration:
      params.durationSeconds != null ? String(params.durationSeconds) : null,
    thumbnailUrl: params.thumbnailUrl ?? null,
    isEdited: false,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    clientUpload: {
      status: "uploading",
      progress: 0,
      localUri: params.localUri,
      retryPayload: params.retryPayload,
    },
  };
}
