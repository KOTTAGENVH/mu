import "./globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import { inter } from "./fonts";

export const metadata: Metadata = {
  title: {
    template: "%s | MU Audio",
    default: "Mu Audio",
  },
  description: "Audio Player by Nowen Kottage",
  other: {
    "color-scheme": "light dark",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
