import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  overlay: string;
  glass: string;
  glassBorder: string;
  shimmer: string;
  shimmerHighlight: string;
  white: string;
  black: string;
}

const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  primary: '#10B981',
  primaryLight: '#D1FAE5',
  primaryDark: '#059669',
  secondary: '#6366F1',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.5)',
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  shimmer: '#E2E8F0',
  shimmerHighlight: '#F8FAFC',
  white: '#FFFFFF',
  black: '#000000',
};

const darkColors: ThemeColors = {
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceElevated: '#1A1A24',
  surfaceAlt: '#1E1E2A',
  text: '#F8FAFC',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  border: '#27272A',
  primary: '#10B981',
  primaryLight: '#064E3B',
  primaryDark: '#34D399',
  secondary: '#818CF8',
  success: '#22C55E',
  warning: '#FBBF24',
  error: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.7)',
  glass: 'rgba(30, 30, 45, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  shimmer: '#27272A',
  shimmerHighlight: '#3F3F46',
  white: '#FFFFFF',
  black: '#000000',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@nutriscan_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        setThemeModeState(stored as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const saveTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveTheme(mode);
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        colors,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
