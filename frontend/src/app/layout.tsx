import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pramax | AI-Powered Enterprise Engagement Platform",
  description: "Pramax offers engineering expertise coupled with state-of-the-art AI integration to help modern enterprises build automated environments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans min-h-screen bg-white text-gray-900 selection:bg-blue-500/20 overflow-x-hidden relative`}>
        {children}
      </body>
    </html>
  );
}
