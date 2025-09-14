import "./globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import OrientationGuard from "@/components/orientationGuard";

export const metadata: Metadata = {
  title: "MU-Audio",
  description: "Audio Player by Nowen Kottage",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <OrientationGuard />
          {children}
        </Providers>
      </body>
    </html>
  );
}
