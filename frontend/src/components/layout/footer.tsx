"use client";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-32 border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        
        {/* LOGO + COPYRIGHT */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
            <span className="text-blue-600">Acu</span>Rate
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            © {new Date().getFullYear()} AcuRate. Empowering academic precision.
          </p>
        </div>

        {/* LINKS */}
        <div className="flex gap-8 text-sm text-slate-500 dark:text-slate-400">
          <a href="#privacy" className="hover:text-blue-600 transition-colors">Privacy</a>
          <a href="#terms" className="hover:text-blue-600 transition-colors">Terms</a>
          <a href="#support" className="hover:text-blue-600 transition-colors">Support</a>
        </div>

        {/* SOCIALS */}
        <div className="flex gap-4">
          <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">
            <i className="fa-brands fa-linkedin text-lg" />
          </a>
          <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">
            <i className="fa-brands fa-twitter text-lg" />
          </a>
          <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">
            <i className="fa-brands fa-github text-lg" />
          </a>
        </div>
      </div>
    </footer>
  );
}
