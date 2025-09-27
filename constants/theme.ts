/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#a846c2';
const tintColorDark = '#d17fe0'; // کمی روشن‌تر از بنفش تیره برای دارک مود

const emergencyColor = '#f87171';
const emergencyBackgroundColor = '#fdf1f1'

const star = '#efb000'

export const Colors = {
  light: {

    tint: tintColorLight,

    //Emergency
    emergencyColor: emergencyColor,
    emergencyBackground: emergencyBackgroundColor,

    text: '#11181C',
    textSecondary: '#9393a0',
    // #9393a0
    // #232323
    background: '#fff',
    backgroundElement: '#fff',
    backgroundElementSecondary: '#f3f3f5',
    textElement: '#666',
    passwordDescriptionText: '#467938',
    dashboardColorNumber: "#17709c",
    borderColor: '#ddd',
    star: star,

    //check
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    tabActivationBackground: '#f4e9f7',
    tabBarBorderColor: '#ddd',
    iconSecondColor: '#fff',
    messageTimeColor: '#999',
    messageTextColor: '#666',
    textMessageMe: '#fff',
  },
  dark: {

    tint: tintColorDark,

    // Emergency
    emergencyColor: emergencyColor,
    emergencyBackground: emergencyBackgroundColor,

    text: '#E5E5E5', // سفید ملایم به جای #ECEDEE برای بهتر دیده شدن
    textSecondary: '#ECEDEE',
    background: '#1C1C1E',
    backgroundElement: '#2C2C2E',
    backgroundElementSecondary: '#3C3C3E',
    textElement: '#ddd',
    passwordDescriptionText: '#467938',
    dashboardColorNumber: "#17709c",
    borderColor: '#555',
    star: star,

    //check
    icon: '#A0A0A5', // کمی روشن‌تر برای آیکون‌ها
    tabIconDefault: '#7E7E82', // خاکستری مناسب با پس‌زمینه
    tabIconSelected: tintColorDark,
    tabActivationBackground: '#2C2C2E', // پس‌زمینه فعال تب کمی روشن‌تر
    tabBarBorderColor: '#444', // مرز ملایم
    iconSecondColor: '#fff',
    messageTimeColor: '#AAA', // متن زمان کمی روشن‌تر
    messageTextColor: '#CCC', // پیام‌ها کمی روشن‌تر
    textMessageMe: '#000', // اگر پیام خودم روی پس‌زمینه روشنه
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
