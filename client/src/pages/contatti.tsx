import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, MessageSquare, HelpCircle, Phone, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

const contactSchema = z.object({
  name: z.string().min(2, "Il nome deve contenere almeno 2 caratteri"),
  email: z.string().email("Email non valida"),
  subject: z.string().min(3, "L'oggetto deve contenere almeno 3 caratteri"),
  message: z.string().min(10, "Il messaggio deve contenere almeno 10 caratteri"),
  privacy: z.boolean().refine(val => val === true, {
    message: "Devi accettare la privacy policy per inviare il messaggio"
  }),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contatti() {
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      privacy: false,
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest('/api/contact', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Messaggio inviato!",
        description: "Ti risponderemo il prima possibile a support@ciry.app",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'invio del messaggio",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4" data-testid="badge-contact">
            Contatti
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Parliamo del tuo percorso
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Hai domande? Vuoi informazioni sui nostri corsi? Siamo qui per aiutarti!
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Invia un Messaggio
            </CardTitle>
            <CardDescription>
              Compila il form e ti risponderemo entro 24 ore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Il tuo nome" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tua@email.it" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oggetto</FormLabel>
                      <FormControl>
                        <Input placeholder="Di cosa vorresti parlare?" {...field} data-testid="input-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Messaggio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Scrivi qui il tuo messaggio..."
                          rows={6}
                          {...field}
                          data-testid="textarea-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="privacy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-privacy"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Autorizzo il trattamento dei miei dati personali *
                        </FormLabel>
                        <FormDescription>
                          Ho letto e accetto la{" "}
                          <Link href="/page/privacy-policy">
                            <span className="text-primary hover:underline cursor-pointer">
                              Privacy Policy
                            </span>
                          </Link>
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  data-testid="button-submit-contact"
                  disabled={contactMutation.isPending}
                >
                  {contactMutation.isPending ? "Invio in corso..." : "Invia Messaggio"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
