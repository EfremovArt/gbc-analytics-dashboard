import type { Metadata } from "next";
import { Inter } from "next/font/google";

import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"]
});

export const metadata: Metadata = {
  title: "GBC Analytics Dashboard",
  description: "Мини-дашборд заказов из RetailCRM и Supabase"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
