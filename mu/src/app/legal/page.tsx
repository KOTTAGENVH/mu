"use client";
import { motion } from "framer-motion";
import Header from "@/components/header";
import React, { useState } from "react";
import LoginFooter from "@/components/login/loginFooter";
import { inter, roboto } from "../fonts";
import { ChevronDown } from "lucide-react";

export type Audio = {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
};

const sections = [
  {
    number: "01",
    title: "Introduction",
    items: [
      {
        label: "Ownership",
        text: 'Mu is created, owned, and operated by Nowen Kottage ("I," "me," or "my"). By using the Mu application ("the App" or "the Service"), you ("the User") agree to be bound by these Terms & Conditions.',
      },
      {
        label: "Acceptance of Terms",
        text: "If you do not agree with any part of these Terms & Conditions, please do not use the Mu application.",
      },
      {
        label: "Scope",
        text: "Mu is designed as a personal project for a better and pleasant audio listening experience. It is not intended for commercial use or redistribution of audio content.",
      },
    ],
  },
  {
    number: "02",
    title: "Intellectual Property",
    items: [
      {
        label: "Design & Code Rights",
        text: "All source code, interface design, and architecture for Mu are held by me, Nowen Kottage. Copying, distributing, or recreating the source code of Mu is strictly prohibited without explicit permission.",
      },
      {
        label: "Audio Content",
        text: "The audio tracks provided within the application are for demonstration purposes. I do not claim ownership of third-party musical compositions unless explicitly stated. If you are a copyright holder and believe your content is used improperly, please contact me for immediate removal.",
      },
      {
        label: "Third-Party Assets",
        text: "Icons and UI elements may utilize libraries such as Lucide React, Font Awesome. These assets remain the property of their respective creators.",
      },
    ],
  },
  {
    number: "03",
    title: "User Responsibilities",
    items: [
      {
        label: "Personal Use Only",
        text: "Mu is intended for personal, non-commercial use. Users must not use the application for public broadcasting or commercial audio distribution.",
      },
      {
        label: "Prohibited Actions",
        text: "You may not attempt to manipulate audio streams, or flood the server with requests (DDoS).",
      },
      {
        label: "Fair Usage",
        text: "While listening is free, excessive bandwidth usage via automated scripts or bots is prohibited to ensure service availability for all users.",
      },
    ],
  },
  {
    number: "04",
    title: "Privacy & Data Usage",
    items: [
      {
        label: "Data Storage",
        text: 'As of Mu version 3.0, user preferences (such as "Favorites") may be stored using local storage on your device or a secure database linked to your account.',
      },
      {
        label: "Cookies",
        text: "Essential cookies or local storage tokens are used strictly for authentication and maintaining your session state.",
      },
      {
        label: "Data Charges",
        text: "Streaming high-quality audio consumes data. Users are responsible for any data charges incurred from their network provider while using Mu.",
      },
    ],
  },
  {
    number: "05",
    title: "Compatibility & Testing",
    meta: "Last reviewed: Feb 2026",
    items: [
      {
        label: "Browser Support",
        text: "This application has been tested on the latest stable versions of Chrome, Safari, and Edge.",
      },
      {
        label: "Audio Playback",
        text: "Background audio playback behaviors may vary on mobile devices (iOS/Android) due to operating system restrictions on web browsers.",
      },
      {
        label: "Report Issues",
        text: "If you encounter playback errors or UI inconsistencies, please report them via the",
        link: {
          href: "https://www.nowenkottage.com/contactus",
          label: "contact page",
        },
        textAfter: "with details regarding your device and browser version.",
      },
    ],
  },
];

function AccordionSection({
  section,
  index,
}: {
  section: (typeof sections)[0];
  index: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="border border-slate-400/50 dark:border-[#1e2130] rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-6 py-5 bg-slate-100 dark:bg-[#0d0f18] hover:bg-slate-200 dark:hover:bg-[#111420] transition-colors duration-200 text-left group"
      >
        <span
          className="shrink-0 text-xs font-bold tracking-widest text-blue-600/70 dark:text-[#6c8fff]/60 font-mono"
          style={{ minWidth: "2rem" }}
        >
          {section.number}
        </span>

        <h2
          className={`${inter.className} flex-1 text-base md:text-lg font-semibold text-slate-900 dark:text-white`}
        >
          {section.title}
        </h2>

        {section.meta && (
          <span className="hidden md:block text-xs text-slate-500 dark:text-[#4b5563] italic mr-2">
            {section.meta}
          </span>
        )}

        <ChevronDown
          size={16}
          className={`text-slate-500 dark:text-[#4b5563] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 pt-2 bg-slate-100 dark:bg-[#0d0f18] space-y-4">
          {section.meta && (
            <p className="md:hidden text-xs text-slate-500 dark:text-[#4b5563] italic">
              {section.meta}
            </p>
          )}

          {section.items.map((item, i) => (
            <div key={i} className="flex gap-4 group/item">
              <div className="flex flex-col items-center pt-1.5">
                <div className="w-px flex-1 bg-gradient-to-b from-blue-600/30 dark:from-[#6c8fff]/30 to-transparent" />
              </div>

              <div className="pb-2">
                <p
                  className={`${roboto.className} text-sm font-semibold text-blue-600 dark:text-[#6c8fff] mb-1`}
                >
                  {item.label}
                </p>
                <p
                  className={`${roboto.className} text-sm text-slate-700 dark:text-[#9ca3af] leading-relaxed`}
                >
                  {"text" in item ? item.text : ""}
                  {"link" in item && item.link ? (
                    <>
                      {" "}
                      <a
                        href={item.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-[#6c8fff] hover:text-purple-600 dark:hover:text-[#a78bfa] underline underline-offset-2 transition-colors duration-200"
                      >
                        {item.link.label}
                      </a>{" "}
                      {item.textAfter ?? ""}
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Page() {
  return (
    <div
      className="
        min-h-screen w-full
        flex flex-col
        bg-slate-300 dark:bg-slate-950
        overflow-y-auto
        supports-[height:100dvh]:min-h-[100dvh]
        supports-[height:100svh]:min-h-[100svh]
      "
    >
      <Header />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-500/10 dark:bg-[#6c8fff]/4 blur-[140px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex-1 flex flex-col items-center py-16 mt-24 px-4 md:px-8"
      >
        <div className="w-full max-w-3xl">
          <div className="mb-12 flex flex-col gap-3">
            <h1
              className={`${inter.className} text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight`}
            >
              Terms &{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-[#6c8fff] dark:to-[#a78bfa] bg-clip-text text-transparent">
                Conditions
              </span>
            </h1>

            <p
              className={`${roboto.className} text-slate-600 dark:text-[#6b7280] text-sm md:text-base leading-relaxed max-w-xl`}
            >
              By accessing or using Mu by NowenKottage, you agree to comply with
              and be bound by the following terms. Please read carefully before
              using the app.
            </p>
          </div>
          <div className="space-y-3">
            {sections.map((section, i) => (
              <AccordionSection
                key={section.number}
                section={section}
                index={i}
              />
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className={`${roboto.className} mt-10 text-xs text-slate-500 dark:text-slate-400 text-center`}
          >
            Questions? Reach out via the{" "}
            <a
              href="https://www.nowenkottage.com/contactus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-[#6c8fff] hover:text-purple-600 dark:hover:text-[#a78bfa] transition-colors underline underline-offset-2"
            >
              contact page
            </a>
            .
          </motion.p>
        </div>
      </motion.div>
      <LoginFooter />
    </div>
  );
}

export default Page;
