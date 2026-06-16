import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IRT Automations",
  description: "Run, request and manage ConverSight IRT automations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
