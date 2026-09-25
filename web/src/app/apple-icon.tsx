import { ImageResponse } from 'next/og';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', background: '#D4FF3F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 132, fontWeight: 900, color: '#0A0A0B', fontFamily: 'sans-serif' }}>?</div>,
    size,
  );
}
