import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import QuizCard from "@/components/quiz-card";
import { SEO } from "@/components/SEO";
import { mapCategoriesToQuizCards } from "@/lib/quizUtils";
import type { Category, QuizWithCount } from "@shared/schema";
import { Star, CheckCircle, PlayCircle, Crown, Trophy, ChartLine, Calendar, Users, Video, Sparkles, Headphones, Stethoscope, Clock, Shield } from "lucide-react";
import { featuredImages } from "@/lib/stockImages";
const logoImage = "/images/ciry-logo.png";
const certificationsImage = "/images/certifications.png";

export default function Landing() {
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: categoriesWithQuizzes = [], isLoading } = useQuery<Array<Category & { quizzes: QuizWithCount[] }>>({
    queryKey: ["/api/categories-with-quizzes"],
  });

  const quizCategories = mapCategoriesToQuizCards(categoriesWithQuizzes);

  const filteredQuizzes = activeFilter === "all" 
    ? quizCategories 
    : quizCategories.filter(quiz => quiz.category === activeFilter);

  const handleStartQuiz = (quizId: string, isPremium: boolean) => {
    if (isPremium) {
      // Show premium modal or redirect to subscribe
      document.getElementById('payment-modal')?.classList.remove('hidden');
    } else {
      // Start free quiz
      window.location.href = `/login`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="CIRY - Care & Intelligence Ready for You | Cybersecurity & Health Prevention"
        description="CIRY unisce salute e sicurezza digitale. Certificazioni cybersecurity (CISSP, CISM, ISO 27001) + AI per prevenzione sanitaria. Oltre 1.000.000 di domande, corsi live e health reports personalizzati."
        keywords="CIRY, cybersecurity certificazioni, CISSP online, CISM training, ISO 27001, prevenzione sanitaria AI, health report, medical AI, GDPR, NIS2, DORA, sicurezza informatica, intelligenza artificiale salute"
        canonicalUrl="https://ciry.app"
      />
      <Navigation useLandingLogo={true} />

      {/* Hero Section */}
      <section className="relative gradient-secondary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`
            }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 fade-in">
              <Badge className="bg-white/10 backdrop-blur-sm text-white border-white/20" data-testid="badge-hero">
                <Star className="w-4 h-4 mr-2 text-warning" />
                Care & Intelligence Ready for You
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                La formazione che unisce <span className="text-accent">Salute</span> e <span className="text-accent">Sicurezza Digitale</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90">
                CIRY combina certificazioni cybersecurity professionali (CISSP, CISM, ISO 27001) con AI per la prevenzione sanitaria. Oltre 1.000.000 di domande, corsi live, health reports personalizzati e assistente AI per la tua salute.
              </p>
              <p className="text-base md:text-lg text-white/80">
                Guidati da esperti riconosciuti a livello nazionale e internazionale, offriamo una piattaforma interattiva dedicata ad aziende e professionisti che vogliono eccellere nelle certificazioni di Cybersecurity, Compliance, AI Security, Leadership e guida alla prevenzione medica intelligente con il supporto di AI avanzata.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg"
                  className="bg-white text-secondary hover:bg-white/90 shadow-xl text-lg px-8 py-4 h-auto"
                  onClick={() => window.location.href = '/prevention'}
                  data-testid="button-ciry-chat"
                >
                  Prova Ciry
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 text-lg px-8 py-4 h-auto"
                  onClick={() => document.getElementById('quiz-catalog')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-discover"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Scopri di più
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm">1.000.000+ Domande</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  <span className="text-sm">🏆 Sfide & Badge</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-success" />
                  <span className="text-sm">Corsi On-Demand</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-success" />
                  <span className="text-sm">Corsi Live</span>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-full"></div>
              <Card className="relative shadow-2xl border-white/20 overflow-hidden">
                <CardContent className="p-0">
                  <img 
                    src={featuredImages.hero} 
                    alt="Professional Certification Training Platform" 
                    className="w-full h-96 object-cover"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(210 40% 98%)"/>
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gradient-to-b from-background to-secondary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              La piattaforma che unisce formazione e prevenzione
            </h3>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Offriamo un <span className="font-bold text-foreground">metodo innovativo di apprendimento continuo</span> che 
              integra <span className="font-semibold text-primary">corsi</span>, <span className="font-semibold text-primary">webinar con specialisti</span>, 
              <span className="font-semibold text-primary">quiz interattivi</span> e <span className="font-semibold text-primary">dinamiche di gaming</span> per 
              rendere la formazione coinvolgente e pratica.
            </p>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              La nostra missione è <span className="font-bold text-foreground">diffondere una cultura della prevenzione digitale e medica</span>, 
              aiutando <span className="font-bold text-primary">aziende e professionisti</span> a crescere con competenze certificate in 
              Cybersecurity, Compliance, AI Security, Leadership e <span className="font-bold text-orange-600">prevenzione sanitaria intelligente</span>.
            </p>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Guidati da <span className="font-bold text-foreground">esperti riconosciuti a livello nazionale e internazionale</span> e 
              supportati da un <span className="font-semibold text-foreground">modello AI avanzato</span>, trasformiamo l'apprendimento in 
              un'esperienza <span className="font-semibold text-primary">interattiva, utile e orientata al futuro</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Live Courses Section - Prominently Displayed */}
      <section className="py-16 bg-gradient-to-br from-accent/10 via-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-accent/30 shadow-2xl overflow-hidden">
            <div className="gradient-primary text-white p-8 md:p-12">
              <div className="text-center max-w-4xl mx-auto">
                <div className="inline-block p-4 bg-white/20 rounded-full mb-6">
                  <Calendar className="w-12 h-12" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                  📅 Corsi Live con Esperti
                </h2>
                <p className="text-lg md:text-xl text-white/90 mb-8">
                  Partecipa ai nostri corsi live interattivi con docenti certificati. Sessioni in diretta, Q&A in tempo reale e certificati di partecipazione.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <Video className="w-8 h-8 mb-3 mx-auto" />
                    <h3 className="font-bold text-lg mb-2">Sessioni Live</h3>
                    <p className="text-sm text-white/80">Lezioni interattive con docenti esperti in tempo reale</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <Users className="w-8 h-8 mb-3 mx-auto" />
                    <h3 className="font-bold text-lg mb-2">Classi Ridotte</h3>
                    <p className="text-sm text-white/80">Massima attenzione con gruppi di apprendimento limitati</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <Trophy className="w-8 h-8 mb-3 mx-auto" />
                    <h3 className="font-bold text-lg mb-2">Certificato</h3>
                    <p className="text-sm text-white/80">Attestato di partecipazione riconosciuto al termine</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 shadow-xl font-bold text-lg px-12 py-6 h-auto"
                    onClick={() => window.location.href = '/login'}
                    data-testid="button-view-live-courses"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Scopri i Corsi Live
                  </Button>
                  {/* Registrazione disabilitata - pulsante rimosso */}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Quiz Catalog */}
      <section className="py-16" id="quiz-catalog">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Esplora i Nostri Quiz</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Scegli tra una vasta gamma di quiz professionali per prepararti alle certificazioni più richieste nel mercato.
            </p>
          </div>

          {/* Filter Section - Prominently Displayed */}
          <Card className="mb-12 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-bold mb-2 text-primary">
                  🎯 Filtra per Categoria
                </h3>
                <p className="text-muted-foreground">
                  Seleziona la categoria che ti interessa per visualizzare i quiz specifici
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant={activeFilter === "all" ? "default" : "outline"}
                  onClick={() => setActiveFilter("all")}
                  className="rounded-full text-base px-6 py-5 h-auto font-semibold"
                  data-testid="filter-all"
                >
                  Tutti
                </Button>
                <Button
                  variant={activeFilter === "certifications" ? "default" : "outline"}
                  onClick={() => setActiveFilter("certifications")}
                  className="rounded-full text-base px-6 py-5 h-auto font-semibold"
                  data-testid="filter-certifications"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Certificazioni
                </Button>
                <Button
                  variant={activeFilter === "compliance" ? "default" : "outline"}
                  onClick={() => setActiveFilter("compliance")}
                  className="rounded-full text-base px-6 py-5 h-auto font-semibold"
                  data-testid="filter-compliance"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Compliance
                </Button>
                <Button
                  variant={activeFilter === "ai" ? "default" : "outline"}
                  onClick={() => setActiveFilter("ai")}
                  className="rounded-full text-base px-6 py-5 h-auto font-semibold"
                  data-testid="filter-ai"
                >
                  <ChartLine className="w-5 h-5 mr-2" />
                  AI & Security
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onStartQuiz={() => handleStartQuiz(quiz.id, quiz.isPremium)}
              />
            ))}
          </div>

          {/* Subscription Plans */}
          <div id="subscriptions" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Scegli il Tuo Piano</h2>
            <p className="text-xl text-muted-foreground">
              Quiz professionali e corsi per la tua formazione certificata
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Premium Plan */}
            <Card className="relative border-2 hover:border-primary transition-all shadow-xl">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="inline-block p-3 bg-primary/10 rounded-lg mb-4">
                    <Crown className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Premium</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-5xl font-bold">€99</span>
                    <span className="text-muted-foreground ml-2">/anno</span>
                  </div>
                  <p className="text-muted-foreground">
                    Accesso completo a tutti i quiz professionali
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>10 categorie di quiz professionali</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Oltre 1.000.000 di domande aggiornate</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Certificati di completamento</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Dashboard e statistiche avanzate</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Supporto via email</span>
                  </div>
                </div>

                <Button 
                  onClick={() => window.location.href = '/register'}
                  className="w-full py-6 text-lg font-semibold"
                  data-testid="button-select-premium-home"
                >
                  Inizia con Premium
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plus Plan */}
            <Card className="relative border-2 border-primary shadow-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="px-4 py-1 bg-primary text-primary-foreground">
                  PIÙ POPOLARE
                </Badge>
              </div>
              
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="inline-block p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Premium Plus</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-5xl font-bold">€149</span>
                    <span className="text-muted-foreground ml-2">/anno</span>
                  </div>
                  <p className="text-muted-foreground">
                    Tutto in Premium, più corsi e vantaggi esclusivi
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">Tutto incluso in Premium</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Video className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Corsi On-Demand</strong> - Videocorsi completi con quiz</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Priorità Corsi Live</strong> - Accesso prioritario alle sessioni</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Headphones className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Supporto Dedicato</strong> - Consulenza certificazioni</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Eventi Esclusivi</strong> - Webinar e networking</span>
                  </div>
                </div>

                <Button 
                  onClick={() => window.location.href = '/register'}
                  className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  data-testid="button-select-premium-plus-home"
                >
                  Inizia con Premium Plus
                </Button>
              </CardContent>
            </Card>

            {/* Piano Sanitario */}
            <Card className="relative border-2 border-emerald-500 hover:border-emerald-600 transition-all shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="px-4 py-1 bg-emerald-600 text-white">
                  PER SANITARI
                </Badge>
              </div>
              
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="inline-block p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mb-4">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Piano Sanitario</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-5xl font-bold">€29</span>
                    <span className="text-muted-foreground ml-2">/mese</span>
                  </div>
                  <p className="text-muted-foreground">
                    Supporto medico completo per i professionisti della salute
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Consultazione Medica H24</strong> - Supporto sempre disponibile</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Video className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Webinar Sanitari</strong> - Formazione continua specializzata</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Eventi Esclusivi</strong> - Networking professionale</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Sconti Assicurazioni</strong> - Convenzioni con partner selezionati</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Accesso prioritario alle risorse</span>
                  </div>
                </div>

                <Button 
                  onClick={() => window.location.href = '/register'}
                  className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  data-testid="button-select-healthcare-home"
                >
                  Abbonati al Piano Sanitario
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Pagamento sicuro con Stripe • Cancellabile in qualsiasi momento • Garanzia 30 giorni
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img 
                  src={logoImage} 
                  alt="CIRY" 
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-white/70 text-sm">La piattaforma leader per la preparazione alle certificazioni professionali.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quiz</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">CISSP</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CISM</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ISO 27001</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Risorse</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Supporto</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Azienda</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termini di Servizio</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/70 mb-4 md:mb-0">© 2024 CIRY. Tutti i diritti riservati.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
