"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

// ✨ TEMA ENTEGRASYONU: Renk hook'unu import ediyoruz
import { useThemeColors } from '@/hooks/useThemeColors'; 

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  
  // 1. Hook'tan gerekli tema bilgilerini alıyoruz
  const { isDark, mounted, accentGradientClass } = useThemeColors();
  
  // Footer'daki gibi mor/indigo tonlarını kullanıyoruz
  const logoAccentColor = isDark ? 'text-purple-400' : 'text-indigo-600'; 
  const hoverColorClass = isDark ? 'hover:text-indigo-400' : 'hover:text-indigo-600';
  
  const [localMounted, setLocalMounted] = useState(false);
  useEffect(() => setLocalMounted(true), []);

  const finalMounted = mounted && localMounted;

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/60 shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2 font-extrabold text-2xl text-slate-800 dark:text-white tracking-tight"
        >
          {/* ✅ GÜNCELLEME: “AcuRate” birleşik ama iki renkli */}
          <span>
            <span className={logoAccentColor}>Acu</span>
            Rate
          </span>
        </Link>

        {/* NAV LINKS */}
        <div className="hidden md:flex items-center gap-8 text-slate-600 dark:text-slate-300 font-medium text-sm">
          <Link href="#about" className={`transition-colors ${hoverColorClass}`}>
            About
          </Link>
          <Link href="#features" className={`transition-colors ${hoverColorClass}`}>
            Features
          </Link>
          <Link href="#contact" className={`transition-colors ${hoverColorClass}`}>
            Contact
          </Link>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          {finalMounted && (
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>
          )}

          {/* Login */}
          <Link href="/auth/login">
            <Button
              variant="ghost"
              size="sm"
              className={`text-slate-700 dark:text-slate-300 ${hoverColorClass} font-medium transition-all`}
            >
              Login
            </Button>
          </Link>

          {/* Get Started (CTA) */}
          <Link href="/auth/signup">
            <Button
              size="sm"
              className={`bg-gradient-to-r ${accentGradientClass} hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-500/30 transition-all`}
            >
              Get Started →
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
