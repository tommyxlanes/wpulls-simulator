import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "W-Pulls Pack Simulator",
  description:
    "Monte Carlo simulator for V3 flat-odds pack economics. Test pull rates, sourcing skew, and buyback dynamics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative z-10">{children}</body>
    </html>
  );
}
