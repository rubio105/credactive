/**
 * ViewModeContext - Sistema di gestione automatica della modalità di visualizzazione
 * 
 * Questo context fornisce la logica per determinare automaticamente se l'applicazione
 * deve essere visualizzata in modalità mobile o desktop in base alle dimensioni dello schermo.
 * 
 * NOTA IMPORTANTE: La modalità è sempre automatica. Non è più possibile per l'utente
 * selezionare manualmente mobile/desktop (questa feature è stata rimossa).
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Tipo ViewMode - rappresenta le possibili modalità di visualizzazione
 * - 'mobile': Forza la visualizzazione mobile
 * - 'desktop': Forza la visualizzazione desktop  
 * - 'auto': Determina automaticamente in base alla larghezza dello schermo
 * 
 * NOTA: Attualmente solo 'auto' è utilizzato nell'applicazione
 */
export type ViewMode = 'mobile' | 'desktop' | 'auto';

/**
 * Interfaccia del context - definisce i valori esposti ai componenti consumer
 */
interface ViewModeContextType {
  viewMode: ViewMode;                        // Sempre 'auto' nell'implementazione corrente
  setViewMode: (mode: ViewMode) => void;     // No-op mantenuto per retrocompatibilità API
  effectiveMode: 'mobile' | 'desktop';       // Modalità effettiva calcolata dal window width
  isMobileView: boolean;                     // True se effectiveMode === 'mobile'
}

// Inizializzazione del context con undefined (richiede l'uso del Provider)
const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

interface ViewModeProviderProps {
  children: ReactNode;
}

/**
 * ViewModeProvider - Provider del context che gestisce lo stato responsive
 * 
 * FUNZIONAMENTO:
 * 1. Traccia la larghezza della finestra tramite window resize event
 * 2. Calcola automaticamente effectiveMode basandosi sul breakpoint di 768px
 * 3. Aggiorna l'attributo data-view-mode sul documento HTML per styling CSS
 * 
 * BREAKPOINT:
 * - < 768px = mobile
 * - >= 768px = desktop
 */
export function ViewModeProvider({ children }: ViewModeProviderProps) {
  // Stato che traccia la larghezza corrente della finestra
  // Default: 1024 per SSR (assume desktop se window non disponibile)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  /**
   * Effect: Registra listener per aggiornare windowWidth ad ogni resize
   * Questo permette la reattività quando l'utente ridimensiona la finestra
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      
      // Cleanup: rimuove il listener quando il componente viene smontato
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  /**
   * Calcolo della modalità effettiva basata sul breakpoint di 768px
   * Questo è il cuore della logica responsive automatica
   */
  const effectiveMode: 'mobile' | 'desktop' = windowWidth < 768 ? 'mobile' : 'desktop';
  
  /**
   * Helper boolean per verifiche rapide nei componenti
   */
  const isMobileView = effectiveMode === 'mobile';

  /**
   * Funzione no-op mantenuta per retrocompatibilità
   * 
   * NOTA PER SVILUPPATORI: Questa funzione non fa nulla perché la modalità
   * è ora sempre automatica. È mantenuta per non rompere l'API esistente
   * utilizzata da componenti legacy che potrebbero ancora chiamarla.
   */
  const setViewMode = () => {
    // No-op: view mode is now always automatic
  };

  /**
   * Effect: Sincronizza la modalità effettiva con un attributo HTML
   * Questo permette a CSS di applicare stili condizionali usando:
   * html[data-view-mode="mobile"] { ... }
   * html[data-view-mode="desktop"] { ... }
   */
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

/**
 * Hook custom per accedere al ViewModeContext
 * 
 * UTILIZZO NEI COMPONENTI:
 * const { isMobileView, effectiveMode } = useViewMode();
 * 
 * ERRORE: Se usato fuori dal ViewModeProvider, lancia un errore chiaro
 */
export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
