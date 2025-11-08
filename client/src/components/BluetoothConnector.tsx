/// <reference types="web-bluetooth" />

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bluetooth, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BluetoothConnectorProps {
  onSuccess?: () => void;
}

interface BloodPressureReading {
  systolic: number;
  diastolic: number;
  heartRate?: number;
  measurementTime: string;
}

const BLOOD_PRESSURE_SERVICE = 0x1810;
const BLOOD_PRESSURE_MEASUREMENT = 0x2A35;

export function BluetoothConnector({ onSuccess }: BluetoothConnectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [status, setStatus] = useState<string>("");
  const { toast } = useToast();

  const sendReadingMutation = useMutation({
    mutationFn: async (data: BloodPressureReading) => {
      const response = await fetch('/api/wearable/blood-pressure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nel salvare la misurazione');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wearable/blood-pressure'], exact: false });
      toast({
        title: "Lettura registrata",
        description: "La misurazione è stata salvata con successo",
      });
      onSuccess?.();
      setTimeout(() => {
        setIsOpen(false);
        disconnectDevice();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare la misurazione",
        variant: "destructive",
      });
    },
  });

  const parseBloodPressureData = (dataView: DataView): BloodPressureReading | null => {
    try {
      const flags = dataView.getUint8(0);
      let offset = 1;

      const isMMHG = (flags & 0x01) === 0;
      if (!isMMHG) {
        setStatus("⚠️ Unità non supportata (solo mmHg)");
        return null;
      }

      const systolic = dataView.getUint16(offset, true);
      offset += 2;
      const diastolic = dataView.getUint16(offset, true);
      offset += 2;
      const meanArterialPressure = dataView.getUint16(offset, true);
      offset += 2;

      const hasTimestamp = (flags & 0x02) !== 0;
      let measurementTime = new Date().toISOString();
      
      if (hasTimestamp && dataView.byteLength >= offset + 7) {
        const year = dataView.getUint16(offset, true);
        const month = dataView.getUint8(offset + 2);
        const day = dataView.getUint8(offset + 3);
        const hours = dataView.getUint8(offset + 4);
        const minutes = dataView.getUint8(offset + 5);
        const seconds = dataView.getUint8(offset + 6);
        
        measurementTime = new Date(year, month - 1, day, hours, minutes, seconds).toISOString();
        offset += 7;
      }

      const hasPulseRate = (flags & 0x04) !== 0;
      let heartRate: number | undefined;
      
      if (hasPulseRate && dataView.byteLength >= offset + 2) {
        heartRate = dataView.getUint16(offset, true);
      }

      return {
        systolic,
        diastolic,
        heartRate,
        measurementTime,
      };
    } catch (error) {
      console.error("Errore parsing dati Bluetooth:", error);
      setStatus("❌ Errore nel parsing dei dati");
      return null;
    }
  };

  const handleCharacteristicValueChanged = (event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    
    if (!value) return;

    setStatus("📊 Lettura ricevuta, elaborazione...");
    const reading = parseBloodPressureData(value);
    
    if (reading) {
      setStatus(`✓ Pressione: ${reading.systolic}/${reading.diastolic} mmHg${reading.heartRate ? ` • ${reading.heartRate} bpm` : ''}`);
      sendReadingMutation.mutate(reading);
    }
  };

  const connectDevice = async () => {
    if (!navigator.bluetooth) {
      toast({
        title: "Bluetooth non supportato",
        description: "Il tuo browser non supporta Web Bluetooth API. Usa Chrome, Edge o Opera.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setStatus("🔍 Ricerca dispositivi...");

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLOOD_PRESSURE_SERVICE] }
        ],
        optionalServices: [BLOOD_PRESSURE_SERVICE]
      });

      setStatus(`📱 Connessione a ${device.name || 'Dispositivo'}...`);
      setConnectedDevice(device);

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error("Impossibile connettersi al GATT server");
      }

      setStatus("🔗 Connesso! Accesso ai servizi...");

      const service = await server.getPrimaryService(BLOOD_PRESSURE_SERVICE);
      const characteristic = await service.getCharacteristic(BLOOD_PRESSURE_MEASUREMENT);

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

      setStatus("✓ Connesso! In attesa di misurazioni...");
      setIsConnecting(false);

      toast({
        title: "Dispositivo connesso",
        description: "Puoi iniziare a misurare la pressione",
      });

    } catch (error: any) {
      console.error("Errore connessione Bluetooth:", error);
      setStatus(`❌ Errore: ${error.message}`);
      setIsConnecting(false);
      
      if (error.message.includes("User cancelled")) {
        toast({
          title: "Connessione annullata",
          description: "Selezione dispositivo annullata",
        });
      } else {
        toast({
          title: "Errore connessione",
          description: error.message || "Impossibile connettersi al dispositivo",
          variant: "destructive",
        });
      }
    }
  };

  const disconnectDevice = () => {
    if (connectedDevice?.gatt?.connected) {
      connectedDevice.gatt.disconnect();
    }
    setConnectedDevice(null);
    setStatus("");
    setIsConnecting(false);
  };

  const handleClose = () => {
    disconnectDevice();
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        data-testid="button-bluetooth-connect"
      >
        <Bluetooth className="h-4 w-4 mr-2" />
        Connetti Bluetooth
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connessione Bluetooth</DialogTitle>
            <DialogDescription>
              Connetti un misuratore di pressione Bluetooth per sincronizzare le misurazioni
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {!connectedDevice ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Bluetooth className="h-16 w-16 text-primary opacity-50" />
                  </div>
                  <div>
                    <p className="font-medium">Nessun dispositivo connesso</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Accendi il tuo misuratore di pressione e premi "Cerca Dispositivi"
                    </p>
                  </div>
                  <Button 
                    onClick={connectDevice} 
                    disabled={isConnecting}
                    className="w-full"
                    data-testid="button-search-devices"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Ricerca in corso...
                      </>
                    ) : (
                      <>
                        <Bluetooth className="h-4 w-4 mr-2" />
                        Cerca Dispositivi
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="font-medium">{connectedDevice.name || 'Dispositivo Bluetooth'}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        ID: {connectedDevice.id}
                      </p>
                    </div>
                    <Badge variant="default">Connesso</Badge>
                  </div>

                  {status && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{status}</p>
                    </div>
                  )}

                  {sendReadingMutation.isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvataggio misurazione...
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={disconnectDevice}
                      className="w-full"
                      data-testid="button-disconnect"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Disconnetti
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Nota:</strong> Web Bluetooth è supportato su Chrome, Edge e Opera.</p>
            <p>Il dispositivo deve supportare il protocollo Bluetooth Low Energy (BLE).</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
