import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { authApi, clearApiSession, registerAuthHooks, setApiSession } from "../services/api";
import { clearStoredSession, loadStoredSession, saveStoredSession } from "../services/session";

const AuthContext = createContext(null);

function normalizeSession(authPayload) {
  return {
    accessToken: authPayload.accessToken,
    refreshToken: authPayload.refreshToken,
    tokenType: authPayload.tokenType,
    accessTokenExpiresAt: authPayload.accessTokenExpiresAt,
    refreshTokenExpiresAt: authPayload.refreshTokenExpiresAt,
    user: authPayload.user,
  };
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => loadStoredSession());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    registerAuthHooks({
      onSessionUpdate: (nextSession) => {
        setSession(nextSession);
        saveStoredSession(nextSession);
      },
      onSessionClear: () => {
        setSession(null);
        clearStoredSession();
        navigate("/login", { replace: true });
      },
    });
  }, [navigate]);

  useEffect(() => {
    if (session) {
      setApiSession(session);
      saveStoredSession(session);
    } else {
      clearApiSession();
      clearStoredSession();
    }
  }, [session]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const storedSession = loadStoredSession();
      if (!storedSession?.accessToken) {
        if (mounted) {
          setIsBootstrapping(false);
        }
        return;
      }

      setApiSession(storedSession);

      try {
        const response = await authApi.me();
        const refreshedSession = {
          ...storedSession,
          user: response.data,
        };
        if (mounted) {
          setSession(refreshedSession);
          saveStoredSession(refreshedSession);
        }
      } catch {
        if (mounted) {
          clearApiSession();
          clearStoredSession();
          setSession(null);
        }
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  async function login(credentials) {
    const response = await authApi.login(credentials);
    const nextSession = normalizeSession(response.data);
    startTransition(() => {
      setSession(nextSession);
    });
    setApiSession(nextSession);
    saveStoredSession(nextSession);
    return nextSession;
  }

  async function registerCompany(payload) {
    const response = await authApi.registerCompany(payload);
    const nextSession = normalizeSession(response.data);
    startTransition(() => {
      setSession(nextSession);
    });
    setApiSession(nextSession);
    saveStoredSession(nextSession);
    return nextSession;
  }

  async function logout() {
    try {
      if (session?.refreshToken) {
        await authApi.logout(session.refreshToken);
      }
    } catch {
      // Logout should clear local state even when the backend token is already invalid.
    } finally {
      clearApiSession();
      clearStoredSession();
      setSession(null);
      navigate("/login", { replace: true });
    }
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isBootstrapping,
      login,
      registerCompany,
      logout,
      setSession,
    }),
    [isBootstrapping, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
