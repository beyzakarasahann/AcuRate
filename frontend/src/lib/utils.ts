// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind class'larını güvenli şekilde birleştirir.
 * Kullanım:
 * <div className={cn("p-4", isActive && "bg-blue-600")} />
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Renk parlaklığını değiştirir (örneğin chart gradientlerinde kullanılır)
 * @param hex Renk kodu (örnek: "#2563EB")
 * @param percent Artış/azalış yüzdesi (-50 ile 50 arası önerilir)
 */
export function adjustColor(hex: string, percent: number) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Büyük sayıları okunabilir formata çevirir (örnek: 12500 → "12.5K")
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

/**
 * Random renk üretir (örnek: chart’larda veri seti için)
 */
export function randomColor(): string {
  const colors = ["#2563EB", "#3B82F6", "#6366F1", "#10B981", "#F59E0B", "#EF4444"];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Bir işlemi geciktirmek için basit debounce fonksiyonu
 * (örnek: arama inputlarında kullanılabilir)
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}
