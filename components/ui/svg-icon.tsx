import React from 'react';
import { SvgXml } from 'react-native-svg';
import { StyleProp, ViewStyle } from 'react-native';

interface SvgIconProps {
  svgContent: string; // SVG content as string
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Component to render SVG icons with dynamic color support
 * The SVG file should use fill="currentColor" for color to work
 * 
 * Usage:
 * import messagesSvg from '@/assets/images/icons/messages.svg?raw';
 * <SvgIcon svgContent={messagesSvg} color="#000" size={24} />
 */
export function SvgIcon({ svgContent, color = '#000', size = 24, style }: SvgIconProps) {
  // Replace currentColor with the actual color
  const coloredSvg = svgContent.replace(/currentColor/g, color);
  
  return (
    <SvgXml 
      xml={coloredSvg} 
      width={size} 
      height={size} 
      style={style}
    />
  );
}
