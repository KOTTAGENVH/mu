"use client";
import Header from "@/components/header";
import LoginFooter from "@/components/login/loginFooter";
import { inter, roboto } from "../fonts";
import { AccordionSection } from "@/components/legal/accordance";
import { sections } from "@/helper/legal/sections";

export type Audio = {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
};

function Page() {
  return (
    <div
      className="
        min-h-screen w-full
        flex flex-col
        bg-slate-300 dark:bg-slate-950
        supports-[height:100dvh]:min-h-[100dvh]
        supports-[height:100svh]:min-h-[100svh]
      "
    >
      <Header />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-500/10 dark:bg-[#6c8fff]/4 blur-[140px]" />
      </div>
      <div className="relative flex-1 flex flex-col items-center py-16 mt-24 px-4 md:px-8">
        <div className="w-full max-w-3xl">
          <div className="rise mb-12 flex flex-col gap-3">
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
          <p
            className={`${roboto.className} rise mt-10 text-xs text-slate-500 dark:text-slate-400 text-center`}
            style={{ animationDelay: "600ms" }}
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
          </p>
        </div>
      </div>
      <LoginFooter />
    </div>
  );
}

export default Page;
