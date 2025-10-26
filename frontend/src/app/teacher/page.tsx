"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GraduationCap, BarChart3, Building2 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center text-center min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 overflow-hidden">
      
      {/* HERO */}
      <section className="py-32 px-6 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6"
        >
          Empowering Academic Insights
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed"
        >
          EduMetric helps institutions, teachers, and students measure learning outcomes, track progress, and visualize performance — all in one platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/auth/login">
            <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              Get Started →
            </Button>
          </Link>
          <Link href="#about">
            <Button size="lg" variant="outline" className="px-8 border-slate-300 hover:bg-slate-100 rounded-xl">
              Learn More
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="grid md:grid-cols-3 gap-8 px-8 py-24 max-w-6xl" id="features">
        {[
          {
            icon: <GraduationCap className="w-10 h-10 text-blue-600 mb-4" />,
            title: "For Students",
            text: "Track your academic progress, view personalized analytics, and understand your growth through data-driven insights."
          },
          {
            icon: <BarChart3 className="w-10 h-10 text-blue-600 mb-4" />,
            title: "For Teachers",
            text: "Record grades, evaluate outcomes, and gain insights into student performance and course effectiveness."
          },
          {
            icon: <Building2 className="w-10 h-10 text-blue-600 mb-4" />,
            title: "For Institutions",
            text: "Analyze departmental performance, manage educators, and assess program outcomes across your institution."
          },
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            viewport={{ once: true }}
            className="bg-white/70 backdrop-blur-xl border border-slate-200 shadow-md rounded-2xl p-8 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {feature.icon}
            <h3 className="text-xl font-semibold mb-2 text-slate-900">{feature.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{feature.text}</p>
          </motion.div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-200 w-full text-center text-slate-500 text-sm bg-white/70 backdrop-blur-md">
        © {new Date().getFullYear()} EduMetric. All rights reserved.
      </footer>
    </main>
  );
}
