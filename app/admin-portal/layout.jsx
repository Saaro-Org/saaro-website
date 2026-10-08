import { Inter, IBM_Plex_Mono } from 'next/font/google';
import './admin.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'Admin | Fluxgo',
  description: 'Fluxgo operations console.',
  robots: { index: false, follow: false },
};

export default function AdminPortalLayout({ children }) {
  return <div className={`admin-root ${inter.variable} ${plexMono.variable}`}>{children}</div>;
}
