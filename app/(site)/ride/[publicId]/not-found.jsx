import Link from 'next/link';
import Wordmark from '../../_components/Wordmark';
import { WEB_APP_URL } from '../../_components/links';

export default function RideNotFound() {
  return (
    <main className="fx-share fx-share-empty">
      <header className="fx-share-top"><Link href="/" aria-label="Fluxgo home"><Wordmark /></Link></header>
      <section className="fx-share-sheet">
        <h1>We could not find this ride</h1>
        <p>Check the link, or find another ride in Fluxgo.</p>
        <a className="fx-share-btn" href={WEB_APP_URL}>Find a ride</a>
      </section>
    </main>
  );
}
