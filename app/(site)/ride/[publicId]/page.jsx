import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Wordmark from '../../_components/Wordmark';
import { AppleGlyph } from '../../_components/StoreButtons';
import { IconArrow, IconBag, IconCalendar, IconClock, IconSeat, IconShield, IconStar } from '../../_components/Icons';
import {
  ANDROID_PACKAGE,
  ANDROID_STORE_PUBLIC,
  APP_STORE_ID,
  APP_STORE_URL,
  IOS_APP_LINKS_LIVE,
  OPEN_HOST_URL,
  PLAY_STORE_URL,
  SITE_URL,
  WEB_APP_URL
} from '../../_components/links';
import { deviceKind } from '../../../../lib/app-links';
import {
  STATE_COPY,
  duration,
  loadRide,
  luggageLabel,
  rideDate,
  rideSummary,
  rideTime,
  rideTitle,
  rupees,
  vehicleLine,
  vehicleMeta,
  vehicleSwatch
} from './ride-data';

export async function generateMetadata({ params }) {
  const { publicId } = await params;
  const result = await loadRide(publicId);
  const base = { robots: { index: false, follow: false } };
  if (!result.trip) return { ...base, title: 'Ride | Fluxgo' };
  const { trip } = result;
  const title = `${rideTitle(trip)} · Fluxgo ride`;
  const description = rideSummary(trip);
  const url = `${SITE_URL}/ride/${trip.publicId}`;
  return {
    ...base,
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Fluxgo', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    // Show the Safari App Store banner only when the live app can open shared links.
    itunes: IOS_APP_LINKS_LIVE ? { appId: APP_STORE_ID, appArgument: url } : null
  };
}

function Seats({ available, total }) {
  return (
    <span className="fx-share-seatdots" aria-label={`${available} of ${total} seats left`}>
      {Array.from({ length: Math.max(0, total) }, (_, index) => (
        <i key={index} className={index < available ? 'is-free' : ''} />
      ))}
    </span>
  );
}

function CarArt({ color }) {
  const fill = vehicleSwatch(color);
  return (
    <svg className="fx-share-car-art" viewBox="0 0 120 52" aria-hidden="true" focusable="false">
      <path d="M8 36c0-5 2-8 7-9l14-3 13-11c3-2 6-3 10-3h26c4 0 7 1 10 4l11 10 8 2c5 1 7 4 7 9v5H8z" fill={fill} stroke="rgba(16,42,27,0.28)" strokeWidth="1.2" />
      <path d="M46 14h14v11H34zM65 14h14c2 0 4 1 5 2l9 9H65z" fill="#DCE8EE" stroke="rgba(16,42,27,0.22)" />
      <circle cx="31" cy="41" r="8" fill="#1B1B19" /><circle cx="31" cy="41" r="3.4" fill="#C9C9C1" />
      <circle cx="91" cy="41" r="8" fill="#1B1B19" /><circle cx="91" cy="41" r="3.4" fill="#C9C9C1" />
    </svg>
  );
}

function Avatar({ host }) {
  if (host.profilePhotoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="fx-share-avatar" src={host.profilePhotoUrl} alt="" width="52" height="52" />;
  }
  return <span className="fx-share-avatar" aria-hidden="true">{host.displayName.charAt(0)}</span>;
}

const COMING_SOON_NOTE = 'The Fluxgo app is coming soon. Book on the web for now.';

