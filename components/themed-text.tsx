import { useVoiceText } from '@/hooks/use-voice-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useStore } from '@/store';
import { Text, TouchableOpacity, type TextProps, type TextStyle } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'subText' | 'middleTitle' | 'subLittleText' | 'text' | 'error';
  /** Spoken text when it differs from visible children. */
  readString?: string;
  /** Skip tap-to-speak when a parent control handles narration. */
  narrationDisabled?: boolean;
};

const defaultType: ThemedTextProps['type'] = 'default';

export function ThemedText({
  style,
  lightColor,
  darkColor,
  readString,
  narrationDisabled = false,
  type = defaultType,
  children,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const isLargeFont = useStore((state) => state.isLargeFont);
  const { voiceEnabled, speechText, onSpeak } = useVoiceText(children, readString);

  const adjustFontSize = (fontSize: number) => fontSize + (isLargeFont ? 2 : 0);

  const typeStyles: Record<NonNullable<ThemedTextProps['type']>, TextStyle> = {
    default: { fontSize: adjustFontSize(16), lineHeight: 24 },
    defaultSemiBold: { fontSize: adjustFontSize(16), lineHeight: 24, fontWeight: '600' as TextStyle['fontWeight'] },
    title: { fontSize: adjustFontSize(32), lineHeight: 32, fontWeight: 'bold' },
    link: { fontSize: adjustFontSize(16), lineHeight: 30, color: '#0a7ea4' },
    subtitle: { fontSize: adjustFontSize(20), fontWeight: 'bold' },
    middleTitle: { fontSize: adjustFontSize(15), fontWeight: '700' },
    text: { fontSize: adjustFontSize(14), lineHeight: 20, fontWeight: '700' },
    subText: { fontSize: adjustFontSize(12), lineHeight: 20 },
    subLittleText: { fontSize: adjustFontSize(10), lineHeight: 20 },
    error: { fontSize: adjustFontSize(12), lineHeight: 20, color: '#f87171' },
  };

  const typeKey = type ?? defaultType;
  const textStyle = [{ color }, typeStyles[typeKey || 'default'], style];

  if (voiceEnabled && !narrationDisabled && speechText) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onSpeak}
        accessibilityRole="button"
        accessibilityLabel={speechText}
      >
        <Text style={textStyle} {...rest}>{children}</Text>
      </TouchableOpacity>
    );
  }

  return <Text style={textStyle} {...rest}>{children}</Text>;
}
