'use client';

import { useEffect, useState } from 'react';
import SidebarAdmin from '@/components/navigation/SidebarAdmin';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { mounted: themeMounted, themeClasses } = useThemeColors();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !themeMounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-lg">
        Loading admin portal...
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-gradient-to-br ${themeClasses.background} relative overflow-hidden`}>
      <SidebarAdmin />
      <main className="flex-1 relative z-10 p-8 transition-all duration-300 overflow-x-hidden">{children}</main>
    </div>
  );
}

