import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanHistoryItem, Product } from '../types';
import { initDatabase } from '../services/databaseService';

const STORAGE_KEY = '@nutriscan_history';

interface AppState {
  scanHistory: ScanHistoryItem[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_HISTORY'; payload: ScanHistoryItem[] }
  | { type: 'ADD_TO_HISTORY'; payload: ScanHistoryItem }
  | { type: 'REMOVE_FROM_HISTORY'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  scanHistory: [],
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_HISTORY':
      return { ...state, scanHistory: action.payload, isLoading: false };
    case 'ADD_TO_HISTORY':
      const exists = state.scanHistory.some(item => item.product.barcode === action.payload.product.barcode);
      if (exists) {
        return state;
      }
      return {
        ...state,
        scanHistory: [action.payload, ...state.scanHistory].slice(0, 50),
      };
    case 'REMOVE_FROM_HISTORY':
      return {
        ...state,
        scanHistory: state.scanHistory.filter(item => item.id !== action.payload),
      };
    case 'CLEAR_HISTORY':
      return { ...state, scanHistory: [] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  addToHistory: (product: Product) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  getRecentScans: (limit?: number) => ScanHistoryItem[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadHistory();
    initDatabase().catch(err => console.error('Failed to initialize database:', err));
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      saveHistory(state.scanHistory);
    }
  }, [state.scanHistory, state.isLoading]);

  async function loadHistory() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored) as ScanHistoryItem[];
        dispatch({ type: 'SET_HISTORY', payload: history });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error loading history:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  async function saveHistory(history: ScanHistoryItem[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  function addToHistory(product: Product) {
    const newItem: ScanHistoryItem = {
      id: `${product.barcode}-${Date.now()}`,
      product,
      scannedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_TO_HISTORY', payload: newItem });
  }

  function removeFromHistory(id: string) {
    dispatch({ type: 'REMOVE_FROM_HISTORY', payload: id });
  }

  function clearHistory() {
    dispatch({ type: 'CLEAR_HISTORY' });
  }

  function getRecentScans(limit: number = 5): ScanHistoryItem[] {
    return state.scanHistory.slice(0, limit);
  }

  return (
    <AppContext.Provider
      value={{
        state,
        addToHistory,
        removeFromHistory,
        clearHistory,
        getRecentScans,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
