import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConverSight Automation",
  description: "Run, request and manage ConverSight automations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
