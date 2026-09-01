import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload",
};

export default function NotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}