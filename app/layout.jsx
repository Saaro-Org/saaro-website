import './globals.css';

export const metadata = {
  metadataBase: new URL('https://fluxgo.in'),
  title: 'Flux Go — Share the road between cities',
  description: 'Flux Go helps people find a ride or offer spare seats between Indian cities.',
  applicationName: 'Flux Go',
  keywords: ['intercity carpooling', 'shared rides', 'India', 'Flux Go'],
  openGraph: {
    title: 'Flux Go — Share the road between cities',
    description: 'Reliable intercity carpooling with clear trip details.',
    url: 'https://fluxgo.in',
    siteName: 'Flux Go',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flux Go — Share the road between cities',
    description: 'Reliable intercity carpooling with clear trip details.'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
