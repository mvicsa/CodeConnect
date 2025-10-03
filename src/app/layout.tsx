import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Jost } from "next/font/google";
import "@/styles/globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Code Connect",
  description:
    "A platform for collaborative coding and learning together with friends. Share your code, learn from others. Join the community!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="alternate" hrefLang="en" href="/en" />
        <link rel="alternate" hrefLang="ar" href="/ar" />
      </head>
      <body className={`${ibmPlexSansArabic.variable} ${jost.variable}`}>
        {children}
      </body>
    </html>
  );
}
