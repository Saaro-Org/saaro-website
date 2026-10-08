import Link from 'next/link';
import Wordmark from './Wordmark';
import { APP_STORE_URL, SUPPORT_EMAIL, WEB_APP_URL } from './links';

export default function SiteFooter() {
  return (
    <footer className="fx-footer">
      <div className="fx-wrap fx-footer-grid">
        <div className="fx-footer-lead">
          <p className="fx-footer-line">Between cities, together.</p>
          <a className="fx-footer-mail" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </div>
        <nav className="fx-footer-col" aria-label="Product">
          <span className="fx-mono">Ride</span>
          <Link href="/#find">Find a ride</Link>
          <Link href="/#trust">Safety</Link>
          <Link href="/#offer">Offer a ride</Link>
        </nav>
        <nav className="fx-footer-col" aria-label="Get Fluxgo">
          <span className="fx-mono">Get Fluxgo</span>
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">iPhone</a>
          <a href={WEB_APP_URL} target="_blank" rel="noopener noreferrer">Web app</a>
          <span className="fx-footer-muted">Android — soon</span>
        </nav>
        <nav className="fx-footer-col" aria-label="Company">
          <span className="fx-mono">Help</span>
          <Link href="/support">Support</Link>
          <Link href="/privacy-terms#privacy-policy">Privacy</Link>
          <Link href="/privacy-terms#terms-and-conditions">Terms</Link>
        </nav>
      </div>
      <div className="fx-wrap fx-footer-base">
        <span>© {new Date().getFullYear()} Fluxgo</span>
        <span>Made in India, for the road between cities.</span>
      </div>
      <div className="fx-footer-mark" aria-hidden="true"><Wordmark /></div>
    </footer>
  );
}
