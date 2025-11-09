import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useRoleTheme } from "@/hooks/useRoleTheme";
import { HelmetProvider } from 'react-helmet-async';
import CookieBanner from "@/components/cookie-banner";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import Landing from "@/pages/landing";
import Quiz from "@/pages/quiz";
import Subscribe from "@/pages/subscribe";
import PaymentSuccess from "@/pages/payment-success";
import Report from "@/pages/report";
import Admin from "@/pages/admin";
import AdminAudit from "@/pages/admin-audit";
import AdminLoginLogs from "@/pages/admin-login-logs";
import AdminMLTraining from "@/pages/admin-ml-training";
import AdminUsers from "@/pages/admin-users";
import AdminWebinar from "@/pages/admin-webinar";
import AdminRAG from "@/pages/admin-rag";
import AdminMail from "@/pages/admin-mail";
import AdminMarketing from "@/pages/admin-marketing";
import AdminAlerts from "@/pages/admin-alerts";
import AdminProactiveTriggers from "@/pages/admin-proactive-triggers";
import AdminFeedback from "@/pages/admin-feedback";
import AdminInAppNotifications from "@/pages/admin-in-app-notifications";
import AdminPushNotifications from "@/pages/admin-push-notifications";
import AdminSubscriptions from "@/pages/admin-subscriptions";
import AdminDocumentazione from "@/pages/admin-documentazione";
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
import PacchettoProhmed from "@/pages/pacchetto-prohmed";
import TeleconsultoPage from "@/pages/teleconsulto";
import Security from "@/pages/security";
import Guida from "@/pages/guida";
import Documenti from "@/pages/documenti";
import AppointmentsPage from "@/pages/appointments";
import DoctorAppointmentsPage from "@/pages/doctor-appointments";
import DoctorPatientsPage from "@/pages/doctor-patients";
import DoctorReportsPage from "@/pages/doctor-reports";
import WearablePage from "@/pages/wearable";
import Home from "@/pages/home";
import RoleDashboard from "@/pages/role-dashboard";
import MediciPage from "@/pages/medici";
import NotifichePage from "@/pages/notifiche";
import DoctorAlertsPage from "@/pages/doctor-alerts";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNavigation from "@/components/BottomNavigation";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Auto-subscribe patients to push notifications
  usePushNotifications();
  
  // Apply role-based theme
  useRoleTheme();

  return (
    <Switch>
      <Route path="/contatti" component={Contatti} />
      <Route path="/patient-ai" component={PatientAI} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/logout" component={Logout} />
      <Route path="/dashboard">
        {() => <ProtectedRoute requireNonAiOnly><RoleDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/subscribe">
        {() => <ProtectedRoute><Subscribe /></ProtectedRoute>}
      </Route>
      <Route path="/payment-success">
        {() => <ProtectedRoute requireNonAiOnly><PaymentSuccess /></ProtectedRoute>}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute requireNonAiOnly><Settings /></ProtectedRoute>}
      </Route>
      <Route path="/appointments">
        {() => <ProtectedRoute requireNonAiOnly><AppointmentsPage /></ProtectedRoute>}
      </Route>
      <Route path="/teleconsulto">
        {() => <ProtectedRoute requireNonAiOnly><TeleconsultoPage /></ProtectedRoute>}
      </Route>
      <Route path="/wearable">
        {() => <ProtectedRoute requireNonAiOnly><WearablePage /></ProtectedRoute>}
      </Route>
      <Route path="/doctor/appointments">
        {() => <ProtectedRoute requireNonAiOnly><DoctorAppointmentsPage /></ProtectedRoute>}
      </Route>
      <Route path="/doctor/patients">
        {() => <ProtectedRoute requireNonAiOnly><DoctorPatientsPage /></ProtectedRoute>}
      </Route>
      <Route path="/doctor/reports">
        {() => <ProtectedRoute requireNonAiOnly><DoctorReportsPage /></ProtectedRoute>}
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
      <Route path="/admin/audit">
        {() => <ProtectedRoute requireNonAiOnly><AdminAudit /></ProtectedRoute>}
      </Route>
      <Route path="/admin/login-logs">
        {() => <ProtectedRoute requireNonAiOnly><AdminLoginLogs /></ProtectedRoute>}
      </Route>
      <Route path="/admin/ml-training">
        {() => <ProtectedRoute requireNonAiOnly><AdminMLTraining /></ProtectedRoute>}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute requireNonAiOnly><AdminUsers /></ProtectedRoute>}
      </Route>
      <Route path="/admin/gestione-utenti">
        {() => <ProtectedRoute requireNonAiOnly><AdminUsers /></ProtectedRoute>}
      </Route>
      <Route path="/admin/webinar">
        {() => <ProtectedRoute requireNonAiOnly><AdminWebinar /></ProtectedRoute>}
      </Route>
      <Route path="/admin/rag">
        {() => <ProtectedRoute requireNonAiOnly><AdminRAG /></ProtectedRoute>}
      </Route>
      <Route path="/admin/mail">
        {() => <ProtectedRoute requireNonAiOnly><AdminMail /></ProtectedRoute>}
      </Route>
      <Route path="/admin/marketing">
        {() => <ProtectedRoute requireNonAiOnly><AdminMarketing /></ProtectedRoute>}
      </Route>
      <Route path="/admin/alerts">
        {() => <ProtectedRoute requireNonAiOnly><AdminAlerts /></ProtectedRoute>}
      </Route>
      <Route path="/admin/proactive-triggers">
        {() => <ProtectedRoute requireNonAiOnly><AdminProactiveTriggers /></ProtectedRoute>}
      </Route>
      <Route path="/admin/feedback">
        {() => <ProtectedRoute requireNonAiOnly><AdminFeedback /></ProtectedRoute>}
      </Route>
      <Route path="/admin/in-app-notifications">
        {() => <ProtectedRoute requireNonAiOnly><AdminInAppNotifications /></ProtectedRoute>}
      </Route>
      <Route path="/admin/push-notifications">
        {() => <ProtectedRoute requireNonAiOnly><AdminPushNotifications /></ProtectedRoute>}
      </Route>
      <Route path="/admin/subscriptions">
        {() => <ProtectedRoute requireNonAiOnly><AdminSubscriptions /></ProtectedRoute>}
      </Route>
      <Route path="/admin/documentazione">
        {() => <ProtectedRoute requireNonAiOnly><AdminDocumentazione /></ProtectedRoute>}
      </Route>
      <Route path="/corporate">
        {() => <ProtectedRoute requireNonAiOnly><CorporatePortal /></ProtectedRoute>}
      </Route>
      <Route path="/corporate/join/:token">
        {(params) => <ProtectedRoute requireNonAiOnly><CorporateJoin params={params} /></ProtectedRoute>}
      </Route>
      <Route path="/prevention" component={Prevention} />
      <Route path="/chat" component={Prevention} />
      <Route path="/webinar-health">
        {() => <ProtectedRoute><WebinarHealth /></ProtectedRoute>}
      </Route>
      <Route path="/pacchetto-prohmed">
        {() => <ProtectedRoute><PacchettoProhmed /></ProtectedRoute>}
      </Route>
      <Route path="/guida">
        {() => <ProtectedRoute><Guida /></ProtectedRoute>}
      </Route>
      <Route path="/security">
        {() => <ProtectedRoute><Security /></ProtectedRoute>}
      </Route>
      <Route path="/documenti">
        {() => <ProtectedRoute requireNonAiOnly><Documenti /></ProtectedRoute>}
      </Route>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Login} />
      ) : (
        <>
          <Route path="/">
            {() => <ProtectedRoute><RoleDashboard /></ProtectedRoute>}
          </Route>
          <Route path="/medici">
            {() => <ProtectedRoute><MediciPage /></ProtectedRoute>}
          </Route>
          <Route path="/prenotazioni">
            {() => <ProtectedRoute><TeleconsultoPage /></ProtectedRoute>}
          </Route>
          <Route path="/notifiche">
            {() => <ProtectedRoute><NotifichePage /></ProtectedRoute>}
          </Route>
          <Route path="/webinar">
            {() => <ProtectedRoute><WebinarHealth /></ProtectedRoute>}
          </Route>
          <Route path="/doctor/alerts">
            {() => <ProtectedRoute><DoctorAlertsPage /></ProtectedRoute>}
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
          <PWAInstallBanner />
          <IOSInstallPrompt />
          <CookieBanner />
          <FeedbackDialog />
          <Router />
          <BottomNavigation />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
