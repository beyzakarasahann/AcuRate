"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { GraduationCap, BarChart3, Building2 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="relative flex flex-col items-center justify-center overflow-hidden min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-center selection:bg-blue-600/10 selection:text-blue-700">
        
        {/* BACKGROUND EFFECTS */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/60 via-transparent to-transparent dark:from-blue-950/30" />
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-blue-200/40 dark:bg-blue-900/20 blur-[160px] rounded-full opacity-70" />

        {/* HERO SECTION */}
        <section className="relative z-10 py-40 px-6 max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-snug"
          >
            Transforming <span className="text-blue-700 dark:text-blue-400">Academic Data</span> into Clarity
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            AcuRate empowers institutions, teachers, and students to analyze, visualize, and improve academic performance — all through data-driven insights and elegant simplicity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/login">
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
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-32 px-8 max-w-6xl grid md:grid-cols-3 gap-10">
          {[
            {
              icon: <GraduationCap className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-5" />,
              title: "For Students",
              text: "Visualize your academic growth, track your performance, and receive personalized insights that help you excel."
            },
            {
              icon: <BarChart3 className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-5" />,
              title: "For Teachers",
              text: "Capture results efficiently, identify patterns in student performance, and refine teaching methods with precision analytics."
            },
            {
              icon: <Building2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-5" />,
              title: "For Institutions",
              text: "Oversee outcomes across programs, enhance course effectiveness, and make strategic decisions backed by solid data."
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-slate-200/70 dark:border-slate-700/50 rounded-3xl p-10 text-left shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(37,99,235,0.15)] hover:-translate-y-2 transition-all duration-500"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/0 to-blue-100/10 dark:from-blue-900/0 dark:to-blue-950/10 pointer-events-none" />
              {feature.icon}
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">{feature.text}</p>
            </motion.div>
          ))}
        </section>

        {/* CTA STRIP */}
        <motion.section
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-5xl text-center my-32 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl shadow-lg p-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Start Measuring What Matters</h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            Bring transparency and intelligence to academic performance.  
            AcuRate turns your data into actionable insights that drive success.
          </p>
          <Link href="/auth/login">
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
    </>
  );
}
