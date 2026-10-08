import { Inter, IBM_Plex_Mono } from 'next/font/google';
import './site.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export default function SiteLayout({ children }) {
  return <div className={`fx ${inter.variable} ${plexMono.variable}`}>{children}</div>;
}
