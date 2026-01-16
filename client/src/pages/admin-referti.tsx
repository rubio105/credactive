import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  assignedDoctorId?: string;
  assignedDoctorName?: string;
}

interface Doctor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}

export default function AdminReferti() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: reports, isLoading: reportsLoading } = useQuery<ReportDocument[]>({
    queryKey: ["/api/report-documents/admin/all"],
  });

  const { data: operators, isLoading: operatorsLoading } = useQuery<Operator[]>({
    queryKey: ["/api/report-documents/admin/operators"],
  });

  const { data: doctors, isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/report-documents/admin/doctors"],
  });

  const assignDoctorMutation = useMutation({
    mutationFn: async ({ operatorId, doctorId }: { operatorId: string; doctorId: string | null }) => {
      return apiRequest("PATCH", "/api/report-documents/admin/assign-doctor", {
        operatorId,
        doctorId,
      });
    },
    onSuccess: () => {
      toast({ title: "Assegnazione aggiornata" });
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

  const signedReports = reports?.filter((r) => r.status === "signed") || [];
  const pendingReports = reports?.filter((r) => r.status !== "signed") || [];

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
                <div className="space-y-3">
                  {signedReports.map((report) => (
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
                <div className="space-y-3">
                  {pendingReports.map((report) => (
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
                Assegna ogni operatore a un medico refertatore. I documenti caricati dall'operatore
                verranno automaticamente assegnati al medico selezionato.
              </p>

              {operatorsLoading || doctorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : !operators?.length ? (
                <p className="text-gray-500 text-center py-8">
                  Nessun operatore configurato. Crea utenti con il ruolo "Operatore Caricamento".
                </p>
              ) : (
                <div className="space-y-4">
                  {operators.map((operator) => (
                    <div
                      key={operator.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                      data-testid={`operator-${operator.id}`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {operator.firstName} {operator.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{operator.email}</p>
                      </div>
                      <div className="w-64">
                        <Select
                          value={operator.assignedDoctorId || "none"}
                          onValueChange={(value) =>
                            assignDoctorMutation.mutate({
                              operatorId: operator.id,
                              doctorId: value === "none" ? null : value,
                            })
                          }
                        >
                          <SelectTrigger data-testid={`select-doctor-${operator.id}`}>
                            <SelectValue placeholder="Seleziona medico" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nessun medico</SelectItem>
                            {doctors?.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                Dr. {doctor.firstName} {doctor.lastName}
                                {doctor.specialization && ` - ${doctor.specialization}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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