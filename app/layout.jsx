export const metadata = {
  metadataBase: new URL('https://www.fluxgo.in'),
  title: 'Fluxgo — Intercity carpooling in India',
  description: 'Find a seat in a car already going to your city, or share the empty seats in yours. Fluxgo is intercity carpooling for India.',
  applicationName: 'Fluxgo',
  keywords: ['intercity carpooling', 'carpool India', 'ride sharing between cities', 'Fluxgo'],
  openGraph: {
    title: 'Fluxgo — Someone is already going your way',
    description: 'Find a seat or share yours on intercity rides across India.',
    url: 'https://www.fluxgo.in',
    siteName: 'Fluxgo',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fluxgo — Someone is already going your way',
    description: 'Find a seat or share yours on intercity rides across India.'
  },
  itunes: {
    appId: '6814678664'
  }
};

export const viewport = {
  themeColor: '#102A1B'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
