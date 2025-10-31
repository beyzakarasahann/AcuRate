'use client';

import { useThemeColors } from '@/hooks/useThemeColors';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

export default function Footer() {
  const { isDark, mounted } = useThemeColors();
  
  // Hover color already works well (indigo tones).
  const hoverColorClass = isDark ? 'hover:text-indigo-400' : 'hover:text-indigo-600';
  
  // ✨ UPDATE: Match the logo accent color with the Login page theme.
  // Instead of blue, use purple/indigo tones.
  const logoAccentColor = isDark ? 'text-purple-400' : 'text-indigo-600';

  if (!mounted) return null;

  return (
    <footer 
      // Background made deeper in dark mode and softer in light mode.
      className="w-full border-t border-slate-200 dark:border-slate-800 
                 bg-white/70 dark:bg-slate-950 backdrop-blur-md 
                 text-slate-700 dark:text-slate-300 mt-20"
    >
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10">
        
        {/* 1️⃣ AcuRate Header (Logo Accent Now Indigo/Purple) */}
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {/* ✨ UPDATE: Logo accent color switched to purple/indigo tone */}
            <span className={logoAccentColor}>Acu</span>Rate
          </h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>About Us</a></li>
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Careers</a></li>
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Contact</a></li>
          </ul>
        </div>

        {/* 2️⃣ Other Columns */}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Support</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>FAQ</a></li>
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Live Chat</a></li>
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Refund Policy</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Services</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Data Analytics</a></li>
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Educational Institutions</a></li>
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Universities</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Privacy Policy</a></li>
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Terms of Service</a></li>
            <li><a href="#" className={`transition-colors ${hoverColorClass}`}>Cookie Policy</a></li>
          </ul>
        </div>

        {/* 3️⃣ Social Media */}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Social Media</h3>
          <p className="text-sm mb-4">Don’t miss our latest updates!</p>
          
          <div className="flex gap-4">
            {/* Icons get indigo/purple hover highlights */}
            <a href="#" className={`text-slate-500 dark:text-slate-400 transition-colors ${hoverColorClass}`}><Facebook className="w-5 h-5" /></a>
            <a href="#" className={`text-slate-500 dark:text-slate-400 transition-colors ${hoverColorClass}`}><Instagram className="w-5 h-5" /></a>
            <a href="#" className={`text-slate-500 dark:text-slate-400 transition-colors ${hoverColorClass}`}><Youtube className="w-5 h-5" /></a>
            <a href="#" className={`text-slate-500 dark:text-slate-400 transition-colors ${hoverColorClass}`}><Twitter className="w-5 h-5" /></a>
          </div>
        </div>
      </div>

      {/* 4️⃣ Bottom Section (Copyright Bar) */}
      <div className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className={`inline-block ${isDark ? 'text-white/60' : 'text-slate-600'}`} suppressHydrationWarning={true}>
          © {new Date().getFullYear()} <strong>AcuRate</strong>. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
