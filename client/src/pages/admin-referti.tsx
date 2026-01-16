import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  CheckCircle,
  Clock,
  Loader2,
  ArrowLeft,
  Users,
  UserCheck,
  Download,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";

interface ReportDocument {
  id: string;
  patientName: string;
  patientFiscalCode?: string;
  status: string;
  createdAt: string;
  signedAt?: string;
  operatorName: string;
  doctorName: string;
}

interface Operator {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  assignedDoctorIds: string[];
  assignedDoctors: { id: string; name: string }[];
}

interface Doctor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}

const ITEMS_PER_PAGE = 10;

export default function AdminReferti() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [signedPage, setSignedPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);

  const { data: reports, isLoading: reportsLoading } = useQuery<ReportDocument[]>({
    queryKey: ["/api/report-documents/admin/all"],
  });

  const { data: operators, isLoading: operatorsLoading } = useQuery<Operator[]>({
    queryKey: ["/api/report-documents/admin/operators"],
  });

  const { data: doctors, isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/report-documents/admin/doctors"],
  });

  const addDoctorMutation = useMutation({
    mutationFn: async ({ operatorId, doctorId }: { operatorId: string; doctorId: string }) => {
      return apiRequest("/api/report-documents/admin/add-doctor-assignment", "POST", {
        operatorId,
        doctorId,
      });
    },
    onSuccess: () => {
      toast({ title: "Medico aggiunto" });
      queryClient.invalidateQueries({ queryKey: ["/api/report-documents/admin/operators"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'assegnazione",
        variant: "destructive",
      });
    },
  });

  const removeDoctorMutation = useMutation({
    mutationFn: async ({ operatorId, doctorId }: { operatorId: string; doctorId: string }) => {
      return apiRequest("/api/report-documents/admin/remove-doctor-assignment", "DELETE", {
        operatorId,
        doctorId,
      });
    },
    onSuccess: () => {
      toast({ title: "Medico rimosso" });
      queryClient.invalidateQueries({ queryKey: ["/api/report-documents/admin/operators"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la rimozione",
        variant: "destructive",
      });
    },
  });

  const handleDoctorToggle = (operatorId: string, doctorId: string, isAssigned: boolean) => {
    if (isAssigned) {
      removeDoctorMutation.mutate({ operatorId, doctorId });
    } else {
      addDoctorMutation.mutate({ operatorId, doctorId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            In elaborazione
          </span>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <FileText className="h-3 w-3" />
            Da revisionare
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
            <FileText className="h-3 w-3" />
            In revisione
          </span>
        );
      case "pending_signature":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3" />
            Da firmare
          </span>
        );
      case "signed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Firmato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter((r) => {
      const matchesSearch = searchTerm === "" || 
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.patientFiscalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, statusFilter]);

  const signedReports = filteredReports.filter((r) => r.status === "signed");
  const pendingReports = filteredReports.filter((r) => r.status !== "signed");

  const paginatedSignedReports = signedReports.slice((signedPage - 1) * ITEMS_PER_PAGE, signedPage * ITEMS_PER_PAGE);
  const paginatedPendingReports = pendingReports.slice((pendingPage - 1) * ITEMS_PER_PAGE, pendingPage * ITEMS_PER_PAGE);
  const totalSignedPages = Math.ceil(signedReports.length / ITEMS_PER_PAGE);
  const totalPendingPages = Math.ceil(pendingReports.length / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Admin
        </Button>
        <h1 className="text-2xl font-bold">Gestione Referti Prohmed</h1>
      </div>

      <Tabs defaultValue="referti" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="referti" data-testid="tab-referti">
            <FileText className="h-4 w-4 mr-2" />
            Referti ({reports?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="assegnazioni" data-testid="tab-assegnazioni">
            <Users className="h-4 w-4 mr-2" />
            Assegnazioni
          </TabsTrigger>
        </TabsList>

        <TabsContent value="referti" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per nome paziente, CF, operatore, medico..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setSignedPage(1); setPendingPage(1); }}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSignedPage(1); setPendingPage(1); }}>
              <SelectTrigger className="w-[180px]" data-testid="select-status">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="processing">In elaborazione</SelectItem>
                <SelectItem value="pending_review">Da revisionare</SelectItem>
                <SelectItem value="in_review">In revisione</SelectItem>
                <SelectItem value="pending_signature">Da firmare</SelectItem>
                <SelectItem value="signed">Firmato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Referti Firmati ({signedReports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : signedReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nessun referto firmato</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedSignedReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        data-testid={`signed-report-${report.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{report.patientName}</p>
                          <p className="text-sm text-gray-500">
                            Operatore: {report.operatorName} | Medico: {report.doctorName}
                          </p>
                          <p className="text-xs text-gray-400">
                            Firmato il{" "}
                            {report.signedAt &&
                              new Date(report.signedAt).toLocaleDateString("it-IT", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(report.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/report-documents/${report.id}/pdf`, "_blank")}
                            data-testid={`button-download-${report.id}`}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalSignedPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-sm text-gray-500">
                        Pagina {signedPage} di {totalSignedPages}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSignedPage(p => Math.max(1, p - 1))} disabled={signedPage === 1}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSignedPage(p => Math.min(totalSignedPages, p + 1))} disabled={signedPage === totalSignedPages}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Referti in Elaborazione ({pendingReports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : pendingReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nessun referto in elaborazione</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedPendingReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        data-testid={`pending-report-${report.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{report.patientName}</p>
                          <p className="text-sm text-gray-500">
                            Operatore: {report.operatorName} | Medico: {report.doctorName}
                          </p>
                          <p className="text-xs text-gray-400">
                            Caricato il{" "}
                            {new Date(report.createdAt).toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>
                    ))}
                  </div>
                  {totalPendingPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-sm text-gray-500">
                        Pagina {pendingPage} di {totalPendingPages}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPendingPage(p => Math.max(1, p - 1))} disabled={pendingPage === 1}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPendingPage(p => Math.min(totalPendingPages, p + 1))} disabled={pendingPage === totalPendingPages}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assegnazioni">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Assegnazione Operatori a Medici
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Assegna uno o più medici refertatori a ogni operatore. I documenti caricati dall'operatore
                verranno resi disponibili ai medici assegnati.
              </p>

              {operatorsLoading || doctorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : !operators?.length ? (
                <p className="text-gray-500 text-center py-8">
                  Nessun operatore configurato. Crea utenti con il ruolo "Operatore Caricamento".
                </p>
              ) : !doctors?.length ? (
                <p className="text-gray-500 text-center py-8">
                  Nessun medico refertatore disponibile. Crea utenti con il ruolo "Medico Refertatore".
                </p>
              ) : (
                <div className="space-y-6">
                  {operators.map((operator) => (
                    <div
                      key={operator.id}
                      className="p-4 bg-gray-50 rounded-lg border"
                      data-testid={`operator-${operator.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {operator.firstName} {operator.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{operator.email}</p>
                        </div>
                        <span className="text-sm text-blue-600 font-medium">
                          {operator.assignedDoctorIds?.length || 0} medici assegnati
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {doctors.map((doctor) => {
                          const isAssigned = operator.assignedDoctorIds?.includes(doctor.id) || false;
                          return (
                            <div
                              key={doctor.id}
                              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                isAssigned 
                                  ? "bg-blue-100 border border-blue-300" 
                                  : "bg-white border border-gray-200 hover:bg-gray-100"
                              }`}
                              onClick={() => handleDoctorToggle(operator.id, doctor.id, isAssigned)}
                              data-testid={`assign-${operator.id}-${doctor.id}`}
                            >
                              <Checkbox
                                checked={isAssigned}
                                disabled={addDoctorMutation.isPending || removeDoctorMutation.isPending}
                              />
                              <span className="text-sm">
                                Dr. {doctor.firstName} {doctor.lastName}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {operator.assignedDoctors && operator.assignedDoctors.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Medici assegnati:</p>
                          <div className="flex flex-wrap gap-1">
                            {operator.assignedDoctors.map((doc) => (
                              <span
                                key={doc.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                              >
                                {doc.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDoctorToggle(operator.id, doc.id, true);
                                  }}
                                  className="hover:text-red-600"
                                  data-testid={`remove-${operator.id}-${doc.id}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {doctors && doctors.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-3">Medici Refertatori Disponibili</h3>
                  <div className="space-y-2">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                        data-testid={`doctor-${doctor.id}`}
                      >
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {doctor.email}
                            {doctor.specialization && ` | ${doctor.specialization}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}