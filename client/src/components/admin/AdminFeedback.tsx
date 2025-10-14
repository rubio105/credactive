import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, MessageSquare, Calendar, User, Filter, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserFeedback {
  id: number;
  userId: string | null;
  rating: number;
  comment: string | null;
  message: string | null;
  category: string | null;
  page: string | null;
  source: string | null;
  isResolved: boolean;
  adminNotes: string | null;
  createdAt: string;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export function AdminFeedback() {
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [resolvedFilter, setResolvedFilter] = useState<string>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isResolved, setIsResolved] = useState(false);

  const { data: feedbacks, isLoading } = useQuery<UserFeedback[]>({
    queryKey: ["/api/admin/feedback"],
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, isResolved, adminNotes }: { id: number; isResolved: boolean; adminNotes?: string }) => {
      return apiRequest(`/api/admin/feedback/${id}`, "PATCH", { isResolved, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      toast({
        title: "Feedback aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });
      setSelectedFeedback(null);
      setAdminNotes("");
      setIsResolved(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenFeedback = (feedback: UserFeedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.adminNotes || "");
    setIsResolved(feedback.isResolved);
  };

  const handleUpdateFeedback = () => {
    if (!selectedFeedback) return;
    
    updateFeedbackMutation.mutate({
      id: selectedFeedback.id,
      isResolved,
      adminNotes: adminNotes.trim() || undefined,
    });
  };

  const filteredFeedbacks = feedbacks?.filter((feedback) => {
    if (categoryFilter !== "all" && feedback.category !== categoryFilter) return false;
    if (resolvedFilter === "resolved" && !feedback.isResolved) return false;
    if (resolvedFilter === "unresolved" && feedback.isResolved) return false;
    return true;
  }) || [];

  const stats = {
    total: feedbacks?.length || 0,
    unresolved: feedbacks?.filter((f) => !f.isResolved).length || 0,
    avgRating: feedbacks?.length
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : "0",
    byCategory: {
      improvement: feedbacks?.filter((f) => f.category === "improvement").length || 0,
      bug: feedbacks?.filter((f) => f.category === "bug").length || 0,
      feature_request: feedbacks?.filter((f) => f.category === "feature_request").length || 0,
      other: feedbacks?.filter((f) => f.category === "other").length || 0,
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Totale Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Da Risolvere</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unresolved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valutazione Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.avgRating}</div>
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bug Segnalati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.byCategory.bug}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione per Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Miglioramenti</div>
              <div className="text-2xl font-bold">{stats.byCategory.improvement}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Bug</div>
              <div className="text-2xl font-bold">{stats.byCategory.bug}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Funzionalità</div>
              <div className="text-2xl font-bold">{stats.byCategory.feature_request}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Altro</div>
              <div className="text-2xl font-bold">{stats.byCategory.other}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label>Categoria</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="filter-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                <SelectItem value="improvement">Miglioramenti</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature_request">Funzionalità</SelectItem>
                <SelectItem value="other">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <Label>Stato</Label>
            <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
              <SelectTrigger data-testid="filter-resolved">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="unresolved">Da Risolvere</SelectItem>
                <SelectItem value="resolved">Risolti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nessun feedback trovato</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <Card
              key={feedback.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenFeedback(feedback)}
              data-testid={`feedback-card-${feedback.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < feedback.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      
                      {feedback.category && (
                        <Badge variant="outline">
                          {feedback.category === "improvement" && "Miglioramento"}
                          {feedback.category === "bug" && "Bug"}
                          {feedback.category === "feature_request" && "Funzionalità"}
                          {feedback.category === "other" && "Altro"}
                        </Badge>
                      )}
                      
                      <Badge variant={feedback.isResolved ? "default" : "destructive"}>
                        {feedback.isResolved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Risolto
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Da Risolvere
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {feedback.user
                          ? `${feedback.user.firstName || ""} ${feedback.user.lastName || ""}`.trim() || feedback.user.email
                          : "Utente sconosciuto"}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(feedback.createdAt), "dd MMM yyyy, HH:mm", { locale: it })}
                      </span>
                      
                      {feedback.page && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {feedback.page}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {(feedback.message || feedback.comment) && (
                <CardContent>
                  <p className="text-sm line-clamp-2">
                    {feedback.message || feedback.comment}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Feedback Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettagli Feedback</DialogTitle>
            <DialogDescription>
              Visualizza e gestisci il feedback dell'utente
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="space-y-2">
                <Label>Utente</Label>
                <div className="text-sm">
                  <div className="font-medium">
                    {selectedFeedback.user
                      ? `${selectedFeedback.user.firstName || ""} ${selectedFeedback.user.lastName || ""}`.trim() || selectedFeedback.user.email
                      : "Utente sconosciuto"}
                  </div>
                  {selectedFeedback.user && (
                    <div className="text-muted-foreground">{selectedFeedback.user.email}</div>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label>Valutazione</Label>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < selectedFeedback.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Category & Page */}
              <div className="grid grid-cols-2 gap-4">
                {selectedFeedback.category && (
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <div className="text-sm">
                      {selectedFeedback.category === "improvement" && "Miglioramento"}
                      {selectedFeedback.category === "bug" && "Bug"}
                      {selectedFeedback.category === "feature_request" && "Funzionalità"}
                      {selectedFeedback.category === "other" && "Altro"}
                    </div>
                  </div>
                )}
                
                {selectedFeedback.page && (
                  <div className="space-y-2">
                    <Label>Pagina</Label>
                    <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {selectedFeedback.page}
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              {(selectedFeedback.message || selectedFeedback.comment) && (
                <div className="space-y-2">
                  <Label>Messaggio</Label>
                  <div className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">
                    {selectedFeedback.message || selectedFeedback.comment}
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <Label>Data</Label>
                <div className="text-sm">
                  {format(new Date(selectedFeedback.createdAt), "dd MMMM yyyy, HH:mm", { locale: it })}
                </div>
              </div>

              {/* Admin Section */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-semibold">Gestione Admin</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Note Admin</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Aggiungi note interne sul feedback..."
                    rows={4}
                    data-testid="textarea-admin-notes"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="resolved"
                    checked={isResolved}
                    onChange={(e) => setIsResolved(e.target.checked)}
                    className="rounded"
                    data-testid="checkbox-resolved"
                  />
                  <Label htmlFor="resolved" className="cursor-pointer">
                    Segna come risolto
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedFeedback(null)}
              data-testid="button-cancel"
            >
              Annulla
            </Button>
            <Button
              onClick={handleUpdateFeedback}
              disabled={updateFeedbackMutation.isPending}
              data-testid="button-save-feedback"
            >
              {updateFeedbackMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
