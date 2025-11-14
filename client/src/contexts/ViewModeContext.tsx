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
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const effectiveMode: 'mobile' | 'desktop' = windowWidth < 768 ? 'mobile' : 'desktop';
  const isMobileView = effectiveMode === 'mobile';

  const setViewMode = () => {
    // No-op: view mode is now always automatic
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-view-mode', effectiveMode);
    }
  }, [effectiveMode]);

  return (
    <ViewModeContext.Provider value={{ viewMode: 'auto', setViewMode, effectiveMode, isMobileView }}>
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
