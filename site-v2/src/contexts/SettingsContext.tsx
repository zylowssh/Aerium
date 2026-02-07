import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [compactMode, setCompactMode] = useState(() => {
    const stored = localStorage.getItem('aerium-compact-mode');
    return stored === 'true';
  });

  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const stored = localStorage.getItem('aerium-animations');
    return stored !== 'false'; // Default to true
  });

  useEffect(() => {
    localStorage.setItem('aerium-compact-mode', String(compactMode));
    document.documentElement.classList.toggle('compact-mode', compactMode);
  }, [compactMode]);

  useEffect(() => {
    localStorage.setItem('aerium-animations', String(animationsEnabled));
    document.documentElement.classList.toggle('no-animations', !animationsEnabled);
  }, [animationsEnabled]);

  return (
    <SettingsContext.Provider value={{ compactMode, setCompactMode, animationsEnabled, setAnimationsEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
