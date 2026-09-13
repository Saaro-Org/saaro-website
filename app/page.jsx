'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [year, setYear] = useState('');

  useEffect(() => {
    setYear(String(new Date().getFullYear()));

    const revealItems = Array.from(document.querySelectorAll('.reveal'));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return undefined;
    }

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header" id="top">
        <div className="container nav-wrap">
          <a className="brand" href="#top" aria-label="Flux Go home">
            <span className="brand-glyph" aria-hidden="true"><i /><i /></span>
            <span className="brand-name">Flux <em>Go</em></span>
          </a>

          <nav className="primary-nav" aria-label="Primary navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#for-drivers">For drivers</a>
            <a href="#trust">Trust &amp; safety</a>
          </nav>

          <a className="nav-cta" href="#download">Get the app <span aria-hidden="true">↗</span></a>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span className="menu-line" />
            <span className="menu-line" />
          </button>
        </div>

        <div className="mobile-menu" id="mobile-menu" hidden={!menuOpen}>
          <nav aria-label="Mobile navigation">
            <a href="#how-it-works" onClick={closeMenu}>How it works <span aria-hidden="true">↘</span></a>
            <a href="#for-drivers" onClick={closeMenu}>For drivers <span aria-hidden="true">↘</span></a>
            <a href="#trust" onClick={closeMenu}>Trust &amp; safety <span aria-hidden="true">↘</span></a>
            <a href="#questions" onClick={closeMenu}>Questions <span aria-hidden="true">↘</span></a>
            <a className="mobile-menu-cta" href="#download" onClick={closeMenu}>Get the app <span aria-hidden="true">↗</span></a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="hero section-dark">
          <div className="container hero-grid">
            <div className="hero-copy reveal">
              <p className="eyebrow"><span className="eyebrow-dot" />Reliable intercity carpooling</p>
              <h1>Go farther,<br /><span>together.</span></h1>
              <p className="hero-lede">
                Find a ride to your next city or share the seats you have. See the route, people, and plan
                before you commit.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#download">Find a ride <span aria-hidden="true">→</span></a>
                <a className="button button-text" href="#for-drivers">Offer a ride <span aria-hidden="true">↗</span></a>
              </div>
              <div className="hero-footnote">
                <div className="avatar-stack" aria-hidden="true">
                  <span className="avatar avatar-one">A</span>
                  <span className="avatar avatar-two">R</span>
                  <span className="avatar avatar-three">M</span>
                </div>
                <span>Clear trip details before you confirm</span>
              </div>
            </div>

            <div className="hero-visual reveal reveal-delay-1" aria-label="Example Flux Go route card">
              <div className="visual-kicker"><span className="live-dot" />Route preview</div>
              <div className="route-stage">
                <Image
                  src="/assets/route-journey.png"
                  alt="A car travelling on a green road between two places"
                  width={1536}
                  height={1024}
                  priority
                />
                <div className="route-label route-label-start">
                  <span className="route-pin">01</span>
                  <span><small>From</small><strong>Bengaluru</strong></span>
                </div>
                <div className="route-label route-label-end">
                  <span className="route-pin">02</span>
                  <span><small>To</small><strong>Hyderabad</strong></span>
                </div>
                <div className="route-time"><strong>4h 55m</strong><span>shared road time</span></div>
              </div>

              <div className="trip-card">
                <div className="trip-card-head">
                  <span>Next ride</span>
                  <span className="status-chip"><span className="status-dot" />Open</span>
                </div>
                <div className="trip-route">
                  <div className="trip-city"><strong>BLR</strong><span>Bengaluru</span></div>
                  <div className="trip-route-line" aria-hidden="true"><span /></div>
                  <div className="trip-city trip-city-end"><strong>HYD</strong><span>Hyderabad</span></div>
                </div>
                <div className="trip-meta"><span>Sat, 21 Sep</span><strong>₹650 <small>/ seat</small></strong></div>
              </div>
              <div className="floating-note"><span aria-hidden="true">✦</span> 2 seats left <b>•</b> Instant book</div>
            </div>
          </div>

          <div className="marquee" aria-label="Flux Go services">
            <div className="marquee-track">
              <span>Find a ride</span><b>✦</b><span>Offer a ride</span><b>✦</b><span>Keep moving</span><b>✦</b>
              <span>Find a ride</span><b>✦</b><span>Offer a ride</span><b>✦</b><span>Keep moving</span><b>✦</b>
            </div>
          </div>
        </section>

        <section className="trust-band section-cream" id="trust">
          <div className="container">
            <div className="trust-band-heading reveal">
              <div>
                <p className="eyebrow eyebrow-dark">Reliability, trust, and safety</p>
                <h2>Know what you are<br /><span>choosing.</span></h2>
              </div>
              <p>Good road sharing starts with clear details. Flux Go puts the useful parts up front.</p>
            </div>
            <div className="trust-grid">
              <article className="trust-card trust-card-lime reveal">
                <span className="trust-number">01</span>
                <span className="trust-icon" aria-hidden="true">✓</span>
                <h3>Verified vehicles</h3>
                <p>Drivers add a verified private vehicle before they publish a ride.</p>
              </article>
              <article className="trust-card trust-card-white reveal reveal-delay-1">
                <span className="trust-number">02</span>
                <span className="trust-icon" aria-hidden="true">↔</span>
                <h3>Clear booking</h3>
                <p>See open seats, price per seat, and booking type before you choose.</p>
              </article>
              <article className="trust-card trust-card-blue reveal reveal-delay-2">
                <span className="trust-number">03</span>
                <span className="trust-icon" aria-hidden="true">+</span>
                <h3>Safety when needed</h3>
                <p>Add an emergency contact and keep key trip details close.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="route-planner section-cream">
          <div className="container planner-layout reveal">
            <div>
              <p className="eyebrow eyebrow-dark">Start with a route</p>
              <h2>Less waiting.<br /><span>More going.</span></h2>
            </div>
            <div className="planner-card" aria-label="Example route search">
              <div className="planner-field">
                <span>From</span>
                <strong>Chennai</strong>
                <small>Tamil Nadu</small>
              </div>
              <div className="planner-arrow" aria-hidden="true">→</div>
              <div className="planner-field">
                <span>To</span>
                <strong>Pondicherry</strong>
                <small>East coast</small>
              </div>
              <a className="planner-button" href="#download" aria-label="Search routes in the Flux Go app">Search routes <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>

        <section className="section section-cream" id="how-it-works">
          <div className="container">
            <div className="section-heading reveal">
              <div>
                <p className="eyebrow eyebrow-dark">How it works</p>
                <h2>A clear plan for<br /><span>every trip.</span></h2>
              </div>
              <p>Use one app for both sides of the ride. Find a seat, or fill the ones you have.</p>
            </div>

            <div className="process-grid">
              <article className="process-card process-card-lime reveal">
                <div className="card-topline"><span>01</span><span className="card-arrow" aria-hidden="true">↗</span></div>
                <div className="process-art-wrap">
                  <Image src="/assets/find-ride.png" alt="3D route marker for finding a ride" width={1254} height={1254} loading="lazy" />
                </div>
                <h3>Find a ride</h3>
                <p>Choose your route, date, and seats. Compare rides by time, price, and booking type.</p>
                <a className="text-link" href="#download">See the route <span aria-hidden="true">→</span></a>
              </article>

              <article className="process-card process-card-coral reveal reveal-delay-1">
                <div className="card-topline"><span>02</span><span className="card-arrow" aria-hidden="true">↗</span></div>
                <div className="process-art-wrap">
                  <Image src="/assets/offer-ride.png" alt="3D car for offering a ride" width={1254} height={1254} loading="lazy" />
                </div>
                <h3>Offer a ride</h3>
                <p>Set your route, seats, luggage space, and price. Keep the plan visible from publish to arrival.</p>
                <a className="text-link" href="#for-drivers">Share your seats <span aria-hidden="true">→</span></a>
              </article>

              <article className="process-card process-card-ink reveal reveal-delay-2">
                <div className="card-topline"><span>03</span><span className="card-arrow" aria-hidden="true">↗</span></div>
                <div className="mini-trip-ui" aria-hidden="true">
                  <div className="mini-trip-head"><span>Trip details</span><span className="mini-live">Live</span></div>
                  <div className="mini-trip-route"><span className="mini-pin" /><span /><span className="mini-pin mini-pin-end" /></div>
                  <div className="mini-trip-cities"><strong>BLR</strong><strong>HYD</strong></div>
                  <div className="mini-trip-footer"><span>3 seats</span><span>₹650 / seat</span></div>
                </div>
                <h3>Ride with context</h3>
                <p>See trip details, rider notes, and next steps when they matter.</p>
                <a className="text-link text-link-light" href="#download">Keep moving <span aria-hidden="true">→</span></a>
              </article>
            </div>
          </div>
        </section>

        <section className="driver-section" id="for-drivers">
          <div className="container driver-grid">
            <div className="driver-visual reveal">
              <div className="driver-visual-top"><span>Your route</span><span>01 / 03</span></div>
              <div className="driver-map" aria-hidden="true">
                <div className="map-grid-lines" />
                <div className="map-route" />
                <span className="map-pin map-pin-a">A</span>
                <span className="map-pin map-pin-b">B</span>
                <span className="map-road-label map-road-one">NH 44</span>
                <span className="map-road-label map-road-two">Your way</span>
              </div>
              <div className="driver-route-card">
                <div><small>Leaving from</small><strong>Bengaluru</strong></div>
                <span aria-hidden="true">→</span>
                <div><small>Heading to</small><strong>Hyderabad</strong></div>
              </div>
            </div>

            <div className="driver-copy reveal reveal-delay-1">
              <p className="eyebrow eyebrow-dark">For drivers</p>
              <h2>Turn an empty seat into a <span>shared route.</span></h2>
              <div className="driver-proof"><span aria-hidden="true">✓</span><strong>Private vehicles are checked before a ride is published.</strong></div>
              <p className="body-large">Publish a ride with the details people need. Set your route, date, time, seats, luggage, and price.</p>
              <div className="driver-list">
                <div className="driver-list-row"><span>01</span><div><strong>Set the plan</strong><p>Choose the route and departure time.</p></div></div>
                <div className="driver-list-row"><span>02</span><div><strong>Choose the fit</strong><p>Set seats, luggage space, and booking type.</p></div></div>
                <div className="driver-list-row"><span>03</span><div><strong>Meet on the way</strong><p>Keep trip details close until you arrive.</p></div></div>
              </div>
              <a className="button button-dark" href="#download">Offer a ride <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>

        <section className="details-section section-dark">
          <div className="container details-grid">
            <div className="details-intro reveal">
              <p className="eyebrow"><span className="eyebrow-dot" />Made for the in-between</p>
              <h2>Trust, step<br /><span>by step.</span></h2>
              <p>Good trips feel simple because the important parts are clear before you start.</p>
            </div>
            <div className="detail-items">
              <div className="detail-item reveal reveal-delay-1">
                <span className="detail-number">01</span>
                <div><h3>See the full trip</h3><p>Review route, time, seats, luggage, and fare in one place.</p></div>
                <span className="detail-mark" aria-hidden="true">↗</span>
              </div>
              <div className="detail-item reveal reveal-delay-2">
                <span className="detail-number">02</span>
                <div><h3>Choose how it starts</h3><p>Use Instant book or Request to book.</p></div>
                <span className="detail-mark" aria-hidden="true">↗</span>
              </div>
              <div className="detail-item reveal reveal-delay-3">
                <span className="detail-number">03</span>
                <div><h3>Keep safety close</h3><p>Add an emergency contact before your first ride.</p></div>
                <span className="detail-mark" aria-hidden="true">↗</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-cream questions" id="questions">
          <div className="container questions-grid">
            <div className="questions-intro reveal">
              <p className="eyebrow eyebrow-dark">Questions, answered</p>
              <h2>Keep the fine print <span>simple.</span></h2>
              <p>Read the basics before you plan your next road.</p>
            </div>
            <div className="faq-list reveal reveal-delay-1">
              <details open>
                <summary>Is Flux Go a taxi service?<span aria-hidden="true">+</span></summary>
                <p>No. Flux Go helps people share intercity car rides. A driver publishes spare seats, and a passenger books them.</p>
              </details>
              <details>
                <summary>Can I find a ride and offer one?<span aria-hidden="true">+</span></summary>
                <p>Yes. One Flux Go account supports both jobs. Choose the action that fits the trip you want to make.</p>
              </details>
              <details>
                <summary>What can I set before I publish?<span aria-hidden="true">+</span></summary>
                <p>Set your route, date, time, passenger seats, luggage allowance, price per seat, and booking type.</p>
              </details>
              <details>
                <summary>How does Flux Go support safer trips?<span aria-hidden="true">+</span></summary>
                <p>Drivers add a verified private vehicle before publishing. Everyone can see the route, seats, luggage, price, and booking type before choosing.</p>
              </details>
              <details>
                <summary>Where will I get the app?<span aria-hidden="true">+</span></summary>
                <p>App Store and Google Play links will appear here when the public release is ready.</p>
              </details>
            </div>
          </div>
        </section>

        <section className="download-section" id="download">
          <div className="container download-card reveal">
            <div className="download-copy">
              <p className="eyebrow"><span className="eyebrow-dot" />Ready when you are</p>
              <h2>Take the next road <span>together.</span></h2>
              <p>Bring your route. Bring your spare seat. Flux Go is made for the distance between cities.</p>
              <div className="store-buttons">
                <a className="store-button" href="#download" aria-label="App Store link coming soon">
                  <span className="store-icon" aria-hidden="true"></span><span><small>Coming soon on</small><strong>App Store</strong></span>
                </a>
                <a className="store-button" href="#download" aria-label="Google Play link coming soon">
                  <span className="store-icon store-icon-play" aria-hidden="true">▶</span><span><small>Coming soon on</small><strong>Google Play</strong></span>
                </a>
              </div>
              <p className="download-note">App links will be added here.</p>
            </div>
            <div className="download-route" aria-hidden="true">
              <div className="download-route-label label-a"><span>A</span>Start here</div>
              <div className="download-route-line"><i /><i /><i /><i /></div>
              <div className="download-route-label label-b"><span>B</span>Keep going</div>
              <div className="download-city city-a">Bengaluru</div>
              <div className="download-city city-b">Hyderabad</div>
              <div className="download-stamp">FLUX<br /><strong>GO</strong></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-top">
          <a className="brand brand-footer" href="#top" aria-label="Flux Go home">
            <span className="brand-glyph" aria-hidden="true"><i /><i /></span>
            <span className="brand-name">Flux <em>Go</em></span>
          </a>
          <p>Reliable road sharing between cities.</p>
          <a className="footer-up" href="#top">Back to top <span aria-hidden="true">↑</span></a>
        </div>
        <div className="container footer-bottom">
          <span>© {year} Flux Go</span>
          <span>fluxgo.in</span>
          <span>Made for the road ahead.</span>
        </div>
      </footer>
    </>
  );
}
