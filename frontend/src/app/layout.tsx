import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Yeni oluşturduğunuz ThemeProvider'ı import edin
import { ThemeProvider } from "@/components/layout/ThemeProvider"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AcuRate - Academic Data Clarity", // Güncellenmiş başlık
  description: "Transforming academic data into clarity with data-driven insights.", // Güncellenmiş açıklama
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 2. HTML etiketine tema geçişlerinde hataları önlemek için suppressHydrationWarning eklenir
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 3. ThemeProvider ile çocuk bileşenlerini sarmalayın */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}