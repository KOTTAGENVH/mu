import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/contextApi/iframContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MU-Audio",
  description: "Your Audio Player",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Script
          src={process.env.NEXT_PUBLIC_ADSTERRA_SRC}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
