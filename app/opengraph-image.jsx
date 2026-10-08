import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Fluxgo — intercity carpooling in India. Going to another city? Someone already is.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const HERO = '#102A1B';
const MINT = '#B4E2AE';
const ON_DARK = '#E9F0EA';
const ROUTE = 'M 40 360 C 170 360, 190 150, 320 180 S 470 330, 540 90';

export default async function OpengraphImage() {
  const fontDir = join(process.cwd(), 'app/_fonts');
  const [semibold, bold] = await Promise.all([
    readFile(join(fontDir, 'Inter-600.ttf')),
    readFile(join(fontDir, 'Inter-700.ttf'))
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', position: 'relative',
          background: `radial-gradient(60% 75% at 82% 30%, #2F6B46 0%, ${HERO} 72%)`,
          color: ON_DARK, fontFamily: 'Inter'
        }}
      >
        {/* Route motif on the right */}
        <svg width="580" height="420" viewBox="0 0 580 420" style={{ position: 'absolute', right: 30, top: 70 }}>
          <path d={ROUTE} fill="none" stroke="rgba(180,226,174,0.16)" strokeWidth="26" strokeLinecap="round" />
          <path d={ROUTE} fill="none" stroke={MINT} strokeWidth="5" strokeLinecap="round" strokeDasharray="2 16" />
          <circle cx="40" cy="360" r="14" fill={HERO} stroke={ON_DARK} strokeWidth="6" />
          <circle cx="540" cy="90" r="20" fill={MINT} />
          <circle cx="540" cy="90" r="7" fill={HERO} />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', padding: '64px 76px' }}>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 700, letterSpacing: -2.4 }}>
            fluxgo<span style={{ color: MINT }}>.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 88, fontWeight: 700, lineHeight: 1, letterSpacing: -4.4 }}>
            <span>Going to</span>
            <span>another city?</span>
            <span style={{ color: MINT, fontSize: 58, letterSpacing: -2.6, marginTop: 14 }}>Someone already is.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Checked vehicles', 'Fixed seat prices', 'Trusted contact'].map((label) => (
                <div
                  key={label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999,
                    background: 'rgba(233,240,234,0.08)', border: '1.5px solid rgba(233,240,234,0.16)',
                    fontSize: 22, fontWeight: 600, color: 'rgba(233,240,234,0.85)'
                  }}
                >
                  <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 10, background: MINT }} />
                  {label}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: 'rgba(233,240,234,0.6)' }}>fluxgo.in</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: semibold, weight: 600, style: 'normal' },
        { name: 'Inter', data: bold, weight: 700, style: 'normal' }
      ]
    }
  );
}
