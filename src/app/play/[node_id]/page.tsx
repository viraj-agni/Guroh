"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Sparkles, Film, Home, CheckCircle, Sun, Moon } from "lucide-react";
import { synth } from "@/components/AudioEngine";
import { saveLessonProgress } from "@/lib/indexedDB";
import ParallelTransversalsSandbox from "@/components/ParallelTransversalsSandbox";
import TriangleSumSandbox from "@/components/TriangleSumSandbox";

interface PlayPageProps {
  params: Promise<{ node_id: string }>;
}

export default function PlayPage({ params }: PlayPageProps) {
  
  // Unwrap params using React.use() as required by Next.js async params convention
  const { node_id } = use(params);

  const [creatorMode, setCreatorMode] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  const handleSequenceComplete = () => {
    synth.playSuccess();
    setCompleted(true);
    
    // Save to IndexedDB guest offline store
    saveLessonProgress({
      nodeId: node_id,
      stage: 3,
      completed: true,
      score: 100,
    }).catch((err) => console.error("Failed to save progress to IndexedDB:", err));

    // Save local progress token to bypass authentication barriers
    localStorage.setItem(`vidya_progress_${node_id}`, "completed");
    
    // Set landing completed if it's the transversals / lines_angles
    if (node_id.includes("lines_angles") || node_id.includes("transversal")) {
      localStorage.setItem("vidya_landing_completed", "true");
    }
  };

  // Determine which component to render
  const isTransversals = 
    node_id === "lines_angles_transversal" || 
    node_id === "MATH.GEOMETRY.LinesAngles" || 
    node_id === "parallel_transversals";

  const isTriangleSum = 
    node_id === "triangle_angle_sum" || 
    node_id === "MATH.GEOMETRY.TriangleSum" || 
    node_id === "triangle_sum";

  if (!isTransversals && !isTriangleSum) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-vidya-bg px-6 text-center text-vidya-text">
        <h2 className="text-2xl font-display font-bold text-vidya-error mb-2">
          Unknown Module Node
        </h2>
        <p className="text-xs text-vidya-text-muted max-w-sm mb-6">
          The specified taxonomy node ID [ <span className="font-mono text-vidya-accent-warm">{node_id}</span> ] could not be mapped to any active sandbox simulations.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-vidya-surface border border-vidya-border hover:border-vidya-accent text-xs font-mono rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-1 w-full selection:bg-vidya-accent selection:text-vidya-void ${theme === "light" ? "light-theme text-vidya-text" : ""}`}>
      {/* Dynamic Header Navbar (Hidden in creatorMode) */}
      <AnimatePresence>
        {!creatorMode && (
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="border-b border-vidya-border bg-vidya-surface/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
          >
            {/* Back to Dashboard */}
            <Link
              href="/"
              onClick={() => synth.playClick()}
              className="flex items-center gap-2 text-xs font-mono text-vidya-text-muted hover:text-vidya-text transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Library</span>
            </Link>

            {/* Title / Info */}
            <div className="text-center hidden md:block">
              <span className="text-[10px] font-mono text-vidya-accent uppercase tracking-widest block leading-none">
                Interactive Playground
              </span>
              <h1 className="text-sm font-display font-bold text-vidya-text mt-1.5 uppercase tracking-wide">
                {isTransversals ? "Parallel Lines & Transversals (MC 4)" : "Triangle Angle Sum Theorem (MC 5)"}
              </h1>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
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

              <button
                onClick={() => {
                  synth.playClick();
                  setCreatorMode(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-vidya-surface-raised border border-vidya-border hover:border-vidya-accent-warm hover:text-vidya-accent-warm transition-all text-xs font-mono text-vidya-text-muted cursor-pointer"
                title="Hides HUD and text overlays for clean screen recordings"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Presentation Deck</span>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Play Space */}
      <main className={`flex-1 flex flex-col justify-center py-10 px-6 ${creatorMode ? "pt-2 pb-0 flex-1 justify-center bg-vidya-void" : "bg-gradient-to-b from-vidya-bg to-vidya-surface/30"}`}>
        {/* Module Header, hidden in creatorMode */}
        {!creatorMode && !completed && (
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-vidya-accent/20 bg-vidya-accent/5 text-vidya-accent text-[10px] font-mono rounded-full uppercase tracking-wider mb-4 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Active Concept Standard
            </div>
            <h2 className="text-3xl font-display font-bold text-vidya-text tracking-tight sm:text-4xl">
              {isTransversals ? "Parallel Lines & Transversal Gates" : "Triangle Origami Mirror Alignment"}
            </h2>
            <p className="mt-3 text-sm text-vidya-text-muted leading-relaxed">
              {isTransversals
                ? "Gain physical visual intuition on alternate interior, corresponding, and supplementary angles. Rotate the transversal line and verify the spatial invariants!"
                : "Explore how the interior angles of any triangle collapse onto a baseline to form a perfect straight line. Direct the specular laser reflection off the triangle corners to hit the portal!"}
            </p>
          </div>
        )}

        {/* Celebrations overlay when sequence is finished */}
        <AnimatePresence>
          {completed && !creatorMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto bg-vidya-surface border border-vidya-accent/40 rounded-xl p-8 text-center shadow-2xl relative overflow-hidden mb-10"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-vidya-accent to-transparent" />
              
              <div className="w-12 h-12 bg-vidya-success/15 border border-vidya-success/30 text-vidya-success rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-display font-bold text-vidya-text">
                Standard Concept Mastered!
              </h3>
              <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                Congratulations! You successfully validated the geometry theorems under WASM SymPy diagnostic checks and resolved the laser alignment challenge!
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/"
                  onClick={() => synth.playClick()}
                  className="px-5 py-2.5 bg-vidya-accent hover:bg-vidya-accent-hover text-vidya-void font-mono font-bold text-xs rounded transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  Dashboard Library
                </Link>
                <button
                  onClick={() => {
                    synth.playClick();
                    setCompleted(false);
                  }}
                  className="px-5 py-2.5 bg-vidya-void border border-vidya-border hover:border-vidya-accent-warm text-vidya-text-muted hover:text-vidya-text font-mono text-xs rounded transition-all uppercase tracking-wider cursor-pointer"
                >
                  Review Sandbox
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Sandbox Element */}
        <div className={completed && !creatorMode ? "hidden" : "block"}>
          {isTransversals ? (
            <ParallelTransversalsSandbox
              onSequenceComplete={handleSequenceComplete}
              creatorMode={creatorMode}
              theme={theme}
            />
          ) : (
            <TriangleSumSandbox
              onSequenceComplete={handleSequenceComplete}
              creatorMode={creatorMode}
              theme={theme}
            />
          )}
        </div>

        {/* Presentation controls instructions footer, visible ONLY in creatorMode */}
        {creatorMode && (
          <div className="w-full max-w-5xl mx-auto mt-4 px-6 flex items-center justify-between text-[11px] font-mono text-vidya-text-muted">
            <span>Press <kbd className="bg-vidya-surface px-1.5 py-0.5 rounded border border-vidya-border text-vidya-accent-warm font-semibold">Ctrl + Shift + H</kbd> to exit presentation mode.</span>
            <span className="text-vidya-accent font-semibold animate-pulse">Agni Labs Stream Deck active</span>
          </div>
        )}
      </main>

      {/* Footer (Hidden in creatorMode) */}
      {!creatorMode && (
        <footer className="border-t border-vidya-border bg-vidya-surface py-6 text-center text-xs font-mono text-vidya-text-muted">
          <p>© 2026 Agni Labs. All Rights Reserved. frictionless learning via cognitive muscle memory.</p>
        </footer>
      )}
    </div>
  );
}
