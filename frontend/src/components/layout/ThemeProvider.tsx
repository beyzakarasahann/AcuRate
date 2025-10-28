// components/layout/ThemeProvider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

// TypeScript props tanımı
interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // attribute="class"
  // Bu ayar, next-themes'in karanlık modu etkinleştirmek için 
  // <html> etiketine "dark" sınıfını eklemesini sağlar. 
  // Tailwind CSS dark mode bu sınıfa bakar.
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system" // Varsayılan olarak kullanıcının sistem ayarını kullan
      enableSystem // Sistem tercihini etkinleştir
      disableTransitionOnChange // Tema değişimi sırasında geçişleri devre dışı bırak
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}