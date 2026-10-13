"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserSession, flushSyncQueueToServer, getGuestProfile, getOrCreateGuestId } from "@/lib/indexedDB";
import { synth } from "@/components/AudioEngine";

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authTriggerReason: string | null;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
  onAuthSuccess: (session: UserSession) => Promise<{ syncedCount: number }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTriggerReason, setAuthTriggerReason] = useState<string | null>(null);

  // Restore session from localStorage if previously authenticated
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const cachedUser = localStorage.getItem("guroh_user_session");
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          setUser(parsed);
        } else {
          const email = localStorage.getItem("vidya_user_email");
          const isAuthed = localStorage.getItem("vidya_authenticated") === "true";
          if (isAuthed && email) {
            setUser({
              userId: email,
              email: email,
              provider: "password",
              createdAt: Date.now(),
            });
          }
        }
      }
    } catch (err) {
      console.warn("Failed to parse cached session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openAuthModal = (reason?: string) => {
    setAuthTriggerReason(reason || "Save your progress and sync across devices.");
    setIsAuthModalOpen(true);
    synth.playClick();
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    synth.playClick();
  };

  /**
   * On successful authentication callback:
   * 1. Store authenticated user session without overwriting or clearing local IndexedDB guest stores.
   * 2. Trigger Tony's atomic sync migration engine (flushSyncQueueToServer).
   * 3. Retain guest progress intact, mark items synced, and link them to the account.
   */
  const onAuthSuccess = async (session: UserSession): Promise<{ syncedCount: number }> => {
    setUser(session);
    if (typeof window !== "undefined") {
      localStorage.setItem("guroh_user_session", JSON.stringify(session));
      localStorage.setItem("vidya_authenticated", "true");
      localStorage.setItem("vidya_user_email", session.email);
      if (session.token) {
        localStorage.setItem("vidya_auth_token", session.token);
      }
    }

    synth.playSuccess();
    setIsAuthModalOpen(false);

    // Atomic handoff to Tony's offline sync migration engine
    try {
      console.log(`[Auth Handoff] Triggering atomic sync migration engine for ${session.email}...`);
      const syncResult = await flushSyncQueueToServer(session.userId, session.token);
      console.log(`[Auth Handoff] Atomic sync migration completed: ${syncResult.syncedCount} items synced.`);
      return syncResult;
    } catch (err) {
      console.error("[Auth Handoff] Background sync failed during login handoff:", err);
      return { syncedCount: 0 };
    }
  };

  const signOut = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("guroh_user_session");
      localStorage.removeItem("vidya_authenticated");
      localStorage.removeItem("vidya_user_email");
      localStorage.removeItem("vidya_auth_token");
    }
    synth.playClick();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authTriggerReason,
        openAuthModal,
        closeAuthModal,
        onAuthSuccess,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}