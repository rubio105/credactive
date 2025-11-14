import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ViewMode = 'mobile' | 'desktop' | 'auto';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  effectiveMode: 'mobile' | 'desktop';
  isMobileView: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

interface ViewModeProviderProps {
  children: ReactNode;
}

export function ViewModeProvider({ children }: ViewModeProviderProps) {
  const [viewMode, setViewModeState] = useState<ViewMode>('auto');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ciry-view-mode');
      if (saved && (saved === 'mobile' || saved === 'desktop' || saved === 'auto')) {
        setViewModeState(saved as ViewMode);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const effectiveMode: 'mobile' | 'desktop' = 
    viewMode === 'auto' 
      ? windowWidth < 768 ? 'mobile' : 'desktop'
      : viewMode;

  const isMobileView = effectiveMode === 'mobile';

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ciry-view-mode', mode);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-view-mode', effectiveMode);
    }
  }, [effectiveMode]);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, effectiveMode, isMobileView }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
