import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/contextApi/iframContext";
import { CurrentPlayProvider } from "@/contextApi/currentPlay";
import { ModalProvider } from "@/contextApi/modalOpen";
import { PlayContextProvider } from "@/contextApi/toPlay";

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
        {/* Ban inspect elements */}
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener("contextmenu", function(event) {
                event.preventDefault();
                alert("Inspect Elements Not Allowed!");
              });
            `,
          }}
        /> */}
        <ModalProvider>
          <CurrentPlayProvider>
            <PlayContextProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </PlayContextProvider>
          </CurrentPlayProvider>
        </ModalProvider>
        <Script
          src={process.env.NEXT_PUBLIC_ADSTERRA_SRC}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
