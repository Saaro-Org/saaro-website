'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SupportPage() {
  const [menuOpen, setMenuOpen] = useState(false);

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
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="site-header" id="top">
        <div className="container nav-wrap">
          <Link className="brand" href="/" aria-label="Flux Go home">
            <span className="brand-glyph" aria-hidden="true"><i /><i /></span>
            <span className="brand-name">Flux <em>Go</em></span>
          </Link>

          <nav className="primary-nav" aria-label="Primary navigation">
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#for-drivers">For drivers</Link>
            <Link href="/#trust">Trust &amp; safety</Link>
            <Link href="/support" aria-current="page">Support</Link>
          </nav>

          <Link className="nav-cta" href="#support-request">Get help <span aria-hidden="true">↗</span></Link>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="support-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span className="menu-line" />
            <span className="menu-line" />
          </button>
        </div>

        <div className="mobile-menu" id="support-mobile-menu" hidden={!menuOpen}>
          <nav aria-label="Mobile navigation">
            <Link href="/#how-it-works" onClick={closeMenu}>How it works <span aria-hidden="true">↘</span></Link>
            <Link href="/#for-drivers" onClick={closeMenu}>For drivers <span aria-hidden="true">↘</span></Link>
            <Link href="/#trust" onClick={closeMenu}>Trust &amp; safety <span aria-hidden="true">↘</span></Link>
            <Link href="/support" onClick={closeMenu}>Support <span aria-hidden="true">↗</span></Link>
            <Link className="mobile-menu-cta" href="#support-request" onClick={closeMenu}>Get help <span aria-hidden="true">↗</span></Link>
          </nav>
        </div>
      </header>

      <main className="support-page" id="main-content">
        <section className="support-hero section-dark">
          <div className="container support-hero-grid">
            <div className="support-hero-copy">
              <p className="eyebrow"><span className="eyebrow-dot" />Flux Go support</p>
              <h1>Good help starts with a clear next step.</h1>
              <p className="support-hero-lede">
                Find direct answers about trips, bookings, driving, accounts, and safety.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#help-topics">Find an answer <span aria-hidden="true">↓</span></a>
                <Link className="button button-text" href="/">Back to home <span aria-hidden="true">↗</span></Link>
              </div>
            </div>

            <div className="support-guide" aria-label="Flux Go support guide">
              <div className="support-guide-head"><span>Support guide</span><span>01 / 04</span></div>
              <div className="support-guide-item">
                <span className="support-guide-number">01</span>
                <div><strong>Pick a topic</strong><small>Booking, driving, account, or safety.</small></div>
                <span className="support-guide-mark" aria-hidden="true">↘</span>
              </div>
              <div className="support-guide-item">
                <span className="support-guide-number">02</span>
                <div><strong>Check the facts</strong><small>Use your route, date, and booking details.</small></div>
                <span className="support-guide-mark" aria-hidden="true">↘</span>
              </div>
              <div className="support-guide-item">
                <span className="support-guide-number">03</span>
                <div><strong>Stay safe</strong><small>Move to a safe place when something feels wrong.</small></div>
                <span className="support-guide-mark" aria-hidden="true">↘</span>
              </div>
              <div className="support-guide-item">
                <span className="support-guide-number">04</span>
                <div><strong>Send a clear note</strong><small>Include the trip details that support needs.</small></div>
                <span className="support-guide-mark" aria-hidden="true">↗</span>
              </div>
            </div>
          </div>

          <div className="support-marquee" aria-label="Support principles">
            <div className="marquee-track">
              <span>Clear answers</span><b>✦</b><span>Safer trips</span><b>✦</b><span>Useful context</span><b>✦</b>
              <span>Clear answers</span><b>✦</b><span>Safer trips</span><b>✦</b><span>Useful context</span><b>✦</b>
            </div>
          </div>
        </section>

        <section className="support-topics section-cream" id="help-topics">
          <div className="container">
            <div className="support-section-heading">
              <div>
                <p className="eyebrow eyebrow-dark">Choose a topic</p>
                <h2>Start with the part<br /><span>you need.</span></h2>
              </div>
              <p>Use the topic that matches your question. Keep the trip details close.</p>
            </div>

            <div className="support-topic-grid">
              <article className="support-topic-card support-topic-card-lime">
                <span className="support-topic-number">01</span>
                <span className="support-topic-icon" aria-hidden="true">↔</span>
                <h3>Booking help</h3>
                <p>Find, request, confirm, change, or cancel a seat with clear trip details.</p>
                <a className="text-link" href="#questions">Read booking answers <span aria-hidden="true">→</span></a>
              </article>
              <article className="support-topic-card support-topic-card-white">
                <span className="support-topic-number">02</span>
                <span className="support-topic-icon" aria-hidden="true">→</span>
                <h3>Driver help</h3>
                <p>Set a route, verify a vehicle, publish seats, and keep riders informed.</p>
                <a className="text-link" href="#questions">Read driver answers <span aria-hidden="true">→</span></a>
              </article>
              <article className="support-topic-card support-topic-card-blue">
                <span className="support-topic-number">03</span>
                <span className="support-topic-icon" aria-hidden="true">✓</span>
                <h3>Safety and trust</h3>
                <p>Review the checks and steps that help you make a safer choice.</p>
                <a className="text-link" href="#safety">See safety steps <span aria-hidden="true">→</span></a>
              </article>
              <article className="support-topic-card support-topic-card-coral">
                <span className="support-topic-number">04</span>
                <span className="support-topic-icon" aria-hidden="true">+</span>
                <h3>Account help</h3>
                <p>Get guidance for profile details, access, privacy requests, and reports.</p>
                <a className="text-link" href="#support-request">Contact support <span aria-hidden="true">→</span></a>
              </article>
            </div>
          </div>
        </section>

        <section className="support-safety" id="safety">
          <div className="container support-safety-card">
            <div>
              <p className="eyebrow eyebrow-dark">Safety first</p>
              <h2>If something feels wrong, stop and get help.</h2>
            </div>
            <p>Move to a safe public place. Contact local emergency services when there is immediate danger. Report the trip when you can.</p>
            <a className="button button-dark" href="#support-request">See how to report <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="support-questions section section-cream" id="questions">
          <div className="container support-questions-grid">
            <div className="support-section-heading support-questions-intro">
              <div>
                <p className="eyebrow eyebrow-dark">Common questions</p>
                <h2>Keep the answer<br /><span>close.</span></h2>
              </div>
              <p>Read the basics before you ask for help.</p>
            </div>
            <div className="faq-list support-faq-list">
              <details open>
                <summary>How do I change or cancel a booking?<span aria-hidden="true">+</span></summary>
                <p>Open the trip in the Flux Go app and follow the change or cancel action shown for that booking. Check the result before you leave the screen.</p>
              </details>
              <details>
                <summary>What should I check before I enter a car?<span aria-hidden="true">+</span></summary>
                <p>Check the driver, vehicle, route, and pickup details in the app. If the details do not match, do not enter the car.</p>
              </details>
              <details>
                <summary>How do I report an unsafe experience?<span aria-hidden="true">+</span></summary>
                <p>Move to a safe place first. Then use in-app Help &amp; Support or email support@fluxgo.in with the trip route, date, and a clear description.</p>
              </details>
              <details>
                <summary>What details should I include in a support request?<span aria-hidden="true">+</span></summary>
                <p>Include your account mobile number, trip route, date, booking reference, and the action that you need. Never send passwords, one-time codes, or payment credentials.</p>
              </details>
              <details>
                <summary>How do I request a privacy or account change?<span aria-hidden="true">+</span></summary>
                <p>Open Profile → Help &amp; Support in the app and write “Privacy request” in the subject. You can also email support@fluxgo.in.</p>
              </details>
            </div>
          </div>
        </section>

        <section className="support-request section-dark" id="support-request">
          <div className="container support-request-grid">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" />Need more help?</p>
              <h2>Send a clear note. We will start with the facts.</h2>
              <p className="support-request-lede">Use the app for account-specific support, or email support@fluxgo.in with your trip details.</p>
              <div className="support-request-actions">
                <a className="button button-primary" href="mailto:support@fluxgo.in">Email support <span aria-hidden="true">↗</span></a>
                <Link className="button button-text" href="/privacy-terms">Read privacy and terms <span aria-hidden="true">↗</span></Link>
              </div>
            </div>
            <div className="support-request-checklist">
              <div className="support-checklist-head"><span>Before you send</span><span>03 / 03</span></div>
              <div><span>01</span><p>Write the trip route and date.</p></div>
              <div><span>02</span><p>Add the booking reference if you have one.</p></div>
              <div><span>03</span><p>Leave out passwords, codes, and payment details.</p></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer support-footer">
        <div className="container footer-top">
          <Link className="brand brand-footer" href="/" aria-label="Flux Go home">
            <span className="brand-glyph" aria-hidden="true"><i /><i /></span>
            <span className="brand-name">Flux <em>Go</em></span>
          </Link>
          <p>Reliable road sharing between cities.</p>
          <Link className="footer-up" href="#top">Back to top <span aria-hidden="true">↑</span></Link>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Flux Go</span>
          <Link href="/privacy-terms">Privacy &amp; terms</Link>
          <span>fluxgo.in</span>
        </div>
      </footer>
    </>
  );
}
