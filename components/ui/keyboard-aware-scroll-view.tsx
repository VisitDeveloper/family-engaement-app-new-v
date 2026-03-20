import { Platform, ScrollView } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import type { ScrollViewProps } from "react-native";

type Props = ScrollViewProps & {
  /** Only used on Android (KeyboardAwareScrollView). Distance between keyboard and focused input. */
  bottomOffset?: number;
};

/**
 * On iOS: regular ScrollView (keyboard handled by root KeyboardAvoidingView).
 * On Android: KeyboardAwareScrollView so input stays above keyboard.
 */
export function KeyboardAwareScrollViewPlatform(props: Props) {
  const { bottomOffset = 64, ...rest } = props;

  if (Platform.OS === "ios") {
    return <ScrollView keyboardShouldPersistTaps="handled" {...rest} />;
  }

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      bottomOffset={bottomOffset}
      extraKeyboardSpace={16}
      {...rest}
    />
  );
}
