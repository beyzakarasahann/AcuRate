// components/layout/LenisProvider.jsx
"use client";

import { ReactLenis } from "@studio-freight/react-lenis";
import React from "react";

// Lenis ayarlarını özelleştirin
const lenisOptions = {
  // Lerp: Yumuşaklık derecesi (0.1 - çok yumuşak, 1.0 - normal)
  lerp: 0.08, 
  // Duration: Navigasyon (scrollTo) animasyon süresi
  duration: 1.5,
  // smoothTouch: Dokunmatik cihazlarda da smooth scroll etkinleştirir
  smoothTouch: true, 
};

export default function LenisProvider({ children }) {
  // ReactLenis, tüm çocuk bileşenleri sarmalayarak onlara smooth scroll uygular.
  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}