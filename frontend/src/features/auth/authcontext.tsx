"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Cookies from "js-cookie";
import {
  api,
  clearTokens,
  setAccessToken,
  setRefreshToken,
  setTokens,
} from "@/lib/api";
import { AuthUser } from "@/features/auth/types/AuthUser";
import { RegisterPayload } from "@/features/auth/types/RegisterPayload";
import {
  getAllowedModulesFromPermissions,
  pickPostLoginRedirect,
} from "@/features/auth/authz";
import {
  type AuthProfile,
  getApiErrorMessage,
  getAuthPermissions,
  getAuthUserId,
} from "@/features/auth/utils/authUser";

type AuthResult = { ok: boolean; message?: string; redirectTo?: string };
type AuthAction = "login" | "logout" | null;

type AuthContextType = {
  user: AuthUser | null;
  profile: AuthProfile | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (
    email: string,
    password: string,
    nextPath?: string | null
  ) => Promise<AuthResult>;
  logout: () => void;
  loadUser: () => Promise<AuthUser | null>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<AuthResult>;
  loadProfile: (userId?: number) => Promise<AuthProfile | null>;
  refreshProfile: () => Promise<AuthProfile | null>;
  refreshBasicUserData: (userId?: number) => Promise<void>;
  updateProfile: (data: RegisterPayload | Partial<AuthProfile>) => Promise<AuthResult>;
  register: (data: RegisterPayload) => Promise<AuthResult>;
  allowedModules: string[];
  lastAuthAction: AuthAction;
  setLastAuthAction: (action: AuthAction) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [lastAuthAction, setLastAuthAction] = useState<AuthAction>(null);

  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data as AuthUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const loadProfile = useCallback(
    async (userId?: number): Promise<AuthProfile | null> => {
      const id = userId ?? getAuthUserId(userRef.current);
      if (!id) {
        setProfile(null);
        return null;
      }

      try {
        const res = await api.get(`/users/${id}`);
        const payload = (res.data?.data ?? res.data) as AuthProfile;
        setProfile(payload);
        return payload;
      } catch {
        setProfile(null);
        return null;
      }
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    const id = getAuthUserId(userRef.current);
    if (!id) return null;
    return loadProfile(id);
  }, [loadProfile]);

  const refreshBasicUserData = useCallback(
    async (userId?: number) => {
      const id = userId ?? getAuthUserId(userRef.current);
      if (!id) return;
      await loadUser();
      await loadProfile(id);
    },
    [loadProfile, loadUser]
  );

  useEffect(() => {
    (async () => {
      const token = Cookies.get("token");
      const refresh = Cookies.get("refresh");

      if (token) setAccessToken(token);
      if (refresh) setRefreshToken(refresh);

      if (!token && !refresh) {
        setReady(true);
        return;
      }

      const me = await loadUser();
      if (me) {
        await loadProfile(getAuthUserId(me) ?? undefined);
      }

      setReady(true);
    })();
  }, [loadProfile, loadUser]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      nextPath?: string | null
    ): Promise<AuthResult> => {
      try {
        const res = await api.post("/auth/login", { email, password });
        const data = res.data;

        const access = data?.access_token;
        const refresh = data?.refresh_token;

        if (!access || !refresh) {
          return { ok: false, message: "Credenciales invalidas" };
        }

        setTokens({ access_token: access, refresh_token: refresh });

        const me = await loadUser();
        if (me) {
          await loadProfile(getAuthUserId(me) ?? undefined);
        }

        const perms = getAuthPermissions(me);
        const redirectTo =
          pickPostLoginRedirect(perms, nextPath) || "/dashboard";

        setLastAuthAction("login");
        setReady(true);
        return { ok: true, redirectTo };
      } catch (err: unknown) {
        setReady(true);
        return {
          ok: false,
          message: getApiErrorMessage(err, "Correo o contrasena incorrectos"),
        };
      }
    },
    [loadProfile, loadUser]
  );

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("__pending_toast__");
      sessionStorage.removeItem("__toast_login_success__");
    }
    clearTokens();
    setUser(null);
    setProfile(null);
    setLastAuthAction("logout");
    setReady(true);
  }, []);

  const changePassword = useCallback<AuthContextType["changePassword"]>(
    async (currentPassword, newPassword) => {
      try {
        await api.patch("/auth/change-password", {
          currentPassword,
          newPassword,
          confirmNewPassword: newPassword,
        });
        await loadUser();
        return { ok: true };
      } catch (err: unknown) {
        return {
          ok: false,
          message: getApiErrorMessage(err, "No se pudo actualizar la contrasena"),
        };
      }
    },
    [loadUser]
  );

  const updateProfile = useCallback(
    async (data: RegisterPayload | Partial<AuthProfile>): Promise<AuthResult> => {
      try {
        const id = getAuthUserId(userRef.current);
        if (!id) return { ok: false, message: "Usuario no autenticado" };

        const res = await api.put(`/users/${id}`, data);
        const result = res.data;

        if (result?.success === false) {
          return { ok: false, message: result.message };
        }

        await loadUser();
        await loadProfile(id);

        return { ok: true };
      } catch (err: unknown) {
        return {
          ok: false,
          message: getApiErrorMessage(err, "Error al actualizar"),
        };
      }
    },
    [loadProfile, loadUser]
  );

  const register = useCallback(
    async (data: RegisterPayload): Promise<AuthResult> => {
      try {
        const res = await api.post("/users", data);
        if (res.data?.success === false) {
          return { ok: false, message: res.data.message };
        }
        return { ok: true };
      } catch (err: unknown) {
        return {
          ok: false,
          message: getApiErrorMessage(err, "No se pudo registrar"),
        };
      }
    },
    []
  );

  const allowedModules = useMemo(() => {
    const perms = getAuthPermissions(user);
    if (!perms.length) return [];
    return getAllowedModulesFromPermissions(perms);
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      isAuthenticated: !!user,
      ready,
      login,
      logout,
      loadUser,
      changePassword,
      loadProfile,
      refreshProfile,
      refreshBasicUserData,
      updateProfile,
      register,
      allowedModules,
      lastAuthAction,
      setLastAuthAction,
    }),
    [
      user,
      profile,
      ready,
      login,
      logout,
      loadUser,
      loadProfile,
      refreshProfile,
      refreshBasicUserData,
      updateProfile,
      register,
      allowedModules,
      lastAuthAction,
      changePassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
