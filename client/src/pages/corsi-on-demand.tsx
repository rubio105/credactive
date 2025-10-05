import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Video, Clock, BookOpen, Lock, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface OnDemandCourse {
  id: string;
  title: string;
  description?: string;
  instructor?: string;
  difficulty?: string;
  duration?: string;
  thumbnailUrl?: string;
  isPremiumPlus: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-700 dark:text-green-400",
  intermediate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  advanced: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  expert: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const difficultyLabels = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzato",
  expert: "Esperto",
};

export default function CorsiOnDemand() {
  const { user, isLoading: authLoading } = useAuth();
  const isPremiumPlus = user?.subscriptionTier === 'premium_plus';

  const { data: courses, isLoading: coursesLoading } = useQuery<OnDemandCourse[]>({
    queryKey: ["/api/on-demand-courses"],
    enabled: isPremiumPlus,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isPremiumPlus) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center p-12">
            <div className="inline-block p-4 bg-purple-500/10 rounded-full mb-6">
              <Lock className="w-12 h-12 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Contenuto Premium Plus</h1>
            <p className="text-lg text-muted-foreground mb-8">
              I corsi on-demand sono disponibili solo per gli abbonati Premium Plus.
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto mb-8">
              <div className="flex items-center space-x-3">
                <Video className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span>Videocorsi completi con quiz interattivi</span>
              </div>
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span>Contenuti aggiornati e certificati</span>
              </div>
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span>Accesso illimitato a tutti i corsi</span>
              </div>
            </div>
            <Link href="/subscribe">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="button-upgrade">
                <Crown className="w-5 h-5 mr-2" />
                Passa a Premium Plus
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Corsi On-Demand</h1>
          <p className="text-xl text-muted-foreground">
            Impara al tuo ritmo con videocorsi professionali e quiz interattivi
          </p>
        </div>

        {coursesLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-48 bg-muted rounded-md mb-4"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : !courses || courses.length === 0 ? (
          <Card className="text-center p-12">
            <div className="inline-block p-4 bg-muted rounded-full mb-4">
              <Video className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nessun corso disponibile</h3>
            <p className="text-muted-foreground">
              I corsi on-demand saranno disponibili a breve. Torna presto!
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover-scale overflow-hidden" data-testid={`card-course-${course.id}`}>
                <div className="relative">
                  {course.thumbnailUrl ? (
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Video className="w-16 h-16 text-white/80" />
                    </div>
                  )}
                  {course.difficulty && (
                    <Badge 
                      className={`absolute top-3 right-3 ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}
                    >
                      {difficultyLabels[course.difficulty as keyof typeof difficultyLabels]}
                    </Badge>
                  )}
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || "Corso completo con videolezioni e quiz"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 mb-4">
                    {course.instructor && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span>{course.instructor}</span>
                      </div>
                    )}
                    {course.duration && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{course.duration}</span>
                      </div>
                    )}
                  </div>

                  <Link href={`/corsi-on-demand/${course.id}`}>
                    <Button className="w-full" data-testid={`button-view-course-${course.id}`}>
                      Inizia il Corso
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
