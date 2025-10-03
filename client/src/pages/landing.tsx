import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import QuizCard from "@/components/quiz-card";
import { ShieldCheck, Star, CheckCircle, PlayCircle, Crown, Trophy, ChartLine, Clock, Flame } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  isPremium: boolean;
}

export default function Landing() {
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const quizCategories = [
    {
      id: "1",
      title: "Cyber Security Awareness",
      description: "Impara i concetti base della sicurezza informatica, riconosci le minacce comuni e proteggi i tuoi dati.",
      duration: 30,
      questions: 50,
      difficulty: "Principiante",
      level: "Fondamentale",
      isPremium: false,
      category: "certifications",
      gradient: "from-blue-600 to-blue-700",
      icon: "shield-alt"
    },
    {
      id: "2",
      title: "CISM - Certified Information Security Manager",
      description: "Preparati per la certificazione CISM con domande realistiche su governance, gestione del rischio e incident management.",
      duration: 90,
      questions: 150,
      difficulty: "Avanzato",
      level: "Certificazione",
      isPremium: true,
      category: "certifications",
      gradient: "from-slate-700 to-blue-600",
      icon: "user-shield"
    },
    {
      id: "3",
      title: "CISSP - Certified Information Systems Security Professional",
      description: "Quiz completo per la certificazione CISSP coprendo tutti gli 8 domini del CBK.",
      duration: 180,
      questions: 250,
      difficulty: "Esperto",
      level: "Certificazione",
      isPremium: true,
      category: "certifications",
      gradient: "from-purple-600 to-blue-600",
      icon: "certificate"
    },
    {
      id: "4",
      title: "ISO 27001/27002",
      description: "Approfondisci gli standard internazionali per la gestione della sicurezza delle informazioni.",
      duration: 60,
      questions: 100,
      difficulty: "Intermedio",
      level: "Standard",
      isPremium: true,
      category: "compliance",
      gradient: "from-green-600 to-teal-600",
      icon: "file-contract"
    },
    {
      id: "5",
      title: "GDPR - General Data Protection Regulation",
      description: "Testa la tua conoscenza del regolamento europeo sulla protezione dei dati personali.",
      duration: 45,
      questions: 75,
      difficulty: "Intermedio",
      level: "Compliance",
      isPremium: true,
      category: "compliance",
      gradient: "from-blue-800 to-indigo-800",
      icon: "balance-scale"
    },
    {
      id: "6",
      title: "EU Privacy Law & ePrivacy",
      description: "Esplora le normative europee sulla privacy e le direttive ePrivacy.",
      duration: 40,
      questions: 60,
      difficulty: "Intermedio",
      level: "Compliance",
      isPremium: true,
      category: "compliance",
      gradient: "from-indigo-600 to-purple-600",
      icon: "user-lock"
    },
    {
      id: "7",
      title: "AI Security & Ethics",
      description: "Sicurezza nell'intelligenza artificiale, vulnerabilità dei modelli ML e considerazioni etiche.",
      duration: 50,
      questions: 80,
      difficulty: "Avanzato",
      level: "AI & ML",
      isPremium: true,
      category: "ai",
      gradient: "from-cyan-600 to-blue-600",
      icon: "brain"
    },
    {
      id: "8",
      title: "Data Protection & Privacy",
      description: "Tecniche avanzate di protezione dei dati, crittografia e best practices per la privacy.",
      duration: 55,
      questions: 90,
      difficulty: "Avanzato",
      level: "Privacy",
      isPremium: true,
      category: "ai",
      gradient: "from-pink-600 to-rose-600",
      icon: "database"
    },
    {
      id: "9",
      title: "Threat Intelligence & AI",
      description: "Utilizzo dell'AI per la threat intelligence, detection e response automatizzato.",
      duration: 70,
      questions: 95,
      difficulty: "Esperto",
      level: "Threat Intel",
      isPremium: true,
      category: "ai",
      gradient: "from-red-600 to-orange-600",
      icon: "biohazard"
    },
    {
      id: "10",
      title: "SecOps & AI Automation",
      description: "Automazione delle operazioni di sicurezza con AI, SOAR e orchestrazione.",
      duration: 65,
      questions: 85,
      difficulty: "Esperto",
      level: "SecOps",
      isPremium: true,
      category: "ai",
      gradient: "from-violet-600 to-fuchsia-600",
      icon: "robot"
    }
  ];

  const filteredQuizzes = activeFilter === "all" 
    ? quizCategories 
    : quizCategories.filter(quiz => quiz.category === activeFilter);

  const handleStartQuiz = (quizId: string, isPremium: boolean) => {
    if (isPremium) {
      // Show premium modal or redirect to subscribe
      document.getElementById('payment-modal')?.classList.remove('hidden');
    } else {
      // Start free quiz
      window.location.href = `/api/login`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

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
                Piattaforma #1 per Certificazioni Cybersecurity
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Prepara le tue <span className="text-accent">Certificazioni</span> con Quiz Professionali
              </h1>
              <p className="text-lg md:text-xl text-white/90">
                Oltre 2.000 domande aggiornate per CISSP, CISM, ISO 27001, GDPR e molto altro. Migliora le tue competenze in Cybersecurity con quiz interattivi e feedback immediato.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg"
                  className="bg-white text-secondary hover:bg-white/90 shadow-xl text-lg px-8 py-4 h-auto"
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-start-free"
                >
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Inizia Gratis
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
              <div className="flex items-center space-x-8 pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm">2.000+ Domande</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm">10 Categorie</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm">Certificati</span>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-full"></div>
              <Card className="relative shadow-2xl border-white/20 overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-96 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Dashboard Preview</h3>
                      <p className="text-slate-600">Monitora i tuoi progressi</p>
                    </div>
                  </div>
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

      {/* Social Proof Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">Trusted by professionals from</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="flex justify-center" data-testid="partner-techcorp">
              <span className="text-2xl font-bold text-muted-foreground">TechCorp</span>
            </div>
            <div className="flex justify-center" data-testid="partner-secureit">
              <span className="text-2xl font-bold text-muted-foreground">SecureIT</span>
            </div>
            <div className="flex justify-center" data-testid="partner-dataguard">
              <span className="text-2xl font-bold text-muted-foreground">DataGuard</span>
            </div>
            <div className="flex justify-center" data-testid="partner-cybershield">
              <span className="text-2xl font-bold text-muted-foreground">CyberShield</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Catalog */}
      <section className="py-16" id="quiz-catalog">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Esplora i Nostri Quiz</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Scegli tra una vasta gamma di quiz professionali per prepararti alle certificazioni più richieste nel settore della cybersecurity.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              onClick={() => setActiveFilter("all")}
              className="rounded-full"
              data-testid="filter-all"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Tutti
            </Button>
            <Button
              variant={activeFilter === "certifications" ? "default" : "outline"}
              onClick={() => setActiveFilter("certifications")}
              className="rounded-full"
              data-testid="filter-certifications"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Certificazioni
            </Button>
            <Button
              variant={activeFilter === "compliance" ? "default" : "outline"}
              onClick={() => setActiveFilter("compliance")}
              className="rounded-full"
              data-testid="filter-compliance"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Compliance
            </Button>
            <Button
              variant={activeFilter === "ai" ? "default" : "outline"}
              onClick={() => setActiveFilter("ai")}
              className="rounded-full"
              data-testid="filter-ai"
            >
              <ChartLine className="w-4 h-4 mr-2" />
              AI & Security
            </Button>
          </div>

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

          {/* Upgrade CTA */}
          <Card className="gradient-primary text-white shadow-2xl overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="max-w-3xl mx-auto">
                <div className="inline-block p-4 bg-white/20 rounded-full mb-6">
                  <Crown className="w-12 h-12" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Sblocca Tutti i Quiz</h2>
                <p className="text-lg md:text-xl mb-8 text-white/90">
                  Accedi a oltre 2.000 domande professionali, 10 categorie complete e certificati di completamento con un unico pagamento.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-medium">Accesso illimitato</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-medium">Aggiornamenti inclusi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-medium">Supporto prioritario</span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 inline-block">
                  <div className="text-5xl font-bold mb-2">€30</div>
                  <div className="text-lg text-white/80">Pagamento unico - Accesso a vita</div>
                </div>
                <Button 
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-xl font-bold text-lg px-12 py-4 h-auto"
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-unlock-now"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Sblocca Ora
                </Button>
                <p className="text-sm text-white/70 mt-4">Pagamento sicuro con Stripe • Garanzia 30 giorni soddisfatti o rimborsati</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">CyberQuiz<span className="text-primary">Pro</span></span>
              </div>
              <p className="text-white/70 text-sm">La piattaforma leader per la preparazione alle certificazioni di cybersecurity.</p>
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
                <li><a href="#" className="hover:text-white transition-colors">Chi Siamo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contatti</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termini di Servizio</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/70 mb-4 md:mb-0">© 2024 CyberQuizPro. Tutti i diritti riservati.</p>
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
