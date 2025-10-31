// src/hooks/useThemeColors.ts

import { useTheme } from "next-themes";
import { useState, useEffect } from "react"; // 👈 YENİ: useState ve useEffect import edildi

/**
 * Uygulamanın merkezi renk paletini ve tema durumunu sağlar.
 */
export function useThemeColors() {
  const { theme, resolvedTheme } = useTheme();
  
  // 1. Mounted durumu eklendi
  const [mounted, setMounted] = useState(false); 

  useEffect(() => {
    // Component client tarafında yüklendiğinde (mount edildiğinde) true olur.
    setMounted(true); 
  }, []);

  const isDark = resolvedTheme === "dark";

  // Renk hesaplamaları (Öncekiyle aynı, sadece mounted geri döndürülecek)
  const ACCENT_GRADIENT_START = isDark ? "#4F46E5" : "#4F46E5"; // indigo-600
  const ACCENT_GRADIENT_END = isDark ? "#9333EA" : "#9333EA";   // purple-600

  const TEXT_COLOR = isDark ? "#FFFFFF" : "#1F2937";       
  const MUTED_TEXT_COLOR = isDark ? "#9CA3AF" : "#6B7280"; 
  const CARD_BG = isDark ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF"; 
  const INPUT_BG = isDark ? "rgba(255, 255, 255, 0.05)" : "#F3F4F6"; 
  const ERROR_BORDER = isDark ? "#DC2626" : "#F87171";

  return {
    isDark,
    mounted, // 👈 Geri döndürülüyor
    // Temel Palet
    text: TEXT_COLOR,
    mutedText: MUTED_TEXT_COLOR,
    cardBg: CARD_BG,
    inputBg: INPUT_BG,
    errorBorder: ERROR_BORDER,
    // Vurgu Gradientleri
    accentStart: ACCENT_GRADIENT_START,
    accentEnd: ACCENT_GRADIENT_END,
    accentGradientClass: `from-indigo-600 to-purple-600`, 
    // Tema Sınıfları
    themeClasses: {
        background: isDark ? 'from-slate-950 via-blue-950 to-slate-950' : 'from-gray-50 via-white to-gray-100',
        card: isDark ? 'bg-white/5 border border-white/10' : 'bg-white/70 border border-gray-200 shadow-xl',
        inputFocus: isDark ? 'focus:bg-white/10' : 'focus:bg-white'
    }
  };
}