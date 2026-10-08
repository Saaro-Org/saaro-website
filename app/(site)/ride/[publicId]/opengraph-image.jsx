import { ImageResponse } from 'next/og';
import { STATE_COPY, loadRide, rideDate, rideTime, rupees, vehicleLine, vehicleSwatch } from './ride-data';

export const alt = 'Fluxgo shared ride';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 60;

const HERO = '#102A1B';
const MINT = '#B4E2AE';
const ON_DARK = '#E9F0EA';
const MUTED = 'rgba(233, 240, 234, 0.68)';

export default async function Image({ params }) {
  const { publicId } = await params;
  const { trip } = await loadRide(publicId);

  if (!trip) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', background: HERO, color: ON_DARK, alignItems: 'center', justifyContent: 'center', fontSize: 84, fontWeight: 700 }}>
          fluxgo<span style={{ color: MINT }}>.</span>
        </div>
      ),
      size
    );
  }

  const closed = STATE_COPY[trip.state];
  const car = vehicleLine(trip.vehicle);
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: HERO, color: ON_DARK, padding: '64px 72px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>fluxgo<span style={{ color: MINT }}>.</span></div>
          <div style={{ display: 'flex', fontSize: 30, color: MUTED }}>{rideDate(trip.departureAt)} · {rideTime(trip.departureAt)}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 92, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05 }}>
            <span>{trip.origin.city}</span>
            <span style={{ color: MINT, margin: '0 28px' }}>→</span>
            <span>{trip.destination.city}</span>
          </div>
          {car ? (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 24, fontSize: 34, color: MUTED }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: vehicleSwatch(trip.vehicle?.color), border: '2px solid rgba(233,240,234,0.4)', marginRight: 16 }} />
              {car}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {closed ? (
            <div style={{ display: 'flex', fontSize: 40, fontWeight: 600, color: MINT }}>{closed.title}</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: MINT, color: HERO, borderRadius: 999, padding: '14px 30px', fontSize: 40, fontWeight: 700 }}>{rupees(trip.pricePerSeat)} per seat</div>
              <div style={{ display: 'flex', marginLeft: 28, fontSize: 36, color: ON_DARK }}>{trip.seatsAvailable} {trip.seatsAvailable === 1 ? 'seat' : 'seats'} left</div>
            </div>
          )}
        </div>
      </div>
    ),
    size
  );
}
