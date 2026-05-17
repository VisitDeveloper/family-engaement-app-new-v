import { VideoView, useVideoPlayer } from "expo-video";
import { StyleProp, ViewStyle } from "react-native";

type AppVideoPreviewProps = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: "contain" | "cover" | "fill";
};

/** Inline video preview with native controls (expo-video). */
export function AppVideoPreview({
  uri,
  style,
  contentFit = "contain",
}: AppVideoPreviewProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={style}
      nativeControls
      contentFit={contentFit}
    />
  );
}
