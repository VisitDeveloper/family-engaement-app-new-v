import { SvgXml } from 'react-native-svg';

// SVG content for each icon
const aiAssistantSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 6.66671V3.33337H6.66667" stroke="#9810FA" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15 6.66663H4.99999C4.07952 6.66663 3.33333 7.41282 3.33333 8.33329V15C3.33333 15.9204 4.07952 16.6666 4.99999 16.6666H15C15.9205 16.6666 16.6667 15.9204 16.6667 15V8.33329C16.6667 7.41282 15.9205 6.66663 15 6.66663Z" stroke="#9810FA" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M1.66667 11.6666H3.33334" stroke="#9810FA" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.6667 11.6666H18.3333" stroke="#9810FA" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.5 10.8334V12.5" stroke="#9810FA" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.5 10.8334V12.5" stroke="#9810FA" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const emergencySvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.1083 15L11.4417 3.33332C11.2963 3.07682 11.0855 2.86347 10.8308 2.71504C10.576 2.56661 10.2865 2.4884 9.99167 2.4884C9.69685 2.4884 9.4073 2.56661 9.15257 2.71504C8.89783 2.86347 8.68703 3.07682 8.54167 3.33332L1.875 15C1.72807 15.2544 1.65103 15.5432 1.65168 15.8371C1.65233 16.1309 1.73065 16.4194 1.87871 16.6732C2.02676 16.927 2.23929 17.1371 2.49475 17.2823C2.7502 17.4275 3.03951 17.5026 3.33334 17.5H16.6667C16.9591 17.4997 17.2463 17.4225 17.4994 17.2761C17.7525 17.1297 17.9627 16.9192 18.1088 16.6659C18.2548 16.4126 18.3317 16.1253 18.3316 15.8329C18.3316 15.5405 18.2545 15.2532 18.1083 15Z" stroke="#E7000B" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 7.5V10.8333" stroke="#E7000B" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 14.1666H10.0083" stroke="#E7000B" stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const newSvg = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.2998 14.48C1.53809 14.48 0.964355 14.2896 0.578613 13.9087C0.192871 13.5327 0 12.9663 0 12.2095V3.77197C0 3.01514 0.192871 2.44873 0.578613 2.07275C0.964355 1.69189 1.53809 1.50146 2.2998 1.50146H10.5981L9.41895 2.68066H2.32178C1.95557 2.68066 1.67236 2.77832 1.47217 2.97363C1.27686 3.16895 1.1792 3.45703 1.1792 3.83789V12.1509C1.1792 12.5317 1.27686 12.8198 1.47217 13.0151C1.67236 13.2056 1.95557 13.3008 2.32178 13.3008H10.8838C11.1377 13.3008 11.3525 13.2056 11.5283 13.0151C11.709 12.8198 11.7993 12.5317 11.7993 12.1509V5.11963L12.9785 3.94043V12.2095C12.9785 12.9663 12.7954 13.5327 12.4292 13.9087C12.0679 14.2896 11.5576 14.48 10.8984 14.48H2.2998ZM4.96582 9.73389C4.89746 9.76318 4.83398 9.74854 4.77539 9.68994C4.72168 9.62646 4.70947 9.56299 4.73877 9.49951L5.39795 8.12256L12.2314 1.28906L13.2349 2.27783L6.39404 9.11133L4.96582 9.73389ZM13.7769 1.74316L12.7734 0.732422L13.3081 0.205078C13.4302 0.0878906 13.5693 0.0244141 13.7256 0.0146484C13.8867 0.00488281 14.0234 0.0561523 14.1357 0.168457L14.3042 0.344238C14.4312 0.466309 14.4922 0.60791 14.4873 0.769043C14.4873 0.925293 14.4263 1.06934 14.3042 1.20117L13.7769 1.74316Z" fill="currentColor"/>
</svg>
`;

interface TabIconProps {
  color: string;
  size?: number;
}

export function AiAssistantIcon({ color, size = 24 }: TabIconProps) {
  const coloredSvg = aiAssistantSvg.replace(/currentColor/g, color);
  return <SvgXml xml={coloredSvg} width={size} height={size} />;
}

export function EmergencyIcon({ color, size = 24 }: TabIconProps) {
  const coloredSvg = emergencySvg.replace(/currentColor/g, color);
  return <SvgXml xml={coloredSvg} width={size} height={size} />;
}

export function NewIcon({ color, size = 24 }: TabIconProps) {
  const coloredSvg = newSvg.replace(/currentColor/g, color);
  return <SvgXml xml={coloredSvg} width={size} height={size} />;
}