import React from 'react';
import { SvgXml } from 'react-native-svg';
import { StyleProp, ViewStyle } from 'react-native';

interface SvgIconHelperProps {
  svgContent: string;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function SvgIconHelper({ 
  svgContent, 
  color = '#000', 
  size = 24, 
  style 
}: SvgIconHelperProps) {
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
