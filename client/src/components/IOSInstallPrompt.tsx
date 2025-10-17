import { useState, useEffect } from 'react';
import { X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('ios-install-dismissed');
    if (dismissed === 'true') return;

    // Detect iOS Safari (not in standalone mode)
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = 
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Show only on iOS Safari, not already installed, and not Chrome/Edge on iOS
    const isIOSSafari = isIOS && !isInStandaloneMode && !(navigator.userAgent.includes('CriOS') || navigator.userAgent.includes('EdgiOS'));

    if (isIOSSafari) {
      setShowPrompt(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg" data-testid="ios-install-prompt">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-semibold">
                Installa l'app CIRY
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium">Come installare su iPhone/iPad:</p>
              <ol className="text-xs space-y-1.5">
                <li className="flex items-center gap-2">
                  <Share className="h-3 w-3 flex-shrink-0" />
                  <span>1. Tap l'icona <strong>Condividi</strong> in basso</span>
                </li>
                <li className="flex items-center gap-2">
                  <Plus className="h-3 w-3 flex-shrink-0" />
                  <span>2. Scorri e seleziona <strong>"Aggiungi a Home"</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-base">✓</span>
                  <span>3. Tap <strong>"Aggiungi"</strong></span>
                </li>
              </ol>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Chiudi"
            data-testid="button-dismiss-ios-prompt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
