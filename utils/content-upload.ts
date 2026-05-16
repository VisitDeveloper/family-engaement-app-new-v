import type { ResourceType } from "@/types";
import { messagingService } from "@/services/messaging.service";
import * as FileSystem from "expo-file-system/legacy";

export async function ensureUploadableFileUri(inputUri: string): Promise<string> {
  const uri = inputUri.trim();
  if (!uri) return inputUri;

  if (uri.startsWith("file://")) {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) return uri;
    } catch {
      // fallthrough
    }
  }

  const baseDir = (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "") as string;
  const uploadsDir = `${baseDir}uploads`;
  const extMatch = /\.([a-z0-9]+)(?:\?.*)?$/i.exec(uri);
  const ext = extMatch?.[1] ? `.${extMatch[1]}` : "";
  const dest = `${uploadsDir}/${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;

  try {
    if (baseDir) {
      await FileSystem.makeDirectoryAsync(uploadsDir, { intermediates: true }).catch(() => { });
    }
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    if (/^https?:\/\//i.test(uri)) {
      await FileSystem.makeDirectoryAsync(uploadsDir, { intermediates: true }).catch(() => { });
      const result = await FileSystem.downloadAsync(uri, dest);
      return result.uri;
    }
    return inputUri;
  }
}

export type SelectedUploadFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

function inferVideoMimeType(fileName: string, declared?: string): string {
  const d = declared?.trim().toLowerCase();
  if (d?.startsWith("video/")) return declared!;
  const n = fileName.toLowerCase();
  if (n.endsWith(".mp4") || n.endsWith(".m4v")) return "video/mp4";
  if (n.endsWith(".mov") || n.endsWith(".qt")) return "video/quicktime";
  if (n.endsWith(".webm")) return "video/webm";
  if (n.endsWith(".avi")) return "video/x-msvideo";
  if (n.endsWith(".mpeg") || n.endsWith(".mpg")) return "video/mpeg";
  return declared || "video/mp4";
}

function inferAudioMimeType(fileName: string, declared?: string): string {
  const d = declared?.trim().toLowerCase();
  if (d?.startsWith("audio/")) return declared!;
  const n = fileName.toLowerCase();
  if (n.endsWith(".mp3")) return "audio/mpeg";
  if (n.endsWith(".wav")) return "audio/wav";
  if (n.endsWith(".m4a")) return "audio/mp4";
  if (n.endsWith(".ogg")) return "audio/ogg";
  if (n.endsWith(".webm")) return "audio/webm";
  return declared || "audio/mpeg";
}

/** Routes to messaging upload/video, upload/audio, or upload/file based on type + mime + extension. */
export function contentUploadKind(
  file: SelectedUploadFile,
  resourceType: ResourceType
): "video" | "audio" | "file" {
  const mime = (file.mimeType ?? "").toLowerCase();
  if (resourceType === "video" || mime.startsWith("video/")) return "video";
  if (/\.(mp4|mpeg|mpg|mov|qt|webm|avi|m4v)$/i.test(file.name)) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (/\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name)) return "audio";
  return "file";
}

export async function uploadResourceContentFile(
  uploadableUri: string,
  file: SelectedUploadFile,
  resourceType: ResourceType
): Promise<{ url: string }> {
  const kind = contentUploadKind(file, resourceType);
  let mimeForUpload = file.mimeType || "application/octet-stream";
  if (kind === "video") {
    mimeForUpload = inferVideoMimeType(file.name, file.mimeType);
  } else if (kind === "audio") {
    mimeForUpload = inferAudioMimeType(file.name, file.mimeType);
  }

  const fileFormData = new FormData();
  fileFormData.append("file", {
    uri: uploadableUri,
    name: file.name,
    type: mimeForUpload,
  } as any);

  if (kind === "video") {
    return messagingService.uploadVideo(fileFormData);
  }
  if (kind === "audio") {
    return messagingService.uploadAudio(fileFormData);
  }
  return messagingService.uploadFile(fileFormData);
}
