"use client";

import React, { useState, useEffect } from "react";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { WifiOff, Download, Sparkles, User, RefreshCw, CheckCircle2 } from "lucide-react";
import { getPendingSyncQueue, flushSyncQueueToServer } from "@/lib/indexedDB";

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

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

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
    await flushSyncQueueToServer(userEmail);
    await checkSyncQueue();
    setIsSyncing(false);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0F0505] text-[#F9F1EC] font-sans">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-[#B57C38] text-[#1E2225] px-4 py-2 flex items-center justify-between text-xs font-mono font-bold shadow-md z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>Offline Mode Active — Progress is saved locally in IndexedDB and will sync automatically when connected.</span>
          </div>
          {pendingSyncCount > 0 && (
            <span className="bg-[#1E2225] text-[#F9F1EC] px-2 py-0.5 rounded-full text-[10px]">
              {pendingSyncCount} queued
            </span>
          )}
        </div>
      )}

      {/* Sync Status Banner when returning online */}
      {isOnline && pendingSyncCount > 0 && (
        <div className="bg-[#2D6A4F] text-[#F9F1EC] px-4 py-2 flex items-center justify-between text-xs font-mono font-semibold z-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
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
          {/* Logo Staircase Mark (Emblem 32x32 / 40x40 on #8D1516) */}
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#4A0B0C] border border-[#A37134]/30 p-1.5 flex items-center justify-center shadow-md">
            <img
              src="/guroh_logo_mark.svg"
              alt="Guroh Mark"
              className="w-full h-full object-contain filter drop-shadow"
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
            {/* Install PWA Prompt Button */}
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
            {userEmail ? (
              <div className="flex items-center gap-2 bg-[#4A2600]/80 border border-[#D9A066]/30 px-3 py-1.5 rounded-xl min-h-[48px]">
                <User className="w-4 h-4 text-[#D9A066]" />
                <span className="text-xs font-mono text-[#F9F1EC] font-semibold hidden md:inline">{userEmail}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-[#F9F1EC] px-3 py-2 rounded-xl text-xs font-mono transition-colors border border-white/20 min-h-[48px] cursor-pointer"
              >
                <User className="w-4 h-4 text-[#D9A066]" />
                <span>Guest Scholar</span>
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

      {/* ZONE 3: Dark Slate Footer (#1E2225) */}
      <footer className="bg-[#1E2225] border-t border-white/10 py-5 px-6 text-center text-xs font-mono text-[#D7D5DA] min-h-[52px]">
        {footerContent ? (
          footerContent
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#D7D5DA]/80">© 2026 Guroh Academy (Agni Labs). All Rights Reserved.</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-[#2D6A4F] flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                IndexedDB Engine Active
              </span>
              <span className="text-[#D7D5DA]/60">PWA Shell v1.0</span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
