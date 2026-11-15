import type { Metadata } from "next";
import { Fraunces, Inter, Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel-src",
});

const body = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body-src",
});

const siteSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-site-serif-src",
});

const siteSans = Inter({
  subsets: ["latin"],
  variable: "--font-site-sans-src",
});

// The first screen is the fake coffee shop site; the title switches once the game launches.
export const metadata: Metadata = {
  title: "The Daily Bean | A little coffee. A better day.",
  description: "Small-batch coffee and fresh pastries on Maple Street.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${body.variable} ${siteSerif.variable} ${siteSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
