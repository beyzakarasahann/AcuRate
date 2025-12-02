'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function NotFoundPage() {
  const router = useRouter();
  const { isDark, mounted, themeClasses } = useThemeColors();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const backgroundClass = themeClasses.background;
  const textColorClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextColorClass = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundClass} relative overflow-hidden flex items-center justify-center p-4 transition-colors duration-500`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-gray-500/10' : 'bg-gray-300/20'}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        <motion.h1
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`text-9xl font-bold mb-4 ${textColorClass}`}
        >
          404
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`text-xl mb-8 ${mutedTextColorClass}`}
        >
          Page not found
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/')}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            isDark
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          <Home className="w-5 h-5" />
          Go Home
        </motion.button>
      </motion.div>
    </div>
  );
}


