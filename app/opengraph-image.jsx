import { ImageResponse } from 'next/og';

export const alt = 'Fluxgo — intercity carpooling in India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '72px 80px', background: 'radial-gradient(70% 80% at 85% 20%, #2F6B46 0%, #102A1B 70%)', color: '#E9F0EA'
        }}
      >
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, letterSpacing: -2 }}>
          fluxgo<span style={{ color: '#B4E2AE' }}>.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 84, fontWeight: 700, lineHeight: 1, letterSpacing: -4 }}>
          <span>Going to another city?</span>
          <span style={{ color: '#B4E2AE' }}>Someone already is.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 28, color: 'rgba(233,240,234,0.7)' }}>
          <div style={{ display: 'flex', width: 120, height: 6, borderRadius: 3, background: '#B4E2AE' }} />
          Intercity carpooling · India
        </div>
      </div>
    ),
    size
  );
}
