import * as FileSystem from 'expo-file-system';

/**
 * Load SVG file content as string
 * Usage: const svgContent = await loadSvgFile(require('@/assets/images/icons/search.svg'));
 */
export async function loadSvgFile(asset: any): Promise<string> {
  try {
    // For Expo, we need to read the file from the asset
    // First, get the local URI
    const localUri = asset.uri || asset;
    
    // Read the file content
    const content = await FileSystem.readAsStringAsync(localUri);
    return content;
  } catch (error) {
    console.error('Error loading SVG file:', error);
    return '';
  }
}

/**
 * Synchronous version - requires SVG content to be imported as string
 * This is the recommended approach for React Native
 */
export function getSvgContent(svgString: string): string {
  return svgString;
}
