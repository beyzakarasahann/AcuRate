"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar"; 
import Footer from "@/components/layout/footer";
import { GraduationCap, BarChart3, Building2 } from "lucide-react";
import Link from "next/link";
import { ReactLenis } from "@studio-freight/react-lenis";
import { useRef, useState, useEffect } from "react"; // <-- 1. useState ve useEffect eklendi
import ParticlesContainer from "@/components/layout/ParticlesContainer";
import { ChartIllustration3D as ChartIllustration } from "@/components/ui/charts";

// ✨ YENİ: Merkezi tema renkleri hook'unu import ediyoruz
import { useThemeColors } from "@/hooks/useThemeColors"; 

// TypeScript Interface Tanımı
interface Feature {
  icon: JSX.Element;
  title: string;
  text: string;
}

// Lenis (smooth scroll) ayarları
const lenisOptions = {
  lerp: 0.08,
  duration: 1.5,
  smoothTouch: true,
};

export default function HomePage() {
  const mainRef = useRef(null);
  
  // 2. Client tarafında yüklendiğini kontrol eden state
  const [hasMounted, setHasMounted] = useState(false);

  // useEffect: Sadece bileşen tarayıcıda yüklendikten sonra (mount) hasMounted'ı true yapar.
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ✨ HOOK KULLANIMI: Tema renklerini alıyoruz
  const { 
    isDark, 
    themeClasses, 
    accentGradientClass, 
    accentStart,
    accentEnd 
  } = useThemeColors();

  // Parallax efekti için scroll verisini alıyoruz
  const { scrollYProgress } = useScroll({ target: mainRef });
  const yParallax = useTransform(scrollYProgress, [0, 1], ["0px", "200px"]);

  // Dinamik olarak değişen Blur rengi sınıfı
  const blurColorClass = isDark ? 'dark:bg-purple-900/20' : 'bg-indigo-200/50';
  
  // Feature Card Hover Gölge Stilleri (HEX kodlarına ihtiyacımız olduğu için dinamik stil)
  // 3. Hidrasyon hatasını önlemek için dinamik stilleri sadece 'mounted' ise hesapla.
  const featureStyles = hasMounted ? 
    { 
      '--shadow-color': isDark ? 'rgba(109,40,217,0.2)' : 'rgba(79,70,229,0.2)',
      '--shadow-x-y': '0_10px_45px_var(--shadow-color)',
      boxShadow: `0 10px 45px ${isDark ? 'rgba(109,40,217,0.2)' : 'rgba(79,70,229,0.2)'}`
    } as React.CSSProperties
    : 
    // Sunucu tarafında veya henüz mount edilmemişken boş bir stil nesnesi gönder.
    // Framer Motion'ın kendi initial/animate değerleri bu boş nesneyi override edecektir.
    {};


  return (
    <ReactLenis root options={lenisOptions}>
      <Navbar />

      <main
        ref={mainRef}
        // ✅ GÜNCELLEME 1: Arka plan gradient sınıfı hook'tan alındı.
        className={`relative flex flex-col items-center justify-start overflow-x-hidden 
                   bg-gradient-to-br ${themeClasses.background} 
                   text-center selection:bg-indigo-600/10 dark:selection:text-indigo-300 dark:text-white`}
      >
        {/* === BACKGROUND LAYERS === */}
        <ParticlesContainer />

        {/* Blur Circle (Parallax) */}
        <motion.div
          style={{ y: yParallax }}
          // ✅ GÜNCELLEME 2: Blur rengi, dinamik değişkene atandı.
          className={`absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[900px] 
                     ${blurColorClass} blur-[160px] rounded-full opacity-70 z-10`}
        />

        {/* === HERO SECTION (Giriş) === */}
        <section 
          className="relative z-20 w-full flex flex-col items-center justify-center 
                     min-h-[calc(100vh-80px)] py-28 md:py-36 px-6 max-w-7xl 
                     md:flex-row gap-16 md:gap-24 text-center md:text-left"
        >
          {/* TEXT BLOCK */}
          <div className="flex-1 max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight leading-snug"
            >
              Transforming{" "}
              {/* ✅ GÜNCELLEME 3: Ana başlık gradienti sabit kalabilir. */}
              <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Academic Data
              </span>{" "}
              into Clarity
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8 }}
              // ✅ GÜNCELLEME 4: Metin rengi sınıfları korundu, zaten dark/light uyumlu.
              className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto md:mx-0 mb-12 leading-relaxed"
            >
              AcuRate empowers institutions, teachers, and students to analyze,
              visualize, and improve academic performance — all through
              data-driven insights and elegant simplicity.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <Link href="/login">
                <Button
                  size="lg"
                  // ✅ GÜNCELLEME 5: Ana CTA butonu için gradient sınıfı hook'tan alındı.
                  className={`px-10 py-6 bg-gradient-to-r ${accentGradientClass} hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-base rounded-2xl shadow-lg shadow-indigo-600/30 transition-all`}
                >
                  Get Started →
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  // ✅ GÜNCELLEME 6: Outline butonu sınıfları korundu.
                  className="px-10 py-6 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-medium transition-all"
                >
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* ILLUSTRATION BLOCK */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="flex-1 flex justify-center md:justify-end max-w-lg w-full"
          >
            <div className="relative w-full max-w-[600px] h-[500px] overflow-hidden">
              <ChartIllustration />
            </div>
          </motion.div>
        </section>

        {/* --- */}
        {/* === FEATURES SECTION === */}
        <section
          id="features"
          className="relative z-20 py-32 px-8 max-w-6xl grid md:grid-cols-3 gap-10"
        >
          {(
            [
              {
                // ✅ GÜNCELLEME 7: İkon rengi korundu.
                icon: (
                  <GraduationCap className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-5" />
                ),
                title: "For Students",
                text: "Visualize your academic growth, track your performance, and receive personalized insights that help you excel.",
              },
              {
                icon: (
                  <BarChart3 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-5" />
                ),
                title: "For Teachers",
                text: "Capture results efficiently, identify patterns in student performance, and refine teaching methods with precision analytics.",
              },
              {
                icon: (
                  <Building2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-5" />
                ),
                title: "For Institutions",
                text: "Oversee outcomes across programs, enhance course effectiveness, and make strategic decisions backed by solid data.",
              },
            ] as Feature[]
          ).map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
              // 4. Hidrasyon güvenli stil: hasMounted kontrolü ile stil uygulandı
              style={featureStyles} 
              className="relative z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-left 
              shadow-xl 
              hover:-translate-y-2 transition-all duration-500" // Mevcut Tailwind gölge sınıfları korundu
            >
              <div 
                // ✅ GÜNCELLEME 9: Kart iç gradienti korundu.
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/5 to-purple-200/5 dark:from-indigo-900/5 dark:to-purple-950/5 pointer-events-none" 
              />
              {feature.icon}
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                {feature.text}
              </p>
            </motion.div>
          ))}
        </section>

        {/* --- */}
        {/* === CTA SECTION === */}
        <motion.section
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          // ✅ GÜNCELLEME 10: CTA arkaplanı için gradient sınıfı hook'tan alındı.
          className={`relative z-20 max-w-5xl text-center my-32 
                     bg-gradient-to-r ${accentGradientClass} text-white 
                     rounded-3xl shadow-2xl shadow-indigo-600/40 p-16`}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Start Measuring What Matters
          </h2>
          <p className="text-indigo-100 mb-8 text-lg max-w-2xl mx-auto">
            Bring transparency and intelligence to academic performance. AcuRate
            turns your data into actionable insights that drive success.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              // ✅ GÜNCELLEME 11: CTA butonu korundu.
              className="bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-semibold text-base px-10 py-5"
            >
              Launch Dashboard →
            </Button>
          </Link>
        </motion.section>

        <Footer />
      </main>
    </ReactLenis>
  );
}