import './globals.css';

export const metadata = {
  title: 'Unlock & Co Council',
  description: 'Unlock & Co Council',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
