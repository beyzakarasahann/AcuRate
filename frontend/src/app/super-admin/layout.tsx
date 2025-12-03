'use client';

import { useEffect, useState } from 'react';
import SidebarSuperAdmin from '@/components/navigation/SidebarSuperAdmin';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { mounted: themeMounted, themeClasses } = useThemeColors();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !themeMounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-lg">
        Loading super admin portal...
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-gradient-to-br ${themeClasses.background} relative overflow-hidden`}>
      <SidebarSuperAdmin />
      <main className="flex-1 relative z-10 p-8 transition-all duration-300 overflow-x-hidden">{children}</main>
    </div>
  );
}






