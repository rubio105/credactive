import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, Heart, TrendingUp, TrendingDown, AlertTriangle, Calendar, ArrowLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { format, subDays } from "date-fns";
import { queryClient } from "@/lib/queryClient";

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

export default function WearablePage() {
  const [, navigate] = useLocation();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Memoize date range to prevent infinite fetch loop
  const { startDate, endDate } = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return {
      startDate: subDays(new Date(), days),
      endDate: new Date(),
    };
  }, [dateRange]);
  
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

  const readings = readingsData?.readings || [];
  const stats = readingsData?.stats || {
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

  if (loadingReadings || loadingDevices || loadingAnomalies) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (readingsError || devicesError || anomaliesError) {
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

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
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
              {stats.averageHeartRate || '--'}
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
              {devices?.filter(d => d.isActive).length || 0}
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
      {anomalies && anomalies.length > 0 && (
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
              {anomalies.slice(0, 5).map((reading) => (
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
      {devices && devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>I Tuoi Dispositivi</CardTitle>
            <CardDescription>Dispositivi connessi al monitoraggio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.map((device) => (
                <div 
                  key={device.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`device-${device.id}`}
                >
                  <div>
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
                  <Badge variant={device.isActive ? "default" : "secondary"}>
                    {device.isActive ? "Attivo" : "Inattivo"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
