import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AuthContext from "./AuthContext";

function getStoredToken() {
  return sessionStorage.getItem("token") ?? localStorage.getItem("token");
}

function clearStoredAuthentication() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function updateStoredUser(user) {
  const storage = localStorage.getItem("token") ? localStorage : sessionStorage;

  storage.setItem("user", JSON.stringify(user));
}

export default function AuthProvider({ children }) {
  const initialToken = getStoredToken();

  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(initialToken));

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let cancelled = false;

    const loadCurrentUser = async () => {
      try {
        const response = await api.get("/me");

        const currentUser =
          response.data.data ?? response.data.user ?? response.data;

        if (!cancelled) {
          setUser(currentUser);
          updateStoredUser(currentUser);
        }
      } catch (requestError) {
        console.error(requestError);
        clearStoredAuthentication();

        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const saveAuthentication = useCallback(
    ({ token: newToken, user: authenticatedUser, remember = false }) => {
      clearStoredAuthentication();

      const storage = remember ? localStorage : sessionStorage;

      storage.setItem("token", newToken);

      if (authenticatedUser) {
        storage.setItem("user", JSON.stringify(authenticatedUser));
      }

      // Protected routes wait while /me reloads the authoritative permissions.
      setLoading(true);
      setUser(authenticatedUser ?? null);
      setToken(newToken);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch (requestError) {
      console.error(requestError);
    } finally {
      clearStoredAuthentication();
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  }, []);

  const hasPermission = useCallback(
    (permission) =>
      Boolean(permission && user?.permissions?.includes(permission)),
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions = []) =>
      permissions.some((permission) => hasPermission(permission)),
    [hasPermission],
  );

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      hasPermission,
      hasAnyPermission,
      saveAuthentication,
      logout,
    }),
    [
      token,
      user,
      loading,
      hasPermission,
      hasAnyPermission,
      saveAuthentication,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
