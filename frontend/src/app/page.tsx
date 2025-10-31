"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { GraduationCap, BarChart3, Building2 } from "lucide-react";
import Link from "next/link";
import { ReactLenis } from "@studio-freight/react-lenis";
import { useRef } from "react";
import ParticlesContainer from "@/components/layout/ParticlesContainer";

// ✨ 3D Chart Illustrasyonumuzu içe aktarıyoruz
import { ChartIllustration3D as ChartIllustration } from "@/components/ui/charts"; 

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

  // Parallax efekti için scroll verisini alıyoruz
  const { scrollYProgress } = useScroll({ target: mainRef });
  const yParallax = useTransform(scrollYProgress, [0, 1], ["0px", "200px"]);

  return (
    <ReactLenis root options={lenisOptions}>
      <Navbar />

      <main
        ref={mainRef}
        // DÜZELTME: bg-gradient-to-br -> bg-linear-to-br
        className="relative flex flex-col items-center justify-start overflow-x-hidden bg-linear-to-br from-white via-slate-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-center selection:bg-blue-600/10 selection:text-blue-700"
      >
        {/* === BACKGROUND LAYERS === */}
        <ParticlesContainer />

        {/* Blur Circle (Parallax) */}
        <motion.div
          style={{ y: yParallax }}
          className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-blue-200/40 dark:bg-blue-900/20 blur-[160px] rounded-full opacity-70 z-10"
        />

        {/* === HERO SECTION (Giriş) === */}
        <section 
          className="relative z-20 w-full flex flex-col items-center justify-center 
                     min-h-[calc(100vh-80px)] py-28 md:py-36 px-6 max-w-7xl 
                     md:flex-row gap-16 md:gap-24 text-center md:text-left" // Dikey boşluklar (py-28/36) artırılarak Navbar'dan uzaklaştırıldı
        >
          {/* TEXT BLOCK */}
          <div className="flex-1 max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-snug"
            >
              Transforming{" "}
              <span className="text-blue-700 dark:text-blue-400">
                Academic Data
              </span>{" "}
              into Clarity
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8 }}
              className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto md:mx-0 mb-12 leading-relaxed"
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
                  className="px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  Get Started →
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
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
            <div className="relative w-full max-w-[600px] h-[500px] overflow-hidden"> {/* Genişlik ve yükseklik artırıldı */}
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
                icon: (
                  <GraduationCap className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-5" />
                ),
                title: "For Students",
                text: "Visualize your academic growth, track your performance, and receive personalized insights that help you excel.",
              },
              {
                icon: (
                  <BarChart3 className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-5" />
                ),
                title: "For Teachers",
                text: "Capture results efficiently, identify patterns in student performance, and refine teaching methods with precision analytics.",
              },
              {
                icon: (
                  <Building2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-5" />
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
              className="relative z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-left 
              shadow-xl shadow-blue-500/10 dark:shadow-blue-900/10 
              hover:shadow-[0_10px_45px_rgba(37,99,235,0.2)] hover:-translate-y-2 transition-all duration-500" // Daha keskin ve profesyonel gölge eklendi
            >
              <div 
                // DÜZELTME: bg-gradient-to-br -> bg-linear-to-br
                className="absolute inset-0 rounded-3xl bg-linear-to-br from-blue-500/5 to-blue-200/5 dark:from-blue-900/5 dark:to-blue-950/5 pointer-events-none" 
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
          // DÜZELTME: bg-gradient-to-br -> bg-linear-to-br
          className="relative z-20 max-w-5xl text-center my-32 bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-3xl shadow-2xl shadow-blue-600/40 p-16" // CTA gölgesi güçlendirildi
        >
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Start Measuring What Matters
          </h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            Bring transparency and intelligence to academic performance. AcuRate
            turns your data into actionable insights that drive success.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-100 rounded-xl font-semibold text-base px-10 py-5"
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