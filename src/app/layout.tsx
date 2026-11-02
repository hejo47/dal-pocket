import type { Metadata } from "next";

import { AppShell } from "@/components/pages/app-shell";
import { PocketProvider } from "@/components/providers/pocket-provider";

import "./globals.css";
import "@/styles/fonts.css";

export const metadata: Metadata = {
  title: "달주머니",
  description: "주간·월간 예산과 지출을 관리하는 용돈 기입장",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="font-body"><PocketProvider><AppShell>{children}</AppShell></PocketProvider></body>
    </html>
  );
}
