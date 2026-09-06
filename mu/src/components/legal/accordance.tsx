import { inter, roboto } from "@/app/fonts";
import { Section, sections } from "@/helper/legal/sections";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function AccordionSection({
  section,
  index,
}: {
  section: Section;
  index: number;
}) {
  const [open, setOpen] = useState(true);
  const panelId = `terms-panel-${section.number}`;

  return (
    <div
      className="rise border border-slate-400/50 dark:border-[#1e2130] rounded-2xl overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
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

      <div id={panelId} className="collapsible" data-open={open}>
        <div>
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
                    {item.text}
                    {item.link ? (
                      <>
                        <a
                          href={item.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-[#6c8fff] hover:text-purple-600 dark:hover:text-[#a78bfa] underline underline-offset-2 transition-colors duration-200"
                        >
                          {item.link.label}
                        </a>
                        {item.textAfter ?? ""}
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
