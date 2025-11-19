import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  bgAnimated: boolean;
  setBgAnimated: (v: boolean) => void;
  toggleBgAnimated: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'ui.theme';
const BG_STORAGE_KEY = 'ui.bgAnimated';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [bgAnimated, setBgAnimatedState] = useState<boolean>(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setThemeState(prefersDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(BG_STORAGE_KEY);
    if (stored === 'true' || stored === 'false') {
      setBgAnimatedState(stored === 'true');
    } else {
      setBgAnimatedState(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-bg', bgAnimated ? 'animated' : 'solid');
    localStorage.setItem(BG_STORAGE_KEY, String(bgAnimated));
  }, [bgAnimated]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (t: Theme) => setThemeState(t),
      toggleTheme: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
      bgAnimated,
      setBgAnimated: (v: boolean) => setBgAnimatedState(v),
      toggleBgAnimated: () => setBgAnimatedState((v) => !v),
    }),
    [theme, bgAnimated],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
