import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Little Note — a quiet place to think",
  description: "A simple, private notepad for everything you want to remember.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
