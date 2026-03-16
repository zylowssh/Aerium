"use client";

import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// Theme context
interface ThemeContextType {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Settings context
interface SettingsContextType {
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}

// Combined providers
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage
    const storedTheme = localStorage.getItem("aerium-theme") as "dark" | "light" | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }

    // Load settings
    const storedCompact = localStorage.getItem("aerium-compact-mode");
    if (storedCompact === "true") {
      setCompactMode(true);
    }

    const storedAnimations = localStorage.getItem("aerium-animations");
    if (storedAnimations === "false") {
      setAnimationsEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("aerium-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.classList.toggle("light", theme === "light");
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("aerium-compact-mode", String(compactMode));
      document.documentElement.classList.toggle("compact-mode", compactMode);
    }
  }, [compactMode, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("aerium-animations", String(animationsEnabled));
      document.documentElement.classList.toggle("no-animations", !animationsEnabled);
    }
  }, [animationsEnabled, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <SettingsContext.Provider
          value={{ compactMode, setCompactMode, animationsEnabled, setAnimationsEnabled }}
        >
          <Toaster position="top-right" richColors />
          {children}
        </SettingsContext.Provider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
