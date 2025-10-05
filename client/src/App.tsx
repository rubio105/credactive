import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import CookieBanner from "@/components/cookie-banner";
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
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Logout from "@/pages/logout";
import NotFound from "@/pages/not-found";
import CorsiOnDemand from "@/pages/corsi-on-demand";
import CorsoOnDemand from "@/pages/corso-on-demand";
import Settings from "@/pages/settings";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/chi-siamo" component={ChiSiamo} />
      <Route path="/contatti" component={Contatti} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/logout" component={Logout} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/quiz/:quizId" component={Quiz} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/report/:attemptId" component={Report} />
          <Route path="/admin" component={Admin} />
          <Route path="/corsi-on-demand" component={CorsiOnDemand} />
          <Route path="/corsi-on-demand/:courseId" component={CorsoOnDemand} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route path="/page/:slug" component={DynamicContentPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <CookieBanner />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
