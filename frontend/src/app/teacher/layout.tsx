// app/teacher/layout.tsx
'use client'; 

// Gerekli import'lar
import Sidebar2 from '@/components/navigation/Sidebar2';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useEffect, useState } from 'react';

// TeacherLayout, altındaki tüm sayfa (page.tsx) bileşenlerini çocuk (children) olarak alır.
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    
    // useThemeColors hook'u ile dinamik tema sınıflarını alıyoruz
    const { 
        mounted: themeMounted, 
        themeClasses, 
        isDark 
    } = useThemeColors();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Yüklenme anı kontrolü (tema uyuşmazlığını önler)
    if (!mounted || !themeMounted) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-white text-xl">Loading Teacher Portal...</div>
            </div>
        );
    }

    return (
        // Ana Kapsayıcı: Sidebar ve İçerik yan yana (flex)
        <div className={`min-h-screen flex bg-gradient-to-br ${themeClasses.background} relative overflow-hidden`}>
            
            {/* 1. Sidebar (Sol Menü) */}
            <Sidebar2 />

            {/* 2. Ana İçerik Alanı */}
            <main 
                // Sidebar'ın genişlemesine uyum sağlaması için margin-left kullanmıyoruz, 
                // bunun yerine 'flex-1' ile ekranın geri kalanını kaplamasını sağlıyoruz.
                className="flex-1 relative z-10 p-8 transition-all duration-300 overflow-x-hidden"
            >
                {/* children, buraya /teacher/page.tsx, /teacher/analytics/page.tsx vb. içeriğini render edecektir. */}
                {children} 
            </main>
        </div>
    );
}