function actionsFor(kind, trip) {
  const id = trip.publicId;
  const web = `${WEB_APP_URL}/trip/${id}`;
  const webAction = { href: web, label: 'Continue on the web' };
  if (trip.state !== 'OPEN') {
    return { primary: { href: WEB_APP_URL, label: 'Find another ride' }, secondary: null };
  }
  if (kind === 'ios') {
    if (!IOS_APP_LINKS_LIVE) return { primary: webAction, secondary: null, note: COMING_SOON_NOTE };
    return {
      primary: { href: `${OPEN_HOST_URL}/open/ride/${id}`, label: 'Book in the Fluxgo app' },
      secondary: { href: web, label: 'Continue in browser' },
      note: 'Opens Fluxgo if you have it. If not, the App Store opens.'
    };
  }
  if (kind === 'android') {
    // Closed testers who have the app open shared links in the app before this page loads.
    if (!ANDROID_STORE_PUBLIC) return { primary: webAction, secondary: null, note: COMING_SOON_NOTE };
    return {
      primary: {
        href: `intent://trip/${id}#Intent;scheme=fluxgo;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`,
        label: 'Book in the Fluxgo app'
      },
      secondary: { href: web, label: 'Continue in browser' },
      note: 'Opens Fluxgo if you have it. If not, Google Play opens.'
    };
  }
  if (!IOS_APP_LINKS_LIVE) return { primary: { href: web, label: 'Book on the web' }, secondary: null, note: COMING_SOON_NOTE };
  return {
    primary: { href: web, label: 'Book on the web' },
    secondary: { href: APP_STORE_URL, label: 'Get the iPhone app', apple: true },
    note: 'Book in your browser, or on your phone with the Fluxgo app.'
  };
}

function Unavailable({ id }) {
  return (
    <main className="fx-share fx-share-empty">
      <header className="fx-share-top"><Link href="/" aria-label="Fluxgo home"><Wordmark /></Link></header>
      <section className="fx-share-sheet">
        <h1>We could not load this ride</h1>
        <p>Try again in a minute, or open it in the Fluxgo web app.</p>
        <a className="fx-share-btn" href={id ? `${WEB_APP_URL}/trip/${id}` : WEB_APP_URL}>Open in browser</a>
      </section>
    </main>
  );
}

