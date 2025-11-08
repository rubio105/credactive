import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, Heart, TrendingUp, TrendingDown, AlertTriangle, Calendar, Plus, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { BackButton } from "@/components/BackButton";
import { format, subDays } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BluetoothConnector } from "@/components/BluetoothConnector";

interface BloodPressureReading {
  id: string;
  userId: string;
  deviceId: string | null;
  systolic: number;
  diastolic: number;
  heartRate: number | null;
  measurementTime: string;
  notes: string | null;
  isAnomalous: boolean;
  aiAnalysis: string | null;
  createdAt: string;
}

interface BloodPressureStats {
  total: number;
  anomalous: number;
  averageSystolic: number;
  averageDiastolic: number;
  averageHeartRate: number;
  maxSystolic: number;
  maxDiastolic: number;
  minSystolic: number;
  minDiastolic: number;
}

interface WearableDevice {
  id: string;
  userId: string;
  deviceType: string;
  manufacturer: string | null;
  model: string | null;
  deviceId: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

// Form schema for adding new device
const addDeviceSchema = z.object({
  deviceType: z.enum(['blood_pressure', 'glucose', 'heart_rate', 'weight', 'oximeter', 'ecg']),
  manufacturer: z.string().min(1, "Il produttore è obbligatorio"),
  model: z.string().min(1, "Il modello è obbligatorio"),
  deviceId: z.string().min(1, "L'ID dispositivo è obbligatorio"),
});

type AddDeviceForm = z.infer<typeof addDeviceSchema>;

export default function WearablePage() {
  console.log('[WearablePage] Component mounting');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const { toast } = useToast();
  console.log('[WearablePage] Hooks initialized');
  
  // Memoize date range to prevent infinite fetch loop
  const { startDate, endDate } = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return {
      startDate: subDays(new Date(), days),
      endDate: new Date(),
    };
  }, [dateRange]);
  
  // Form for adding device
  const addDeviceForm = useForm<AddDeviceForm>({
    resolver: zodResolver(addDeviceSchema),
    defaultValues: {
      deviceType: 'blood_pressure',
      manufacturer: '',
      model: '',
      deviceId: '',
    },
  });
  
  // Add device mutation
  const addDeviceMutation = useMutation({
    mutationFn: async (data: AddDeviceForm) => {
      return await apiRequest('/api/wearable/devices', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wearable/devices'] });
      toast({
        title: "Dispositivo aggiunto",
        description: "Il dispositivo è stato registrato con successo",
      });
      setAddDeviceOpen(false);
      addDeviceForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il dispositivo",
        variant: "destructive",
      });
    },
  });
  
  // Delete device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      return await apiRequest(`/api/wearable/devices/${deviceId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wearable/devices'] });
      toast({
        title: "Dispositivo eliminato",
        description: "Il dispositivo è stato rimosso con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il dispositivo",
        variant: "destructive",
      });
    },
  });
  
  // Fetch blood pressure readings
  const { data: readingsData, isLoading: loadingReadings, error: readingsError } = useQuery<{
    readings: BloodPressureReading[];
    stats: BloodPressureStats;
  }>({
    queryKey: [`/api/wearable/blood-pressure?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`],
  });

  // Fetch devices
  const { data: devices, isLoading: loadingDevices, error: devicesError } = useQuery<WearableDevice[]>({
    queryKey: ['/api/wearable/devices'],
  });

  // Fetch anomalies
  const { data: anomalies, isLoading: loadingAnomalies, error: anomaliesError } = useQuery<BloodPressureReading[]>({
    queryKey: ['/api/wearable/blood-pressure/anomalies'],
  });

  console.log('[WearablePage] Queries completed', {loadingReadings, loadingDevices, loadingAnomalies});
  
  // Check loading state BEFORE processing data
  if (loadingReadings || loadingDevices || loadingAnomalies) {
    console.log('[WearablePage] Still loading...');
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  console.log('[WearablePage] Loading complete, processing data');
  
  const readings = readingsData?.readings || [];
  const rawStats = readingsData?.stats;
  const safeDevices = devices || [];
  const safeAnomalies = anomalies || [];
  
  console.log('[WearablePage] Raw data', {readings: readings.length, rawStats, devices: safeDevices.length, anomalies: safeAnomalies.length});
  
  // Ensure stats values are safe for rendering (no NaN)
  const stats = rawStats ? {
    total: rawStats.total || 0,
    anomalous: rawStats.anomalous || 0,
    averageSystolic: Number.isFinite(rawStats.averageSystolic) ? Math.round(rawStats.averageSystolic) : 0,
    averageDiastolic: Number.isFinite(rawStats.averageDiastolic) ? Math.round(rawStats.averageDiastolic) : 0,
    averageHeartRate: Number.isFinite(rawStats.averageHeartRate) ? Math.round(rawStats.averageHeartRate) : 0,
    maxSystolic: rawStats.maxSystolic || 0,
    maxDiastolic: rawStats.maxDiastolic || 0,
    minSystolic: rawStats.minSystolic || 0,
    minDiastolic: rawStats.minDiastolic || 0,
  } : {
    total: 0,
    anomalous: 0,
    averageSystolic: 0,
    averageDiastolic: 0,
    averageHeartRate: 0,
    maxSystolic: 0,
    maxDiastolic: 0,
    minSystolic: 0,
    minDiastolic: 0,
  };

  // Prepare chart data
  const chartData = readings
    .slice()
    .sort((a, b) => new Date(a.measurementTime).getTime() - new Date(b.measurementTime).getTime())
    .map(r => ({
      date: format(new Date(r.measurementTime), 'dd/MM HH:mm'),
      systolic: r.systolic,
      diastolic: r.diastolic,
      heartRate: r.heartRate || undefined,
      isAnomalous: r.isAnomalous,
    }));

  const getSeverityBadge = (reading: BloodPressureReading) => {
    if (!reading.isAnomalous) return <Badge variant="outline">Normale</Badge>;
    
    if (reading.systolic >= 140 || reading.diastolic >= 90) {
      return <Badge variant="destructive">Alta</Badge>;
    } else if (reading.systolic < 90 || reading.diastolic < 60) {
      return <Badge variant="destructive">Bassa</Badge>;
    } else {
      return <Badge variant="secondary">Elevata</Badge>;
    }
  };

  // Check errors after data processing but before rendering
  if (readingsError || devicesError || anomaliesError) {
    console.error('[WearablePage] Error detected:', {readingsError, devicesError, anomaliesError});
    const errorMessage = readingsError instanceof Error ? readingsError.message : 
                         devicesError instanceof Error ? devicesError.message : 
                         anomaliesError instanceof Error ? anomaliesError.message :
                         "Si è verificato un errore";
    
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-semibold">Errore nel caricamento dei dati</p>
              <p className="text-sm text-muted-foreground mt-2">{errorMessage}</p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  queryClient.refetchQueries({ 
                    queryKey: [`/api/wearable/blood-pressure?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`]
                  });
                  queryClient.refetchQueries({ queryKey: ['/api/wearable/devices'] });
                  queryClient.refetchQueries({ queryKey: ['/api/wearable/blood-pressure/anomalies'] });
                }}
                data-testid="button-retry"
              >
                Riprova
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  console.log('[WearablePage] Rendering main UI');

  return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton
              label="Indietro"
              variant="ghost"
              testId="button-back"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="title-page">Monitoraggio Salute</h1>
              <p className="text-muted-foreground">Dati da dispositivi indossabili</p>
            </div>
          </div>
        
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
          <SelectTrigger className="w-[140px]" data-testid="select-date-range">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
            <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
            <SelectItem value="90d">Ultimi 90 giorni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Misurazioni</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.anomalous} anomalie rilevate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pressione Media</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avg-bp">
              {stats.averageSystolic}/{stats.averageDiastolic}
            </div>
            <p className="text-xs text-muted-foreground">mmHg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Battiti Medi</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avg-hr">
              {stats.averageHeartRate > 0 ? stats.averageHeartRate : '--'}
            </div>
            <p className="text-xs text-muted-foreground">bpm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dispositivi</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-devices">
              {safeDevices.filter(d => d.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">attivi</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="pressure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pressure" data-testid="tab-pressure">Pressione Sanguigna</TabsTrigger>
          <TabsTrigger value="heartrate" data-testid="tab-heartrate">Battito Cardiaco</TabsTrigger>
        </TabsList>

        <TabsContent value="pressure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Andamento Pressione</CardTitle>
              <CardDescription>
                Sistolica e diastolica negli ultimi {dateRange === '7d' ? '7 giorni' : dateRange === '30d' ? '30 giorni' : '90 giorni'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[40, 180]} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={120} stroke="#10b981" strokeDasharray="3 3" label="Ottimale Sistolica" />
                    <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label="Ottimale Diastolica" />
                    <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" label="Soglia Alta" />
                    <Line 
                      type="monotone" 
                      dataKey="systolic" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Sistolica" 
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return payload.isAnomalous ? (
                          <circle cx={cx} cy={cy} r={4} fill="#ef4444" />
                        ) : (
                          <circle cx={cx} cy={cy} r={3} fill="#3b82f6" />
                        );
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Diastolica"
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return payload.isAnomalous ? (
                          <circle cx={cx} cy={cy} r={4} fill="#ef4444" />
                        ) : (
                          <circle cx={cx} cy={cy} r={3} fill="#8b5cf6" />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>Nessun dato disponibile per il periodo selezionato</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heartrate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Andamento Battito Cardiaco</CardTitle>
              <CardDescription>
                Frequenza cardiaca negli ultimi {dateRange === '7d' ? '7 giorni' : dateRange === '30d' ? '30 giorni' : '90 giorni'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.filter(d => d.heartRate).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.filter(d => d.heartRate)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[40, 140]} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={60} stroke="#10b981" strokeDasharray="3 3" label="Minimo Normale" />
                    <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label="Massimo Normale" />
                    <Line 
                      type="monotone" 
                      dataKey="heartRate" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Battiti (bpm)"
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return payload.isAnomalous ? (
                          <circle cx={cx} cy={cy} r={4} fill="#ef4444" />
                        ) : (
                          <circle cx={cx} cy={cy} r={3} fill="#10b981" />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>Nessun dato battito cardiaco disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Anomalies */}
      {safeAnomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Anomalie Rilevate
            </CardTitle>
            <CardDescription>Misurazioni con valori fuori norma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeAnomalies.slice(0, 5).map((reading) => (
                <div 
                  key={reading.id} 
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  data-testid={`anomaly-${reading.id}`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(reading)}
                      <span className="text-sm font-medium">
                        {reading.systolic}/{reading.diastolic} mmHg
                        {reading.heartRate && ` • ${reading.heartRate} bpm`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(reading.measurementTime), "dd/MM/yyyy 'alle' HH:mm")}
                    </p>
                    {reading.aiAnalysis && (
                      <p className="text-sm mt-2">{reading.aiAnalysis}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devices List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>I Tuoi Dispositivi</CardTitle>
              <CardDescription>Dispositivi connessi al monitoraggio</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <BluetoothConnector />
              <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-device">
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Dispositivo
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registra Nuovo Dispositivo</DialogTitle>
                  <DialogDescription>
                    Aggiungi un dispositivo wearable per monitorare i tuoi parametri vitali
                  </DialogDescription>
                </DialogHeader>
                <Form {...addDeviceForm}>
                  <form onSubmit={addDeviceForm.handleSubmit((data) => addDeviceMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={addDeviceForm.control}
                      name="deviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Dispositivo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-device-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="blood_pressure">Misuratore Pressione</SelectItem>
                              <SelectItem value="glucose">Glucometro</SelectItem>
                              <SelectItem value="heart_rate">Cardiofrequenzimetro</SelectItem>
                              <SelectItem value="weight">Bilancia</SelectItem>
                              <SelectItem value="oximeter">Saturimetro</SelectItem>
                              <SelectItem value="ecg">ECG</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addDeviceForm.control}
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produttore</FormLabel>
                          <FormControl>
                            <Input placeholder="es. Omron, Beurer" {...field} data-testid="input-manufacturer" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addDeviceForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modello</FormLabel>
                          <FormControl>
                            <Input placeholder="es. M3 Comfort, BM 27" {...field} data-testid="input-model" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addDeviceForm.control}
                      name="deviceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Dispositivo</FormLabel>
                          <FormControl>
                            <Input placeholder="Identificativo univoco" {...field} data-testid="input-device-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setAddDeviceOpen(false)}
                        data-testid="button-cancel-add"
                      >
                        Annulla
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addDeviceMutation.isPending}
                        data-testid="button-submit-add"
                      >
                        {addDeviceMutation.isPending ? "Registrazione..." : "Registra Dispositivo"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {safeDevices.length > 0 ? (
            <div className="space-y-3">
              {safeDevices.map((device) => (
                <div 
                  key={device.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`device-${device.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{device.manufacturer} {device.model}</p>
                    <p className="text-sm text-muted-foreground">
                      {device.deviceType.replace('_', ' ')} • ID: {device.deviceId}
                    </p>
                    {device.lastSyncAt && (
                      <p className="text-xs text-muted-foreground">
                        Ultima sincronizzazione: {format(new Date(device.lastSyncAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={device.isActive ? "default" : "secondary"}>
                      {device.isActive ? "Attivo" : "Inattivo"}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          data-testid={`button-delete-${device.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler eliminare il dispositivo <strong>{device.manufacturer} {device.model}</strong>? 
                            Questa azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDeviceMutation.mutate(device.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            data-testid="button-confirm-delete"
                          >
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nessun dispositivo registrato</p>
              <p className="text-sm mt-2">Aggiungi il tuo primo dispositivo per iniziare il monitoraggio</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
