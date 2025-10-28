import { useTheme } from "next-themes";

export function useThemeColors() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "system";

  return {
    isDark,
    strokeColor: isDark ? "#818CF8" : "#2563EB",
    bgColor: isDark ? "#1E293B" : "#F8FAFC",
    accent: isDark ? "#6366F1" : "#3B82F6",
    text: isDark ? "#E2E8F0" : "#1E293B",
  };
}