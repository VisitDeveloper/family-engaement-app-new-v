import { useStore } from "@/store";
import { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

type SkeletonBlockProps = {
  style?: StyleProp<ViewStyle>;
};

/** Themed placeholder block with a subtle pulse animation. */
export function SkeletonBlock({ style }: SkeletonBlockProps) {
  const theme = useStore((s) => s.theme);
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.panel,
          borderWidth: 1,
          borderColor: theme.border,
          opacity,
        },
        style,
      ]}
    />
  );
}
