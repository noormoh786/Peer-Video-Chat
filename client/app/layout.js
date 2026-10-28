import './globals.css';

export const metadata = {
  title: 'Noor Video Chat',
  description: 'A peer-to-peer video calling app that runs in the browser.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#07080d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
