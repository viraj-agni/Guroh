"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Flame,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { synth } from "./AudioEngine";
import { UserSession } from "@/lib/indexedDB";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (session: UserSession) => Promise<{ syncedCount: number } | void> | void;
  targetModuleName?: string;
  triggerReason?: string | null;
}

type AuthTab = "magic_link" | "credentials" | "google";

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  targetModuleName,
  triggerReason,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("magic_link");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    synth.playClick();

    setTimeout(async () => {
      setIsSubmitting(false);
      synth.playSuccess();

      const session: UserSession = {
        userId: email.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        provider: "magic_link",
        token: `magic_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: Date.now(),
      };
      await onAuthSuccess(session);
    }, 1000);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    synth.playClick();

    setTimeout(async () => {
      setIsSubmitting(false);
      synth.playSuccess();

      const session: UserSession = {
        userId: email.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        provider: "password",
        token: `jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: Date.now(),
      };
      await onAuthSuccess(session);
    }, 1000);
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    synth.playClick();

    setTimeout(async () => {
      setIsSubmitting(false);
      synth.playSuccess();

      const demoEmail = "learner.scholar@gmail.com";
      const session: UserSession = {
        userId: demoEmail,
        email: demoEmail,
        displayName: "Scholar Agni",
        provider: "google",
        token: `g_oauth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: Date.now(),
      };
      await onAuthSuccess(session);
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            synth.playClick();
            onClose();
          }}
          className="absolute inset-0 bg-[#0F0505]/80 backdrop-blur-md"
        />

        {/* Modal Container — Zone 2 Canvas Theme (#FDFBF7) */}
        <motion.div
          initial={{ scale: 0.95, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 16, opacity: 0 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
          className="relative w-full max-w-lg bg-[#FDFBF7] text-[#180608] rounded-3xl border border-[#D9A066]/30 shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
        >
          {/* Top Brand Stripe in Oxblood (#8D1516) */}
          <div className="h-2 w-full bg-gradient-to-r from-[#8D1516] via-[#B57C38] to-[#8D1516]" />

          {/* Close Button */}
          <button
            onClick={() => {
              synth.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 text-[#180608]/60 hover:text-[#180608] transition-colors rounded-full hover:bg-black/5 min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-8 flex flex-col">
            {/* Header / Value Proposition */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#8D1516]/10 text-[#8D1516] mb-3 border border-[#8D1516]/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold text-[#180608] tracking-tight">
                Claim Scholar Profile
              </h2>
              <p className="mt-2 text-xs md:text-sm text-[#180608]/75 max-w-sm mx-auto leading-relaxed">
                {triggerReason ||
                  "Your progress is stored on this device. Create an account to sync across devices & invite a guardian."}
              </p>
            </div>

            {/* Value-First Highlights Pill Banner */}
            <div className="grid grid-cols-3 gap-2 mb-6 bg-white p-3 rounded-2xl border border-black/5 shadow-sm text-center">
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F] mb-1">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-[#180608]">Safe Progress</span>
                <span className="text-[9px] text-[#180608]/60">Zero Data Loss</span>
              </div>
              <div className="flex flex-col items-center border-x border-black/5">
                <div className="p-1.5 rounded-lg bg-[#D9A066]/15 text-[#B57C38] mb-1">
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-[#180608]">Streak Sync</span>
                <span className="text-[9px] text-[#180608]/60">All Devices</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-lg bg-[#8D1516]/10 text-[#8D1516] mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-[#180608]">Guardian Link</span>
                <span className="text-[9px] text-[#180608]/60">Weekly Digest</span>
              </div>
            </div>

            {/* Target Module Notice if applicable */}
            {targetModuleName && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-[#D9A066]/15 border border-[#D9A066]/40 flex items-center justify-between text-xs font-mono text-[#8D1516]">
                <span className="font-bold">Unlocking Milestone:</span>
                <span className="truncate max-w-[200px]">{targetModuleName}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Auth Methods Tabs */}
            <div className="flex rounded-xl bg-black/5 p-1 mb-5">
              <button
                type="button"
                onClick={() => {
                  synth.playClick();
                  setActiveTab("magic_link");
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                  activeTab === "magic_link"
                    ? "bg-white text-[#8D1516] shadow-sm"
                    : "text-[#180608]/60 hover:text-[#180608]"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Magic Link</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  synth.playClick();
                  setActiveTab("credentials");
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                  activeTab === "credentials"
                    ? "bg-white text-[#8D1516] shadow-sm"
                    : "text-[#180608]/60 hover:text-[#180608]"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  synth.playClick();
                  setActiveTab("google");
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                  activeTab === "google"
                    ? "bg-white text-[#8D1516] shadow-sm"
                    : "text-[#180608]/60 hover:text-[#180608]"
                }`}
              >
                <span>Google</span>
              </button>
            </div>

            {/* Tab 1: Magic Link */}
            {activeTab === "magic_link" && (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#180608]/80 mb-1.5 uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="guardian@example.com"
                      required
                      className="w-full px-4 py-3 bg-white border border-black/15 rounded-xl text-sm text-[#180608] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#8D1516] min-h-[48px]"
                    />
                    <Mail className="w-4 h-4 text-black/40 absolute right-4 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#8D1516] hover:bg-[#6D1011] text-[#F9F1EC] font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Magic Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Instant Access Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 2: Password */}
            {activeTab === "credentials" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#180608]/80 mb-1.5 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guardian@example.com"
                    required
                    className="w-full px-4 py-3 bg-white border border-black/15 rounded-xl text-sm text-[#180608] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#8D1516] min-h-[48px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#180608]/80 mb-1.5 uppercase">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-white border border-black/15 rounded-xl text-sm text-[#180608] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#8D1516] min-h-[48px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#8D1516] hover:bg-[#6D1011] text-[#F9F1EC] font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In / Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 3: Google */}
            {activeTab === "google" && (
              <div className="space-y-4 py-2">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 border border-black/15 bg-white hover:bg-neutral-50 rounded-xl text-[#180608] font-bold text-sm transition-all flex items-center justify-center gap-3 min-h-[48px] shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isSubmitting ? "Connecting to Google..." : "Continue with Google"}</span>
                </button>

                <p className="text-[11px] text-center text-[#180608]/60">
                  One-tap authentication with instant offline guest progress migration.
                </p>
              </div>
            )}

            {/* Non-Destructive Data Guarantee Notice */}
            <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between text-[11px] text-[#180608]/70">
              <span className="flex items-center gap-1.5 text-[#2D6A4F] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Offline records will migrate atomically
              </span>
              <span className="font-mono text-[10px] text-[#180608]/50">Zero Overwrites</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}