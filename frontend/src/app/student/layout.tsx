// app/student/layout.tsx
'use client'; 

// Gerekli import'lar
import Sidebar from '@/components/navigation/Sidebar'; // Sidebar'ın yolunu kontrol edin!
import { motion } from 'framer-motion';
import { useThemeColors } from '@/hooks/useThemeColors'; // useThemeColors kancasının yolunu kontrol edin!
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react'; // Tema butonu için ikon

// StudentLayout, altındaki tüm sayfa (page.tsx) bileşenlerini çocuk (children) olarak alır.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
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
                <div className="text-white text-xl">Loading Student Portal...</div>
            </div>
        );
    }

    // Next.js yönlendirmeleriyle çakışmaması için ana içeriği saracak Tailwind sınıfı
    // Sidebar'ın genişliği 64 (açık) veya 20 (kapalı) olduğu için, içerik soldan kaydırılmalıdır.
    // Ancak Sidebar zaten 'sticky top-0' ve 'w-64/w-20' olarak ayarlandığı için, 
    // main alanına sadece minimum bir padding/margin bırakmak yeterli olabilir. 
    // Sidebar'ın genişliği değişse bile 'children' alanı daima ekranın geri kalanını kaplar.

    return (
        // Ana Kapsayıcı: Sidebar ve İçerik yan yana (flex)
        <div className={`min-h-screen flex bg-gradient-to-br ${themeClasses.background} relative overflow-hidden`}>
            
            {/* 1. Sidebar (Sol Menü) */}
            <Sidebar />

            {/* 2. Ana İçerik Alanı */}
            <main 
                // Sidebar'ın genişlemesine uyum sağlaması için margin-left kullanmıyoruz, 
                // bunun yerine 'flex-1' ile ekranın geri kalanını kaplamasını sağlıyoruz.
                className="flex-1 relative z-10 p-8 transition-all duration-300 overflow-x-hidden"
            >
                {/* children, buraya /student/page.tsx, /student/courses/page.tsx vb. içeriğini render edecektir. */}
                {children} 
            </main>
        </div>
    );
}