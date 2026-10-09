import { Inter, IBM_Plex_Mono } from 'next/font/google';
import './admin.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'Admin | Fluxgo',
  description: 'Fluxgo operations console.',
  robots: { index: false, follow: false },
  applicationName: 'Fluxgo Admin',
  // A Home Screen install needs this manifest. Web push on iPhone works only in an installed app.
  manifest: '/admin/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Fluxgo Admin', statusBarStyle: 'default' },
  icons: { apple: '/admin/apple-touch-icon.png' },
  itunes: null,
};

export const viewport = {
  themeColor: '#102A1B',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function AdminPortalLayout({ children }) {
  return <div className={`admin-root ${inter.variable} ${plexMono.variable}`}>{children}</div>;
}
