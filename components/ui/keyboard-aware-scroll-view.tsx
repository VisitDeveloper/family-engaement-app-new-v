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
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

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
  if (Platform.OS === "android") {
    return (
      <KeyboardAwareScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps="handled"
        {...props}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={bottomOffset}
    >
      <ScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
