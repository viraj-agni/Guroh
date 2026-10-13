"use client";

import React, { useState, useEffect } from "react";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { WifiOff, Download, Sparkles, User, RefreshCw, CheckCircle2, Laptop } from "lucide-react";
import DeferredConversionBanner from "@/components/DeferredConversionBanner";
import AuthModal from "@/components/AuthModal";
import { getPendingSyncQueue, flushSyncQueueToServer, UserSession, getCachedCurriculumDAG, cacheCurriculumDAG, ClientCurriculumDAG } from "@/lib/indexedDB";
import curriculumDagData from "@/data/curriculum_dag.json";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAAppShell({
  children,
  headerContent,
  footerContent,
  userEmail,
  onOpenAuth,
}: {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  userEmail?: string | null;
  onOpenAuth?: () => void;
}) {
  const isOnline = useOnlineStatus();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [internalAuthOpen, setInternalAuthOpen] = useState<boolean>(false);
  const [currentSessionUser, setCurrentSessionUser] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vidya_user_email");
    }
    return null;
  });

  // Check pending sync items in IndexedDB
  const checkSyncQueue = async () => {
    try {
      const queue = await getPendingSyncQueue();
      setPendingSyncCount(queue.length);
    } catch {
      setPendingSyncCount(0);
    }
  };

  useEffect(() => {
    checkSyncQueue();

    // Flow 3: Ensure master Curriculum DAG is cached in IndexedDB for offline capability
    const primeOfflineCurriculumCache = async () => {
      try {
        const cached = await getCachedCurriculumDAG();
        if (!cached || !cached.nodes || cached.nodes.length === 0) {
          console.log("[PWAAppShell] Priming IndexedDB with Curriculum DAG ontology...");
          await cacheCurriculumDAG(curriculumDagData as unknown as ClientCurriculumDAG);
        }
      } catch (e) {
        console.warn("[PWAAppShell] Error priming curriculum DAG cache:", e);
      }
    };
    primeOfflineCurriculumCache();

    // Listen for PWA Install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app is in standalone mode (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for Service Worker broadcast messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_OFFLINE_PROGRESS_TRIGGERED") {
        console.log("[PWAAppShell] Background sync trigger received from Service Worker");
        setSyncStatusMsg("Background sync active...");
        checkSyncQueue();
        if (userEmail) {
          handleManualSync();
        }
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, [userEmail]);

  // Trigger manual sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0 && userEmail) {
      handleManualSync();
    }
  }, [isOnline, userEmail]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleManualSync = async () => {
    if (!userEmail) return;
    setIsSyncing(true);
    setSyncStatusMsg("Flushing offline records...");
    const result = await flushSyncQueueToServer(userEmail);
    if (!result.success && result.error) {
      console.warn("[PWAAppShell] Sync attempt deferred:", result.error);
    }
    await checkSyncQueue();
    setIsSyncing(false);
    setSyncStatusMsg(null);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0F0505] text-[#F9F1EC] font-sans">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-[#B57C38] text-[#1E2225] px-4 py-2 flex items-center justify-between text-xs font-mono font-bold shadow-md z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span>Offline Mode Active — Progress is saved locally in IndexedDB and will sync automatically when connected.</span>
          </div>
          {pendingSyncCount > 0 && (
            <span className="bg-[#1E2225] text-[#F9F1EC] px-2 py-0.5 rounded-full text-[10px] shrink-0">
              {pendingSyncCount} queued
            </span>
          )}
        </div>
      )}

      {/* Sync Status Banner when returning online */}
      {isOnline && pendingSyncCount > 0 && (
        <div className="bg-[#2D6A4F] text-[#F9F1EC] px-4 py-2 flex items-center justify-between text-xs font-mono font-semibold z-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{pendingSyncCount} local lesson updates ready for atomic migration.</span>
          </div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1 bg-[#180608] hover:bg-[#2A52BE] text-white px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold min-h-[36px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
          </button>
        </div>
      )}

      {/* ZONE 1: Oxblood Header (3-Zone Spatial Layout) */}
      <header className="bg-[#8D1516] border-b border-white/10 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40 min-h-[52px] shadow-lg">
        <div className="flex items-center gap-3">
          {/* Logo Staircase Mark (Emblem exact 32px mobile / 40px desktop on #8D1516) */}
          <div className="w-[32px] h-[32px] md:w-[40px] md:h-[40px] flex items-center justify-center shrink-0">
            <img
              src="/guroh_logo_mark.svg"
              alt="Guroh Mark"
              className="w-[32px] h-[32px] md:w-[40px] md:h-[40px] object-contain"
            />
          </div>
          <div>
            <h1 className="text-base font-display font-bold text-[#F2EFEB] tracking-wider leading-none">
              GUROH
            </h1>
            <span className="text-[10px] font-mono text-[#D9A066] uppercase tracking-widest leading-none block mt-1">
              Physical AI Academy
            </span>
          </div>
        </div>

        {/* Dynamic Header Slot or Default Actions */}
        {headerContent ? (
          headerContent
        ) : (
          <div className="flex items-center gap-3">
            {/* Install PWA Prompt Header Trigger */}
            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#D9A066] hover:bg-[#B57C38] text-[#1E2225] font-bold text-xs font-mono rounded-xl transition-all shadow-md min-h-[48px] cursor-pointer"
                title="Install Guroh App for Offline Access"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install PWA</span>
              </button>
            )}

            {/* Account Status / Auth Action */}
            {userEmail || currentSessionUser ? (
              <div className="flex items-center gap-2 bg-[#4A2600]/80 border border-[#D9A066]/30 px-3 py-1.5 rounded-xl min-h-[48px]">
                <User className="w-4 h-4 text-[#D9A066]" />
                <span className="text-xs font-mono text-[#F9F1EC] font-semibold hidden md:inline">{userEmail || currentSessionUser}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else setInternalAuthOpen(true);
                }}
                className="flex items-center gap-2 bg-[#D9A066]/20 hover:bg-[#D9A066]/30 text-[#F9F1EC] px-3.5 py-2 rounded-xl text-xs font-mono transition-colors border border-[#D9A066]/40 min-h-[48px] cursor-pointer shadow-sm group"
                title="Claim your profile to sync progress across devices"
              >
                <User className="w-4 h-4 text-[#D9A066] group-hover:scale-110 transition-transform" />
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[#F9F1EC] leading-tight">Claim Profile</span>
                  <span className="text-[10px] text-[#D9A066] leading-tight">Guest Mode</span>
                </div>
              </button>
            )}
          </div>
        )}
      </header>

      {/* ZONE 2: Warm Ivory Content Frame (#FDFBF7) */}
      <main className="flex-1 bg-[#FDFBF7] text-[#180608] min-h-[calc(100vh-120px)] p-4 md:p-8 flex flex-col justify-start">
        <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
          {children}
        </div>
      </main>

      {/* ZONE 3: Dark Slate Footer / Utility (#1E2225) */}
      <footer className="bg-[#1E2225] border-t border-white/10 py-5 px-6 text-center text-xs font-mono text-[#D7D5DA] min-h-[52px]">
        {/* Custom PWA Install Banner inside Zone 3 Footer */}
        {deferredPrompt && !isInstalled && (
          <div className="max-w-7xl mx-auto mb-5 bg-[#0F0505] border border-[#D9A066]/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8D1516] flex items-center justify-center shrink-0 border border-white/10">
                <Laptop className="w-5 h-5 text-[#D9A066]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#F9F1EC] tracking-wide">
                  Install Guroh Academy (PWA)
                </h4>
                <p className="text-xs text-[#D7D5DA]/80 font-sans mt-0.5">
                  Run simulations offline with zero network latency, persistent local progress, and full desktop app capabilities.
                </p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D9A066] hover:bg-[#B57C38] text-[#1E2225] font-bold text-xs font-mono rounded-xl transition-all shadow-md min-h-[48px] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install Offline App</span>
            </button>
          </div>
        )}

        {footerContent ? (
          footerContent
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#D7D5DA]/80">© 2026 Guroh Academy (Agni Labs). All Rights Reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
              <span className="text-[#2D6A4F] flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                IndexedDB Engine Active
              </span>
              {isInstalled ? (
                <span className="text-[#D9A066] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Installed Standalone
                </span>
              ) : deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="text-[#D9A066] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                >
                  <Download className="w-3 h-3" />
                  Install App
                </button>
              ) : (
                <span className="text-[#D7D5DA]/60">PWA Shell v2.0 (Offline Enabled)</span>
              )}
            </div>
          </div>
        )}
      </footer>

      {/* Internal Deferred Auth Modal when triggered via Shell header button */}
      <AuthModal
        isOpen={internalAuthOpen}
        onClose={() => setInternalAuthOpen(false)}
        onAuthSuccess={async (session: UserSession) => {
          setCurrentSessionUser(session.email);
          setInternalAuthOpen(false);
          if (typeof window !== "undefined") {
            localStorage.setItem("vidya_authenticated", "true");
            localStorage.setItem("vidya_user_email", session.email);
          }
          await flushSyncQueueToServer(session.email);
        }}
        triggerReason="Your progress is stored on this device. Create an account to sync across devices & invite a guardian."
      />
    </div>
  );
}
