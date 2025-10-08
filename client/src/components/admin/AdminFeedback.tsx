import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface UserFeedback {
  id: number;
  userId: string | null;
  rating: number;
  comment: string | null;
  source: string | null;
  createdAt: string;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export function AdminFeedback() {
  const { data: feedbacks, isLoading } = useQuery<UserFeedback[]>({
    queryKey: ["/api/admin/feedback"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const averageRating = feedbacks?.length
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : "0.0";

  const ratingDistribution = feedbacks?.reduce((acc, f) => {
    acc[f.rating] = (acc[f.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Feedback Utenti</h2>
        <p className="text-muted-foreground">Valutazioni e commenti ricevuti dagli utenti</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Totale Feedback
            </CardDescription>
            <CardTitle className="text-3xl">{feedbacks?.length || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Valutazione Media
            </CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {averageRating}
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Con Commento</CardDescription>
            <CardTitle className="text-3xl">
              {feedbacks?.filter(f => f.comment).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Feedback 5 Stelle</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              {feedbacks?.filter(f => f.rating === 5).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Rating Distribution */}
      {ratingDistribution && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuzione Valutazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0;
                const percentage = feedbacks?.length
                  ? ((count / feedbacks.length) * 100).toFixed(0)
                  : "0";
                return (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tutti i Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utente</TableHead>
                  <TableHead>Valutazione</TableHead>
                  <TableHead className="hidden md:table-cell">Fonte</TableHead>
                  <TableHead className="hidden lg:table-cell">Data</TableHead>
                  <TableHead>Commento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks?.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>
                      {feedback.user ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {feedback.user.firstName} {feedback.user.lastName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {feedback.user.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Anonimo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: feedback.rating }, (_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                        {Array.from({ length: 5 - feedback.rating }, (_, i) => (
                          <Star key={i} className="w-4 h-4 text-gray-300" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {feedback.source || "popup"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(feedback.createdAt), "PPP", { locale: it })}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {feedback.comment ? (
                        <p className="text-sm line-clamp-2">{feedback.comment}</p>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Nessun commento
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!feedbacks || feedbacks.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nessun feedback ricevuto ancora
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
