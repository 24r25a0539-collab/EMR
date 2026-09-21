import React, { createContext, useContext, useEffect } from 'react';

export type Theme = 'dark';
export type ActualTheme = 'dark';

interface ThemeContextType {
  theme: Theme;
  actualTheme: ActualTheme;
  setTheme: (theme: any) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
    try {
      localStorage.setItem('emr_theme', 'dark');
    } catch {}
  }, []);

  const setTheme = () => {
    // Pure Black Theme locked across entire application
  };

  const toggleTheme = () => {
    // Pure Black Theme locked across entire application
  };

  return (
    <ThemeContext.Provider value={{ theme: 'dark', actualTheme: 'dark', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
