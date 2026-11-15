import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
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

export const metadata: Metadata = {
  title: "CAPTCHA HELL",
  description: "Prove you're human. We dare you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
