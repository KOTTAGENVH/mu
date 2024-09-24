"use client";
import { useEffect, useState } from "react";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyDesktop = window.innerWidth > 1000;

      if (isDesktop !== isCurrentlyDesktop) {
        setIsDesktop(isCurrentlyDesktop);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isDesktop]);

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
        {isDesktop && (
          <Script
            src={process.env.NEXT_PUBLIC_ADSTERRA_SRC}
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  );
}
