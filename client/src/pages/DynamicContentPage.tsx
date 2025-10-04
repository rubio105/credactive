import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface DynamicContentPageProps {
  slug?: string;
}

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DynamicContentPage(props: DynamicContentPageProps | any) {
  const [, params] = useRoute("/page/:slug");
  const slug = props?.slug || params?.slug || "";
  const { data: page, isLoading, error } = useQuery<ContentPage>({
    queryKey: ["/api/content-pages", slug],
    queryFn: async () => {
      const response = await fetch(`/api/content-pages/${slug}`);
      if (!response.ok) {
        throw new Error('Pagina non trovata');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Pagina non trovata</h1>
              <p className="text-muted-foreground">
                La pagina che stai cercando non è disponibile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Badge className="mb-4" data-testid={`badge-${slug}`}>
            <FileText className="w-3 h-3 mr-1" />
            {page.title}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold" data-testid={`title-${slug}`}>
            {page.title}
          </h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
              data-testid={`content-${slug}`}
            />
          </CardContent>
        </Card>

        <div className="mt-8 text-sm text-muted-foreground text-center">
          Ultimo aggiornamento: {new Date(page.updatedAt).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>
    </div>
  );
}
