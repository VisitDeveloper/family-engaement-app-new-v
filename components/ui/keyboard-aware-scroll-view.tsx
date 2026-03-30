import type { ReactNode } from "react";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type KeyboardAwareScrollViewPlatformProps = ScrollViewProps & {
  bottomOffset?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function KeyboardAwareScrollViewPlatform({
  bottomOffset = 0,
  style,
  children,
  contentContainerStyle,
  ...props
}: KeyboardAwareScrollViewPlatformProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? bottomOffset : 0}
    >
      <ScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
