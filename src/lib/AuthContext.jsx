import React, { createContext, useState, useContext, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";

const AuthContext = createContext();

// Small delay helper for the retry below.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null);

  const loadUser = async () => {
    try {
      setIsLoadingAuth(true);
      let me;
      try {
        me = await base44.auth.me();
      } catch (firstErr) {
        // A genuine "not logged in" fails fast and consistently — no point
        // retrying that. Anything else (a dropped request, a slow response
        // right after a hard page reload — e.g. straight after signup on a
        // flaky connection) is worth one quiet retry before we conclude the
        // person isn't actually authenticated.
        if (firstErr?.status === 401 || firstErr?.status === 403) throw firstErr;
        await wait(600);
        me = await base44.auth.me();
      }
      setUser(me);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      if (err?.status === 401 || err?.status === 403) {
        setAuthError({ type: "auth_required", message: "Authentication required" });
      } else {
        // Previously silent: any other failure (network blip, a transient
        // Supabase/PostgREST error) left the person looking logged-out with
        // no explanation at all. Surface it instead.
        toast({
          title: "Couldn't confirm your session",
          description: "Please check your connection and try logging in again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await loadUser();
    } else {
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
    setIsLoadingPublicSettings(false);
  };

  useEffect(() => {
    let mounted = true;
    checkAppState();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) loadUser();
      else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
      }
    });
    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? window.location.href : undefined);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const checkUserAuth = loadUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};