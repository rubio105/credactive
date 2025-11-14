import { Monitor, Smartphone, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useViewMode, ViewMode } from "@/contexts/ViewModeContext";
import { cn } from "@/lib/utils";

export function ViewToggle() {
  const { viewMode, setViewMode, effectiveMode } = useViewMode();

  const viewModeConfig = {
    auto: { icon: Monitor, label: "Auto", description: "Adatta automaticamente" },
    mobile: { icon: Smartphone, label: "Mobile", description: "Vista mobile" },
    desktop: { icon: Laptop, label: "Desktop", description: "Vista desktop" },
  };

  const CurrentIcon = viewModeConfig[viewMode].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          data-testid="button-view-toggle"
          aria-label="Cambia modalità visualizzazione"
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Cambia vista</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {(Object.keys(viewModeConfig) as ViewMode[]).map((mode) => {
          const config = viewModeConfig[mode];
          const Icon = config.icon;
          const isActive = viewMode === mode;
          
          return (
            <DropdownMenuItem
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                isActive && "bg-accent"
              )}
              data-testid={`view-mode-${mode}`}
            >
              <Icon className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{config.label}</span>
                {mode === 'auto' && (
                  <span className="text-xs text-muted-foreground">
                    Attuale: {effectiveMode === 'mobile' ? 'Mobile' : 'Desktop'}
                  </span>
                )}
              </div>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
