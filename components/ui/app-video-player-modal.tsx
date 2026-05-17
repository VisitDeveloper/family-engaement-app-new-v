import { ThemedText } from "@/components/themed-text";
import { feedback } from "@/lib/feedback";
import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AppVideoPlayerModalProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
};

function VideoPlayerModalContent({
  uri,
  onClose,
}: {
  uri: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  useEffect(() => {
    if (status === "error") {
      console.error("Video playback error:", uri);
      feedback.toast.error(t("common.error"), "Failed to play video");
      onClose();
    }
  }, [status, uri, onClose, t]);

  useEvent(player, "playToEnd", () => {
    player.currentTime = 0;
    player.pause();
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity onPress={onClose} accessibilityRole="button">
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={{ color: "#fff", fontSize: 16 }}>
          {t("buttons.video")}
        </ThemedText>
        <View style={{ width: 28 }} />
      </View>
      <VideoView
        player={player}
        style={{ flex: 1, width: "100%" }}
        nativeControls
        contentFit="contain"
        allowsFullscreen
      />
    </View>
  );
}

export function AppVideoPlayerModal({
  visible,
  uri,
  onClose,
}: AppVideoPlayerModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {visible && uri ? (
        <VideoPlayerModalContent uri={uri} onClose={onClose} />
      ) : null}
    </Modal>
  );
}
