import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Stethoscope, FileText, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function MediciPage() {
  const [activeTab, setActiveTab] = useState("medici");

  const { data: notes = [], isLoading } = useQuery<DoctorNote[]>({
    queryKey: ["/api/patient/notes"],
  });

  return (
    <div className="p-4 pb-20 md:pb-4" data-testid="medici-page">
      <Card className="shadow-sm border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            <CardTitle>I Miei Medici</CardTitle>
          </div>
          <CardDescription>Gestisci i tuoi medici e visualizza i loro documenti</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="medici" data-testid="tab-medici">
                <Stethoscope className="w-4 h-4 mr-2" />
                Medici
              </TabsTrigger>
              <TabsTrigger value="documenti" data-testid="tab-documenti">
                <FileText className="w-4 h-4 mr-2" />
                Documenti
              </TabsTrigger>
            </TabsList>

            <TabsContent value="medici" className="space-y-4 mt-4">
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">
                  Nessun medico collegato
                </p>
                <Button data-testid="btn-collega-medico">
                  Collega Medico
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="documenti" className="space-y-4 mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <Card key={note.id} data-testid={`note-${note.id}`}>
                    <CardHeader>
                      <CardTitle className="text-base">{note.title}</CardTitle>
                      <CardDescription>
                        {new Date(note.createdAt).toLocaleDateString("it-IT")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.content}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Nessun documento disponibile</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
