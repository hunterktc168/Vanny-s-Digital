import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Vanny's Peaceful Guesthouse Ops — 7-Day Marketing & Operations",
  description:
    "7-Day Digital Marketing & Operations Dashboard for Vanny's Peaceful Guesthouse in Toul Tom Pong, Phnom Penh.",
  openGraph: {
    title: "Vanny's Peaceful Guesthouse Ops",
    description:
      "7-Day Digital Marketing & Operations Dashboard for Vanny's Peaceful Guesthouse in Toul Tom Pong, Phnom Penh.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vanny's Peaceful Guesthouse Ops",
    description:
      "7-Day Digital Marketing & Operations Dashboard for Vanny's Peaceful Guesthouse in Toul Tom Pong, Phnom Penh.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased selection:bg-teal-100 selection:text-teal-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