export default async function RidePage({ params }) {
  const { publicId } = await params;
  const result = await loadRide(publicId);
  if (result.notFound) notFound();
  if (!result.trip) return <Unavailable id={result.id} />;

  const { trip } = result;
  const kind = deviceKind((await headers()).get('user-agent') ?? '');
  const actions = actionsFor(kind, trip);
  const closed = STATE_COPY[trip.state];
  const routeTime = duration(trip.routeDurationSeconds);
  const stops = [
    { key: 'from', label: trip.origin.label, city: trip.origin.city, time: rideTime(trip.departureAt) },
    ...trip.stops.map((stop, index) => ({ key: `stop-${index}`, label: stop.label, city: stop.city, time: null, middle: true })),
    { key: 'to', label: trip.destination.label, city: trip.destination.city, time: trip.estimatedArrivalAt ? `~${rideTime(trip.estimatedArrivalAt)}` : null }
  ];

  return (
    <main className="fx-share">
      <section className="fx-share-hero">
        <header className="fx-share-top">
          <Link href="/" aria-label="Fluxgo home"><Wordmark /></Link>
          <span className="fx-mono">Shared ride</span>
        </header>
        <div className="fx-share-hero-copy">
          <p className="fx-mono fx-share-date"><IconCalendar width={16} height={16} />{rideDate(trip.departureAt)} · {rideTime(trip.departureAt)}</p>
          <h1 className="fx-share-title">
            <span>{trip.origin.city}</span>
            <IconArrow width={28} height={28} className="fx-share-title-arrow" />
            <span>{trip.destination.city}</span>
          </h1>
          {trip.state === 'OPEN' ? (
            <div className="fx-share-price">
              <strong>{rupees(trip.pricePerSeat)}</strong><span>per seat</span>
              <span className="fx-share-dot" aria-hidden="true" />
              <Seats available={trip.seatsAvailable} total={trip.seatsTotal} />
              <span>{trip.seatsAvailable} {trip.seatsAvailable === 1 ? 'seat' : 'seats'} left</span>
            </div>
          ) : null}
        </div>
      </section>

      <div className="fx-share-body">
        {closed ? (
          <section className="fx-share-card fx-share-closed" role="status">
            <h2>{closed.title}</h2>
            <p>{closed.body}</p>
          </section>
        ) : null}

        <section className="fx-share-card" aria-label="Route">
          <ol className="fx-share-route">
            {stops.map((stop) => (
              <li key={stop.key} className={stop.middle ? 'is-middle' : ''}>
                <span className="fx-share-route-time">{stop.time ?? ''}</span>
                <span className="fx-share-route-pin" aria-hidden="true" />
                <span className="fx-share-route-place">
                  <strong>{stop.label}</strong>
                  {stop.city && stop.city !== stop.label ? <small>{stop.city}</small> : null}
                </span>
              </li>
            ))}
          </ol>
          {routeTime ? <p className="fx-share-route-foot"><IconClock width={16} height={16} />About {routeTime} on the road</p> : null}
        </section>

        {trip.vehicle ? (
          <section className="fx-share-card fx-share-car" aria-label="Car">
            <CarArt color={trip.vehicle.color} />
            <div>
              <p className="fx-mono">The car</p>
              <h2>{vehicleLine(trip.vehicle)}</h2>
              {vehicleMeta(trip.vehicle) ? <p>{vehicleMeta(trip.vehicle)}</p> : null}
            </div>
          </section>
        ) : null}

        {trip.host ? (
          <section className="fx-share-card fx-share-host" aria-label="Ride host">
            <div className="fx-share-host-row">
              <Avatar host={trip.host} />
              <div>
                <p className="fx-mono">Ride host</p>
                <h2>{trip.host.displayName}</h2>
                <p className="fx-share-host-stats">
                  <IconStar width={14} height={14} />
                  {trip.host.rating ? trip.host.rating.toFixed(1) : 'New'}
                  {' · '}{trip.host.reviewCount} {trip.host.reviewCount === 1 ? 'review' : 'reviews'}
                  {' · '}{trip.host.completedRides} {trip.host.completedRides === 1 ? 'ride' : 'rides'}
                </p>
              </div>
            </div>
            {trip.host.workEmailVerified || trip.host.vehicleVerified ? (
              <ul className="fx-share-badges">
                {trip.host.workEmailVerified ? <li><IconShield width={16} height={16} />Work email verified</li> : null}
                {trip.host.vehicleVerified ? <li><IconShield width={16} height={16} />Vehicle checked</li> : null}
              </ul>
            ) : null}
          </section>
        ) : null}

        {trip.state === 'OPEN' ? (
          <section className="fx-share-card" aria-label="Ride details">
            <dl className="fx-share-facts">
              <div><dt><IconSeat width={16} height={16} />Booking</dt><dd>{trip.bookingMode === 'INSTANT' ? 'Instant book' : 'Request to book'}</dd></div>
              <div><dt><IconBag width={16} height={16} />Luggage</dt><dd>{luggageLabel(trip)}</dd></div>
              <div><dt><IconCalendar width={16} height={16} />Plan</dt><dd>{trip.tripCertainty === 'TENTATIVE' ? 'Tentative' : 'Confirmed'}</dd></div>
              <div><dt><IconSeat width={16} height={16} />Seats</dt><dd>{trip.seatsAvailable} of {trip.seatsTotal} left</dd></div>
            </dl>
          </section>
        ) : null}

        <p className="fx-share-legal">
          Sign in with your phone number to book. Check that the host, car, and number plate match the app before you get in.
        </p>
      </div>

      <footer className="fx-share-bar">
        <div className="fx-share-bar-inner">
          {actions.note ? <p className="fx-share-bar-note">{actions.note}</p> : null}
          <div className="fx-share-bar-actions">
            <a className="fx-share-btn" href={actions.primary.href}>{actions.primary.label}</a>
            {actions.secondary ? (
              <a className="fx-share-btn fx-share-btn-ghost" href={actions.secondary.href}>
                {actions.secondary.apple ? <AppleGlyph /> : null}
                {actions.secondary.label}
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </main>
  );
}
