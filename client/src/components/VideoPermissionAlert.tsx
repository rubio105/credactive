import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Video, Mic, Info } from "lucide-react";

interface VideoPermissionAlertProps {
  meetingUrl: string;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  buttonTestId?: string;
  children?: React.ReactNode;
}

export function VideoPermissionAlert({ 
  meetingUrl, 
  buttonText = "Partecipa alla Videochiamata",
  buttonVariant = "default",
  buttonSize = "sm",
  buttonClassName = "",
  buttonTestId = "button-join-video",
  children
}: VideoPermissionAlertProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleJoinClick = () => {
    setShowDialog(true);
  };

  const handleProceed = () => {
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    setShowDialog(false);
  };

  return (
    <>
      {children ? (
        <div onClick={handleJoinClick} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={buttonClassName}
          onClick={handleJoinClick}
          data-testid={buttonTestId}
        >
          <Video className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>
      )}

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent data-testid="dialog-video-permissions">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <AlertDialogTitle className="text-xl">Permessi necessari</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4 pt-2">
              <p className="text-base">
                Per partecipare alla videochiamata, il tuo browser richiederà i permessi per accedere a:
              </p>
              
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Video className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Fotocamera</p>
                    <p className="text-sm text-muted-foreground">Permette agli altri partecipanti di vederti durante la chiamata</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mic className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Microfono</p>
                    <p className="text-sm text-muted-foreground">Permette di comunicare verbalmente durante la chiamata</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Nota:</strong> Quando il browser richiede i permessi, seleziona "Consenti" per attivare fotocamera e microfono. 
                  Puoi gestire questi permessi in qualsiasi momento dalle impostazioni del browser.
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                La videochiamata si aprirà in una nuova finestra.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-video">Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleProceed}
              data-testid="button-proceed-video"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Procedi alla Videochiamata
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
