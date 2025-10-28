// components/layout/ParticlesContainer.jsx
"use client";

import { useCallback, useMemo } from "react";
import Particles from "@tsparticles/react";
// loadSlim artık @tsparticles/slim paketinden import ediliyor
import { loadSlim } from "@tsparticles/slim"; 
import { useTheme } from "next-themes"; // Temayı senkronize etmek için


// Partikül konfigürasyonunu özelleştirin
const particlesOptions = {
  fullScreen: {
    enable: false, 
  },
  background: {
    color: {
      value: "transparent", 
    },
  },
  fpsLimit: 120, 
  interactivity: {
    events: {
      onClick: {
        enable: true,
        mode: "push",
      },
      onHover: {
        enable: true,
        mode: "repulse", 
      },
    },
    modes: {
      push: {
        quantity: 4,
      },
      repulse: {
        distance: 100,
        duration: 0.4,
      },
    },
  },
  particles: {
    // Varsayılan (Light Mode) renkler
    color: {
      value: "#60a5fa", // Orta mavi (blue-400)
    },
    links: {
      color: "#93c5fd", // Açık mavi (blue-300)
      distance: 150,
      enable: true,
      opacity: 0.6,
      width: 1,
    },
    move: {
      direction: "none",
      enable: true,
      outModes: {
        default: "bounce",
      },
      random: true, 
      speed: 0.5, 
      straight: false,
    },
    number: {
      density: {
        enable: true,
        area: 800,
      },
      value: 80, 
    },
    opacity: {
      value: 0.5,
    },
    shape: {
      type: "circle",
    },
    size: {
      value: { min: 1, max: 3 },
    },
  },
  // Dark Mode renk teması tanımı
  themes: [
    {
      name: "dark",
      options: {
        particles: {
          color: {
            value: "#3b82f6", // Mavi (blue-500)
          },
          links: {
            color: "#1d4ed8", // Koyu mavi (blue-700)
          },
        },
      },
    },
    {
      name: "light",
      options: {
        particles: {
          color: {
            value: "#60a5fa", 
          },
          links: {
            color: "#93c5fd", 
          },
        },
      },
    }
  ],
};


export default function ParticlesContainer() {
  const { theme } = useTheme(); // Temayı alıyoruz

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine); 
  }, []);

  const options = useMemo(() => {
    // Aktif temayı Dark/Light mode durumuna göre ayarlıyoruz
    return {
      ...particlesOptions,
      // theme'i 'dark' veya 'light' olarak ayarla
      theme: (theme === "dark" || theme === "system") ? "dark" : "light", 
    };
  }, [theme]); // Tema değiştiğinde opsiyonları yeniden hesapla


  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={options}
      />
    </div>
  );
}