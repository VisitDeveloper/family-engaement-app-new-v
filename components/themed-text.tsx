import { useThemeColor } from '@/hooks/use-theme-color';
import { useStore } from '@/store';
import { Text, TouchableOpacity, type TextProps, type TextStyle } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'subText' | 'middleTitle' | 'subLittleText' | 'text' | 'error';
  readString?: string;
};

const defaultType: ThemedTextProps['type'] = 'default';

export function ThemedText({
  style,
  lightColor,
  darkColor,
  readString = 'default',
  type = defaultType,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const isLargeFont = useStore((state) => state.isLargeFont);

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
  const speak = useStore((state) => state.speak);
  const voiceEnabled = useStore((state) => state.voiceNarrationEnabled);

  if (voiceEnabled) {
    return (
      <TouchableOpacity onPress={() => speak(`${readString}`)}>
        <Text style={[{ color }, typeStyles[typeKey || 'default'], style]} {...rest} />
      </TouchableOpacity>
    )
  } else {
    return <Text style={[{ color }, typeStyles[typeKey || 'default'], style]} {...rest} />;
  }
}
