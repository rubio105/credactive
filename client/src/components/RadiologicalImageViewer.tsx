import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileImage, AlertTriangle, CheckCircle, Info, ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Finding {
  category: 'normal' | 'attention' | 'urgent';
  description: string;
  location?: string;
  confidence?: number;
}

interface RadiologicalImageViewerProps {
  reportId: string;
  findings: Finding[];
  imageType: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'general';
  bodyPart?: string;
}

interface Marker {
  x: number;
  y: number;
  finding: Finding;
  id: string;
}

export function RadiologicalImageViewer({ 
  reportId, 
  findings, 
  imageType,
  bodyPart 
}: RadiologicalImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Auto-position markers based on findings with location
  useEffect(() => {
    if (!imageLoaded || !imgRef.current) return;

    const newMarkers: Marker[] = [];
    const findingsWithLocation = findings.filter(f => f.location);

    // Simple heuristic positioning based on anatomical keywords
    findingsWithLocation.forEach((finding, index) => {
      const location = finding.location?.toLowerCase() || '';
      
      let x = 50; // center
      let y = 50; // center

      // Horizontal positioning
      if (location.includes('destra') || location.includes('destro') || location.includes('right')) {
        x = 70;
      } else if (location.includes('sinistra') || location.includes('sinistro') || location.includes('left')) {
        x = 30;
      }

      // Vertical positioning
      if (location.includes('superiore') || location.includes('apice') || location.includes('upper') || location.includes('top')) {
        y = 25;
      } else if (location.includes('inferiore') || location.includes('base') || location.includes('lower') || location.includes('bottom')) {
        y = 75;
      } else if (location.includes('medio') || location.includes('middle') || location.includes('central')) {
        y = 50;
      }

      // Add small offset if multiple markers at same position
      const samePosition = newMarkers.filter(m => 
        Math.abs(m.x - x) < 10 && Math.abs(m.y - y) < 10
      );
      
      if (samePosition.length > 0) {
        x += samePosition.length * 5;
        y += samePosition.length * 5;
      }

      newMarkers.push({
        x,
        y,
        finding,
        id: `marker-${index}`
      });
    });

    setMarkers(newMarkers);
  }, [findings, imageLoaded]);

  const getMarkerColor = (category: string) => {
    switch (category) {
      case 'urgent':
        return 'bg-red-500 border-red-600';
      case 'attention':
        return 'bg-orange-500 border-orange-600';
      case 'normal':
        return 'bg-green-500 border-green-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const getMarkerIcon = (category: string) => {
    switch (category) {
      case 'urgent':
        return <AlertTriangle className="w-3 h-3 text-white" />;
      case 'attention':
        return <Info className="w-3 h-3 text-white" />;
      case 'normal':
        return <CheckCircle className="w-3 h-3 text-white" />;
      default:
        return <Info className="w-3 h-3 text-white" />;
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const imageUrl = `/api/health-score/reports/${reportId}/image`;

  return (
    <>
      <Card className="shadow-lg border-l-4 border-l-indigo-500 dark:border-l-indigo-400" data-testid={`radiological-viewer-${reportId}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileImage className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <CardTitle className="text-xl">Immagine Radiologica con Annotazioni</CardTitle>
              </div>
              {bodyPart && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sede anatomica: {bodyPart}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Image Controls */}
          <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomIn}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="w-4 h-4 mr-1" />
                Zoom +
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomOut}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="w-4 h-4 mr-1" />
                Zoom -
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRotate}
                data-testid="button-rotate"
              >
                <RotateCw className="w-4 h-4 mr-1" />
                Ruota
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFullscreen(true)}
              data-testid="button-fullscreen"
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              Schermo intero
            </Button>
          </div>

          {/* Image with Markers */}
          <div className="relative overflow-auto bg-black rounded-lg" style={{ maxHeight: '500px' }}>
            <div className="inline-block min-w-full">
              <div 
                className="relative inline-block transition-all duration-300"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Immagine radiologica"
                  className="w-full block"
                  onLoad={() => setImageLoaded(true)}
                  data-testid="radiological-image"
                />
                
                {/* Markers overlay - same transform as image */}
                {imageLoaded && markers.map((marker) => (
                  <button
                    key={marker.id}
                    className={`absolute cursor-pointer border-2 rounded-full p-1.5 shadow-lg transition-transform hover:scale-125 ${getMarkerColor(marker.finding.category)}`}
                    style={{
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      transform: `translate(-50%, -50%)`,
                    }}
                    onClick={() => setSelectedMarker(marker)}
                    data-testid={`marker-${marker.id}`}
                  >
                    {getMarkerIcon(marker.finding.category)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Marker Info */}
          {selectedMarker && (
            <Alert className={
              selectedMarker.finding.category === 'urgent' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' :
              selectedMarker.finding.category === 'attention' ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800' :
              'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
            } data-testid="selected-marker-info">
              <div className="flex items-start gap-2">
                {getMarkerIcon(selectedMarker.finding.category)}
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedMarker.finding.description}
                  </p>
                  {selectedMarker.finding.location && (
                    <p className="text-xs mt-1 opacity-80">
                      Localizzazione: {selectedMarker.finding.location}
                    </p>
                  )}
                  {selectedMarker.finding.confidence && (
                    <p className="text-xs mt-1 opacity-80">
                      Confidenza: {selectedMarker.finding.confidence}%
                    </p>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* Legend */}
          {markers.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-sm font-semibold mb-2">Legenda marcatori:</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-600"></div>
                  <span>Urgente</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-orange-600"></div>
                  <span>Attenzione</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-600"></div>
                  <span>Normale</span>
                </div>
              </div>
            </div>
          )}

          {markers.length === 0 && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="text-sm">
                Nessun reperto specifico con localizzazione anatomica identificata nell'immagine.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-4">
          <div className="relative w-full h-full overflow-auto bg-black rounded-lg">
            <div className="inline-block min-w-full min-h-full flex items-center justify-center">
              <div 
                className="relative inline-block transition-all duration-300"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  src={imageUrl}
                  alt="Immagine radiologica - schermo intero"
                  className="max-w-full max-h-[85vh] object-contain"
                />
                
                {/* Markers overlay in fullscreen - same as main view */}
                {imageLoaded && markers.map((marker) => (
                  <button
                    key={`fs-${marker.id}`}
                    className={`absolute cursor-pointer border-2 rounded-full p-2 shadow-lg transition-transform hover:scale-125 ${getMarkerColor(marker.finding.category)}`}
                    style={{
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      transform: `translate(-50%, -50%)`,
                    }}
                    onClick={() => setSelectedMarker(marker)}
                    data-testid={`marker-fs-${marker.id}`}
                  >
                    {getMarkerIcon(marker.finding.category)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4 flex gap-2 z-50">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Selected marker info in fullscreen */}
          {selectedMarker && (
            <div className="absolute bottom-4 left-4 right-4 z-50">
              <Alert className={
                selectedMarker.finding.category === 'urgent' ? 'bg-red-50 border-red-200 dark:bg-red-950/90 dark:border-red-800' :
                selectedMarker.finding.category === 'attention' ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/90 dark:border-orange-800' :
                'bg-green-50 border-green-200 dark:bg-green-950/90 dark:border-green-800'
              }>
                <div className="flex items-start gap-2">
                  {getMarkerIcon(selectedMarker.finding.category)}
                  <div className="flex-1">
                    <p className="font-medium">
                      {selectedMarker.finding.description}
                    </p>
                    {selectedMarker.finding.location && (
                      <p className="text-xs mt-1 opacity-80">
                        Localizzazione: {selectedMarker.finding.location}
                      </p>
                    )}
                  </div>
                </div>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
