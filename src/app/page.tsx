"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Sparkles, Compass, Film, Sun, Moon } from "lucide-react";
import { synth } from "@/components/AudioEngine";
import VectorSandbox from "@/components/VectorSandbox";
import { useRouter } from "next/navigation";
import ContentLibrary, { DAGNode } from "@/components/ContentLibrary";
import AuthModal from "@/components/AuthModal";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vidya_authenticated") === "true";
    }
    return false;
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vidya_user_email");
    }
    return null;
  });
  const [hasCompletedLanding, setHasCompletedLanding] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vidya_landing_completed") === "true";
    }
    return false;
  });
  const [creatorMode, setCreatorMode] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // Auth gating state
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [targetNodeName, setTargetNodeName] = useState<string>("");

  // Keyboards listeners for Creator Mode (Ctrl + Shift + H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "H") {
        e.preventDefault();
        synth.playClick();
        setCreatorMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLandingComplete = () => {
    setHasCompletedLanding(true);
    localStorage.setItem("vidya_landing_completed", "true");
    
    // Scroll down to Content Library smoothly
    setTimeout(() => {
      const el = document.getElementById("content-library-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleNodeClick = (node: DAGNode) => {
    // If clicking the completed landing vector node, allow review
    if (node.id === "vector_basics") {
      synth.playClick();
      setHasCompletedLanding(false); // Let them play again
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Direct, frictionless routing for free math pilots
    if (node.id === "parallel_transversals" || node.id === "triangle_sum") {
      synth.playClick();
      router.push(`/play/${node.id}`);
      return;
    }

    if (!isAuthenticated) {
      setTargetNodeName(node.label);
      setIsAuthOpen(true);
    } else {
      synth.playSuccess();
      alert(`Simulation environment [${node.label}] initialized successfully inside your scholar workspace.`);
    }
  };

  const handleAuthSuccess = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem("vidya_authenticated", "true");
    localStorage.setItem("vidya_user_email", email);
    setIsAuthOpen(false);
  };

  const handleSignOut = () => {
    synth.playClick();
    setIsAuthenticated(false);
    setUserEmail(null);
    localStorage.removeItem("vidya_authenticated");
    localStorage.removeItem("vidya_user_email");
  };

  return (
    <div className={`flex flex-col flex-1 w-full selection:bg-vidya-accent selection:text-vidya-void ${theme === "light" ? "light-theme text-vidya-text" : ""}`}>
      {/* 1. Header Navigation Bar (Hidden in creatorMode) */}
      <AnimatePresence>
        {!creatorMode && (
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="border-b border-vidya-border bg-vidya-surface/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
          >
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-vidya-warm-arc p-0.5 flex items-center justify-center shadow-lg shadow-vidya-accent-warm/15">
                <div className="w-full h-full rounded-full bg-vidya-bg flex items-center justify-center">
                  <span className="text-vidya-accent font-display font-extrabold text-sm tracking-tighter">A</span>
                </div>
              </div>
              <div>
                <h1 className="text-base font-display font-bold text-vidya-text tracking-wider leading-none">
                  Agni Labs
                </h1>
                <span className="text-[9px] font-mono text-vidya-accent uppercase tracking-widest leading-none block mt-1">
                  Project Vidyā
                </span>
              </div>
            </div>

            {/* Actions & Status */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  synth.playClick();
                  setTheme((prev) => (prev === "dark" ? "light" : "dark"));
                }}
                className="flex items-center justify-center p-2 rounded-lg bg-vidya-surface-raised border border-vidya-border hover:border-vidya-accent text-vidya-text-muted hover:text-vidya-text transition-colors cursor-pointer"
                title="Toggle Light/Dark Theme"
              >
                {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {/* Creator mode helper indicator */}
              <button
                id="btn-creator-toggle"
                onClick={() => {
                  synth.playClick();
                  setCreatorMode(true);
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded bg-vidya-surface-raised border border-vidya-border hover:border-vidya-accent-warm hover:text-vidya-accent-warm transition-all text-xs font-mono text-vidya-text-muted cursor-pointer"
                title="Hides HUD overlay and text captions for clean video capture"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Creator Deck</span>
              </button>

              {/* Scholar Account Block */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3 bg-vidya-void/80 border border-vidya-border px-3 py-1.5 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-vidya-accent/15 flex items-center justify-center border border-vidya-accent/30 text-vidya-accent">
                    <User className="w-3 h-3" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-[10px] font-mono text-vidya-text-muted block leading-none">Scholar Account</span>
                    <span className="text-xs font-mono text-vidya-text font-bold block leading-none mt-1">{userEmail}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1 text-vidya-text-muted hover:text-vidya-error transition-colors rounded hover:bg-vidya-surface-raised cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-vidya-surface-raised border border-vidya-border px-3 py-1.5 rounded-lg text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-vidya-accent-warm animate-pulse" />
                  <span className="text-vidya-text-muted">Anonymous Student (Local Progress)</span>
                </div>
              )}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* 2. Main content container */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section: Vector Lab */}
        <section className={`flex flex-col justify-center py-12 px-6 ${creatorMode ? "pt-2 pb-0 flex-1 justify-center bg-vidya-void" : "bg-gradient-to-b from-vidya-bg to-vidya-surface/40"}`}>
          {/* Section Headings, hidden in creatorMode */}
          {!creatorMode && (
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-vidya-accent/20 bg-vidya-accent/5 text-vidya-accent text-[10px] font-mono rounded-full uppercase tracking-wider mb-4">
                <Compass className="w-3.5 h-3.5" />
                Active Module Playground
              </div>
              <h2 className="text-4xl font-display font-bold text-vidya-text tracking-tight sm:text-5xl">
                Anatomy of a Vector
              </h2>
              <p className="mt-3 text-sm text-vidya-text-muted leading-relaxed">
                Complete the three stages of physical visual mastery. Orient parameter ranges, compute algebraic orthogonality client-side, and launch gravitational vectors to destroy the target area!
              </p>
            </div>
          )}

          {/* Playground Canvas wrapper */}
          <VectorSandbox
            onSequenceComplete={handleLandingComplete}
            creatorMode={creatorMode}
            theme={theme}
          />

          {/* Capture controls footer helper, visible ONLY in creatorMode */}
          {creatorMode && (
            <div className="w-full max-w-5xl mx-auto mt-4 px-6 flex items-center justify-between text-[11px] font-mono text-vidya-text-muted">
              <span>Press <kbd className="bg-vidya-surface px-1.5 py-0.5 rounded border border-vidya-border text-vidya-accent-warm font-semibold">Ctrl + Shift + H</kbd> to exit presentation mode.</span>
              <span className="text-vidya-accent font-semibold animate-pulse">Agni Labs Screen Capturer ready (1080p, 60fps)</span>
            </div>
          )}
        </section>

        {/* Separator / Progression Banner, hidden in creatorMode */}
        {!creatorMode && (
          <div id="content-library-section" className="border-y border-vidya-border bg-vidya-void/80 py-8 px-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-vidya-accent/30 to-transparent" />
            <div className="max-w-md mx-auto">
              {hasCompletedLanding ? (
                <div className="flex flex-col items-center">
                  <div className="inline-flex items-center justify-center p-2 bg-vidya-success/15 text-vidya-success rounded-full mb-3 border border-vidya-success/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-display font-bold text-vidya-text uppercase tracking-wider">
                    Landing Node Mastered!
                  </h3>
                  <p className="text-xs text-vidya-text-muted mt-1 leading-relaxed">
                    You have unlocked complete access to the rest of our multi-grade curriculum. Click on the modules below to start learning.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <h3 className="text-xs font-mono text-vidya-text-muted uppercase tracking-widest">
                    Progression Status
                  </h3>
                  <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                    Complete the above projectile landing exercise to seamlessly unlock global secondary standards and graduate levels.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Content Library Section, hidden in creatorMode */}
        {!creatorMode && (
          <section className="bg-vidya-bg/60 pb-20">
            <ContentLibrary
              onNodeClick={handleNodeClick}
            />
          </section>
        )}
      </main>

      {/* 4. Footer credits, hidden in creatorMode */}
      {!creatorMode && (
        <footer className="border-t border-vidya-border bg-vidya-surface py-8 px-6 text-center text-xs font-mono text-vidya-text-muted">
          <p>© 2026 Agni Labs. All Rights Reserved. Empowering elite cognitive muscle memory for Advanced Robotics & Physical AI.</p>
        </footer>
      )}

      {/* 5. Gated Account Auth Popup */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        targetModuleName={targetNodeName}
      />
    </div>
  );
}
