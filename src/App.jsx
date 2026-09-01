import { lazy, Suspense, useState } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import TabbedLayout from '@/components/TabbedLayout';
import SplashOverlay from '@/components/SplashOverlay';

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const JournalNew = lazy(() => import("@/pages/JournalNew"));
const JournalDetail = lazy(() => import("@/pages/JournalDetail"));
const JournalEdit = lazy(() => import("@/pages/JournalEdit"));
const PageNotFound = lazy(() => import("@/lib/PageNotFound"));
const PostDetail = lazy(() => import("@/pages/PostDetail"));
const Conversation = lazy(() => import("@/pages/Conversation"));
const Techniques = lazy(() => import("@/pages/Techniques"));
const Goals = lazy(() => import("@/pages/Goals"));
const Partners = lazy(() => import("@/pages/Partners"));
const Events = lazy(() => import("@/pages/Events"));
const Members = lazy(() => import("@/pages/Members"));
const MemberProfile = lazy(() => import("@/pages/MemberProfile"));
const Attendance = lazy(() => import("@/pages/Attendance"));
const AttendanceTrends = lazy(() => import("@/pages/AttendanceTrends"));
const AttendanceParticipants = lazy(() => import("@/pages/AttendanceParticipants"));
const CompetitionPrep = lazy(() => import("@/pages/CompetitionPrep"));
const InjuryLog = lazy(() => import("@/pages/InjuryLog"));
const RollLog = lazy(() => import("@/pages/RollLog"));
const StudyGroups = lazy(() => import("@/pages/StudyGroups"));

const FullScreenSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const [splashDone, setSplashDone] = useState(false);
  // Tab routes share a stable key so Feed<->Journal never remount (state preserved)
  const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  // All authenticated routes live inside TabbedLayout, so they share one key —
  // TabbedLayout (and its keep-alive tab panels) never remount between tabs or sub-pages.
  const routeKey = authPaths.includes(location.pathname) ? location.pathname : "app";

  const isLoading = isLoadingPublicSettings || isLoadingAuth;

  let content;
  if (isLoading) {
    content = null;
  } else if (authError?.type === 'auth_required') {
    navigateToLogin();
    content = null;
  } else {
    content = (
      <AnimatePresence mode="wait">
        <motion.div
          key={routeKey}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <Suspense fallback={<FullScreenSpinner />}>
            <Routes location={location}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
                <Route element={<TabbedLayout />}>
                  <Route path="/" />
                  <Route path="/journal" />
                  <Route path="/messages" />
                  <Route path="/post/:id" element={<PostDetail />} />
                  <Route path="/messages/:id" element={<Conversation />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/members/:id" element={<MemberProfile />} />
                  <Route path="/admin/attendance" element={<Attendance />} />
                  <Route path="/admin/attendance/trends" element={<AttendanceTrends />} />
                  <Route path="/admin/attendance/participants" element={<AttendanceParticipants />} />
                  <Route path="/journal/techniques" element={<Techniques />} />
                  <Route path="/journal/goals" element={<Goals />} />
                  <Route path="/journal/partners" element={<Partners />} />
                  <Route path="/journal/competitions" element={<CompetitionPrep />} />
                  <Route path="/journal/injuries" element={<InjuryLog />} />
                  <Route path="/journal/rolls" element={<RollLog />} />
                  <Route path="/study-groups" element={<StudyGroups />} />
                  <Route path="/journal/new" element={<JournalNew />} />
                  <Route path="/journal/:id" element={<JournalDetail />} />
                  <Route path="/journal/:id/edit" element={<JournalEdit />} />
                </Route>
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      {!splashDone && (
        <SplashOverlay loading={isLoading} onDone={() => setSplashDone(true)} />
      )}
      {content}
    </>
  );
};

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App