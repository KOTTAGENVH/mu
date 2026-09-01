import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function NotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}