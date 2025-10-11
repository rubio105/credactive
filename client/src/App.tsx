import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { HelmetProvider } from 'react-helmet-async';
import CookieBanner from "@/components/cookie-banner";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Quiz from "@/pages/quiz";
import Dashboard from "@/pages/dashboard";
import Subscribe from "@/pages/subscribe";
import Report from "@/pages/report";
import Admin from "@/pages/admin";
import ChiSiamo from "@/pages/chi-siamo";
import Contatti from "@/pages/contatti";
import DynamicContentPage from "@/pages/DynamicContentPage";
import Login from "@/pages/login";
import Register from "@/pages/register";
import VerifyEmail from "@/pages/verify-email";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Logout from "@/pages/logout";
import NotFound from "@/pages/not-found";
import CorsiOnDemand from "@/pages/corsi-on-demand";
import CorsoOnDemand from "@/pages/corso-on-demand";
import Settings from "@/pages/settings";
import Leaderboard from "@/pages/leaderboard";
import Certificates from "@/pages/certificates";
import Analytics from "@/pages/analytics";
import CorporatePortal from "@/pages/corporate-portal";
import CorporateJoin from "@/pages/corporate-join";
import LiveSession from "@/pages/live-session";
import Prevention from "@/pages/prevention";
import WebinarHealth from "@/pages/webinar-health";
import CrosswordPage from "@/pages/crossword";
import PatientAI from "@/pages/patient-ai";
import ProtectedRoute from "@/components/ProtectedRoute";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/chi-siamo" component={ChiSiamo} />
      <Route path="/contatti" component={Contatti} />
      <Route path="/patient-ai" component={PatientAI} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/logout" component={Logout} />
      <Route path="/dashboard">
        {() => <ProtectedRoute requireNonAiOnly><Dashboard /></ProtectedRoute>}
      </Route>
      <Route path="/subscribe">
        {() => <ProtectedRoute requireNonAiOnly><Subscribe /></ProtectedRoute>}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute requireNonAiOnly><Settings /></ProtectedRoute>}
      </Route>
      <Route path="/leaderboard">
        {() => <ProtectedRoute requireNonAiOnly><Leaderboard /></ProtectedRoute>}
      </Route>
      <Route path="/certificates">
        {() => <ProtectedRoute requireNonAiOnly><Certificates /></ProtectedRoute>}
      </Route>
      <Route path="/analytics">
        {() => <ProtectedRoute requireNonAiOnly><Analytics /></ProtectedRoute>}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute requireNonAiOnly><Admin /></ProtectedRoute>}
      </Route>
      <Route path="/corporate">
        {() => <ProtectedRoute requireNonAiOnly><CorporatePortal /></ProtectedRoute>}
      </Route>
      <Route path="/corporate/join/:token">
        {() => <ProtectedRoute requireNonAiOnly><CorporateJoin /></ProtectedRoute>}
      </Route>
      <Route path="/prevention" component={Prevention} />
      <Route path="/webinar-health" component={WebinarHealth} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/">
            {() => <ProtectedRoute requireNonAiOnly><Home /></ProtectedRoute>}
          </Route>
          <Route path="/quiz/:quizId">
            {() => <ProtectedRoute requireNonAiOnly><Quiz /></ProtectedRoute>}
          </Route>
          <Route path="/report/:attemptId">
            {() => <ProtectedRoute requireNonAiOnly><Report /></ProtectedRoute>}
          </Route>
          <Route path="/corsi-on-demand">
            {() => <ProtectedRoute requireNonAiOnly><CorsiOnDemand /></ProtectedRoute>}
          </Route>
          <Route path="/corsi-on-demand/:courseId">
            {() => <ProtectedRoute requireNonAiOnly><CorsoOnDemand /></ProtectedRoute>}
          </Route>
          <Route path="/live-session/:sessionId">
            {() => <ProtectedRoute requireNonAiOnly><LiveSession /></ProtectedRoute>}
          </Route>
          <Route path="/crossword/:id">
            {() => <ProtectedRoute requireNonAiOnly><CrosswordPage /></ProtectedRoute>}
          </Route>
        </>
      )}
      <Route path="/page/:slug" component={DynamicContentPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <CookieBanner />
          <FeedbackDialog />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
