"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Environment } from "@react-three/drei";
import { useTheme } from "next-themes";
import * as THREE from "three";

export function ChartIllustration3D() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "system";

  const primary = isDark ? "#A5B4FC" : "#2563EB";
  const accent = isDark ? "#FFFFFF" : "#60A5FA";

  // Çubuk sayısı 6 olarak ayarlandı
  const BAR_COUNT = 6;

  // Çubukların yüksekliklerini hesaplar
  const getBarHeight = (i: number) => {
    // Yükseklik genel olarak küçültüldü: Başlangıç 2.0'dan 1.8'e düştü.
    const initialHeight = 1.8; 
    const step = 0.25; // Azalma adımı da küçültüldü
    
    // En kısa çubuk için özel yükseklik: 0.5'ten 0.4'e düştü.
    const SHORTEST_HEIGHT = 0.4; 

    // i, 0'dan 5'e gidiyor.
    if (i < BAR_COUNT - 1) {
      // Normal azalan sıra
      return initialHeight - i * step; 
    } else {
      // En son çubuk (i=5) için, tüm serideki en kısa değeri kullan (0.4)
      return SHORTEST_HEIGHT; 
    }
  };

  // Bu offset, <group position={[0, -0.5, 0]}> ayarını dengeleyerek
  // tüm çubukların alt kenarlarını y=0 zeminine hizalar.
  const GROUND_OFFSET = 0.5;

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 1.8, 5], fov: 45 }}>
        {/* === IŞIKLANDIRMA === */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 3, 5]} intensity={1.5} color={primary} />
        <spotLight
          position={[-3, 5, -2]}
          intensity={50}
          angle={0.3}
          penumbra={1}
          color={accent}
        />
        
        <Environment preset="city" />

        <Float speed={2.5} rotationIntensity={0.5} floatIntensity={1}>
          {/* Sahneyi -0.5 Y konumuna kaydıran ana grup */}
          <group position={[0, -0.5, 0]}>
            {/* === DİKEY BAR CHART === */}
            {[...Array(BAR_COUNT)].map((_, i) => {
              const height = getBarHeight(i);

              return (
                <mesh
                  key={i}
                  position={[
                    // Aralık daraltıldı (0.8'den 0.7'ye) ve yeniden merkezlendi
                    i * 0.7 - 1.7, 
                    // Mükemmel alt hizalama formülü
                    height / 2 - GROUND_OFFSET,
                    0, 
                  ]}
                >
                  {/* Genişlik ve derinlik küçültüldü (0.4'ten 0.35'e) */}
                  <boxGeometry args={[0.35, height, 0.35]} />
                  <meshStandardMaterial
                    color={new THREE.Color(primary).offsetHSL(i * 0.05, 0, 0)}
                    metalness={0.8}
                    roughness={0.25}
                    emissive={new THREE.Color(accent)}
                    emissiveIntensity={0.4} 
                  />
                </mesh>
              );
            })}
          </group>
        </Float>
        {/* Hız artırıldı */}
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} /> 
      </Canvas>
    </div>
  );
}
