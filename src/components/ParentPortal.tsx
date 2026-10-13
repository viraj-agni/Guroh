"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  Award,
  Sparkles,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Mail,
  Zap,
  Layers,
  ArrowRight,
  TrendingUp,
  Brain,
  ChevronRight,
  KeyRound,
  RotateCcw,
  Star,
  Flame,
  Check
} from "lucide-react";
import { synth } from "@/components/AudioEngine";
import {
  getGuestProfile,
  saveGuestProfile,
  getAllLessonProgress,
  getCachedCurriculumDAG,
  GuestProfileRecord,
  LessonProgressRecord,
  ClientCurriculumDAG
} from "@/lib/indexedDB";
import k1DagData from "@/data/k1-dag.verified.json";

interface ParentPortalProps {
  onBackToApp?: () => void;
  onRequestAuth?: (reason: string) => void;
}

export default function ParentPortal({ onBackToApp, onRequestAuth }: ParentPortalProps) {
  // Authentication & PIN State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSettingNewPin, setIsSettingNewPin] = useState<boolean>(false);
  const [newPinValue, setNewPinValue] = useState<string>("");

  // Learner & Analytics Data
  const [profile, setProfile] = useState<GuestProfileRecord | null>(null);
  const [progressRecords, setProgressRecords] = useState<LessonProgressRecord[]>([]);
  const [dagSummary, setDagSummary] = useState<{ totalNodes: number; totalEdges: number }>({
    totalNodes: 24,
    totalEdges: 21,
  });
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "membership" | "settings">("overview");

  // Upgrade Modal / Toast State
  const [upgradeSuccess, setUpgradeSuccess] = useState<boolean>(false);

  // Load local state
  const loadPortalData = async () => {
    try {
      const prof = await getGuestProfile();
      setProfile(prof);

      const progress = await getAllLessonProgress();
      setProgressRecords(progress);

      const cachedDag = await getCachedCurriculumDAG();
      if (cachedDag && cachedDag.summary) {
        setDagSummary({
          totalNodes: cachedDag.summary.total_nodes || 24,
          totalEdges: cachedDag.summary.total_edges || 21,
        });
      } else if (k1DagData && k1DagData.nodes) {
        setDagSummary({
          totalNodes: k1DagData.nodes.length,
          totalEdges: k1DagData.edges?.length || 21,
        });
      }
    } catch (e) {
      console.warn("Failed loading parent portal data:", e);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  // PIN Verification
  const currentPin = profile?.parentPin || "1234";

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length >= 4) return;
    synth.playClick();
    const updated = enteredPin + digit;
    setEnteredPin(updated);
    setPinError(null);

    if (updated.length === 4) {
      if (updated === currentPin) {
        synth.playSuccess();
        setIsUnlocked(true);
      } else {
        synth.playThud();
        setPinError("Incorrect PIN. Please re-enter or use default (1234).");
        setTimeout(() => setEnteredPin(""), 600);
      }
    }
  };

  const handlePinBackspace = () => {
    synth.playClick();
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleUpdatePin = async () => {
    if (newPinValue.length !== 4) {
      setPinError("PIN must be exactly 4 digits.");
      return;
    }
    const updated = await saveGuestProfile({ parentPin: newPinValue });
    setProfile(updated);
    setIsSettingNewPin(false);
    setNewPinValue("");
    synth.playSuccess();
  };

  // Analytics Computation
  const masteredCount = useMemo(() => {
    return progressRecords.filter((r) => r.completed).length;
  }, [progressRecords]);

  const inProgressCount = useMemo(() => {
    return progressRecords.filter((r) => !r.completed && (r.score > 0 || r.stage > 1)).length;
  }, [progressRecords]);

  const sessionLimitMins = profile?.sessionLimitMinutes ?? 45;
  const timeSpentMins = Math.round((profile?.totalTimeSpentSeconds ?? 1920) / 60);

  // Upgrade Membership Tier (Simulated transparent one-click zero predatory action)
  const handleUpgradeTier = async () => {
    synth.playSuccess();
    const updated = await saveGuestProfile({
      membershipTier: "scholar_club",
      membershipActivatedAt: Date.now(),
    });
    setProfile(updated);
    setUpgradeSuccess(true);
    setTimeout(() => setUpgradeSuccess(false), 4000);
  };

  const handleDowngradeTier = async () => {
    synth.playClick();
    const updated = await saveGuestProfile({
      membershipTier: "free",
    });
    setProfile(updated);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col font-sans text-guroh-ink">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-guroh-primary flex items-center justify-center text-guroh-ivory shadow-md">
            <ShieldCheck className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-guroh-ink tracking-tight">
                Parent & Guardian Portal
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#8D1516]/10 text-guroh-primary border border-[#8D1516]/20">
                P2 Shield
              </span>
            </div>
            <p className="text-xs text-guroh-ink/70 font-body">
              Session governance, cognitive telemetry & anti-predatory membership control.
            </p>
          </div>
        </div>

        {onBackToApp && (
          <button
            onClick={() => {
              synth.playClick();
              onBackToApp();
            }}
            className="self-start sm:self-auto min-h-[48px] px-4 py-2.5 rounded-xl border border-black/10 bg-white/80 hover:bg-white text-xs font-semibold text-guroh-ink transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-guroh-primary stroke-[1.75]" />
            <span>Return to Learning Canvas</span>
          </button>
        )}
      </div>

      {/* PIN Security Gate Screen if Locked */}
      {!isUnlocked ? (
        <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
          <div className="w-16 h-16 rounded-2xl bg-white border border-black/10 shadow-lg flex items-center justify-center text-guroh-primary mb-5">
            <Lock className="w-8 h-8 stroke-[1.75]" />
          </div>
          <h2 className="text-xl font-display font-bold text-guroh-ink">
            Parent Security Gate
          </h2>
          <p className="text-xs text-guroh-ink/75 max-w-sm mt-1.5 font-body leading-relaxed">
            Enter your 4-digit Parent PIN to access learner diagnostics, session limits, and membership settings.
          </p>

          {/* PIN Digit Indicators */}
          <div className="flex gap-4 my-6">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = enteredPin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-mono transition-all border ${
                    isFilled
                      ? "bg-guroh-primary text-guroh-ivory border-guroh-primary shadow-sm scale-105"
                      : "bg-white border-black/15 text-guroh-ink/30"
                  }`}
                >
                  {isFilled ? "●" : ""}
                </div>
              );
            })}
          </div>

          {pinError && (
            <div className="text-xs font-semibold text-[#8D1516] bg-[#8D1516]/10 px-3.5 py-1.5 rounded-lg mb-4 flex items-center gap-1.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {/* 4x3 Number Pad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "←"].map((key) => {
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "C") {
                      synth.playClick();
                      setEnteredPin("");
                    } else if (key === "←") {
                      handlePinBackspace();
                    } else {
                      handlePinDigit(key);
                    }
                  }}
                  className="min-h-[52px] rounded-xl bg-white/90 hover:bg-white active:bg-guroh-ivory border border-black/10 font-mono text-base font-bold text-guroh-ink transition-all shadow-sm flex items-center justify-center cursor-pointer select-none"
                >
                  {key}
                </button>
              );
            })}
          </div>

          <div className="mt-6 text-[11px] text-guroh-ink/60 font-mono">
            Default sandbox PIN is <span className="font-bold text-guroh-primary">1234</span>
          </div>
        </div>
      ) : (
        /* Unlocked Parent Portal Dashboard */
        <div className="pt-6 flex flex-col gap-6">
          {/* Sub Navigation Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/[0.03] border border-black/10 rounded-2xl">
            {[
              { id: "overview", label: "Executive Overview", icon: BarChart3 },
              { id: "analytics", label: "Knowledge DAG Telemetry", icon: Brain },
              { id: "membership", label: "Anti-Predatory Paywall & Tiers", icon: Award },
              { id: "settings", label: "Session Limits & PIN", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    synth.playClick();
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-mono transition-all min-h-[48px] cursor-pointer ${
                    isActive
                      ? "bg-guroh-primary text-guroh-ivory shadow-md"
                      : "text-guroh-ink/70 hover:text-guroh-ink hover:bg-white/60"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Upgrade Toast Notification */}
          <AnimatePresence>
            {upgradeSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 text-[#2D6A4F] flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0" />
                  <span className="text-xs font-semibold">
                    Scholar Club unlocked! Full K-12 Neo4j graph & deep Bayesian telemetry active.
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-[#2D6A4F]/20 px-2 py-0.5 rounded">
                  Activated
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">
              {/* Learner Card */}
              <div className="p-6 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#8D1516]/10 border border-[#8D1516]/20 flex items-center justify-center text-guroh-primary font-bold text-xl font-display">
                    {profile?.learnerName ? profile.learnerName.charAt(0).toUpperCase() : "G"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-display font-bold text-guroh-ink">
                        {profile?.learnerName || "Guest Scholar"}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                        {profile?.membershipTier === "scholar_club" ? "Scholar Club Member" : "Free Early Learner Tier"}
                      </span>
                    </div>
                    <p className="text-xs text-guroh-ink/70 font-body mt-1">
                      Archetype: <span className="font-semibold capitalize">{profile?.archetype?.replace("_", " ") || "Young Learner"}</span> • DOB: {profile?.dobMonth || "Jan"} {profile?.dobYear || "2020"} • Calibrated for early spatial cognition.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="px-4 py-3 rounded-xl bg-black/[0.03] border border-black/10 flex flex-col items-center min-w-[110px]">
                    <span className="text-[10px] font-mono uppercase text-guroh-ink/60 font-semibold">Tier</span>
                    <span className="text-sm font-bold text-guroh-primary font-display mt-0.5">
                      {profile?.membershipTier === "scholar_club" ? "Pro" : "Free"}
                    </span>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-black/[0.03] border border-black/10 flex flex-col items-center min-w-[110px]">
                    <span className="text-[10px] font-mono uppercase text-guroh-ink/60 font-semibold">Diagnostic</span>
                    <span className="text-sm font-bold text-[#2D6A4F] font-display mt-0.5">
                      {profile?.diagnosticCompleted ? `${profile.diagnosticScore || 100}%` : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-guroh-ink/60 mb-2">
                    <span className="text-xs font-mono font-semibold uppercase">Daily Time Limit</span>
                    <Clock className="w-4 h-4 text-guroh-primary" />
                  </div>
                  <div className="text-2xl font-bold font-display text-guroh-ink">
                    {timeSpentMins} / {sessionLimitMins === 0 ? "∞" : `${sessionLimitMins}m`}
                  </div>
                  <div className="mt-3 w-full bg-black/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-guroh-primary h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${sessionLimitMins === 0 ? 30 : Math.min(100, (timeSpentMins / sessionLimitMins) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-guroh-ink/60 font-mono mt-2">
                    {sessionLimitMins === 0 ? "Self-guided (No hard ceiling)" : `${Math.max(0, sessionLimitMins - timeSpentMins)} mins remaining today`}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-guroh-ink/60 mb-2">
                    <span className="text-xs font-mono font-semibold uppercase">DAG Mastery</span>
                    <Award className="w-4 h-4 text-[#2D6A4F]" />
                  </div>
                  <div className="text-2xl font-bold font-display text-[#2D6A4F]">
                    {masteredCount} / {dagSummary.totalNodes}
                  </div>
                  <div className="mt-3 w-full bg-black/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2D6A4F] h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (masteredCount / Math.max(1, dagSummary.totalNodes)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-guroh-ink/60 font-mono mt-2">
                    {Math.round((masteredCount / Math.max(1, dagSummary.totalNodes)) * 100)}% of foundational counting nodes
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-guroh-ink/60 mb-2">
                    <span className="text-xs font-mono font-semibold uppercase">In-Progress Labs</span>
                    <Flame className="w-4 h-4 text-[#8D1516]" />
                  </div>
                  <div className="text-2xl font-bold font-display text-[#8D1516]">
                    {inProgressCount} Active
                  </div>
                  <span className="text-xs text-guroh-ink/75 font-body mt-2">
                    Interactive simulations currently underway in Stage 1 & 2.
                  </span>
                  <span className="text-[10px] text-guroh-ink/60 font-mono mt-2">
                    Zero penalty for exploration
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-guroh-ink/60 mb-2">
                    <span className="text-xs font-mono font-semibold uppercase">Guardian Reports</span>
                    <Mail className="w-4 h-4 text-[#D9A066]" />
                  </div>
                  <div className="text-base font-bold font-display text-guroh-ink capitalize">
                    {profile?.reportFrequency || "Weekly"}
                  </div>
                  <span className="text-xs text-guroh-ink/75 font-mono truncate mt-1">
                    {profile?.reportTarget || "parent@example.com"}
                  </span>
                  <span className="text-[10px] text-[#2D6A4F] font-mono mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Channel: {profile?.reportChannel || "Email"}
                  </span>
                </div>
              </div>

              {/* Callout: Anti-Predatory Guarantee */}
              <div className="p-5 rounded-2xl bg-[#D9A066]/10 border border-[#D9A066]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#D9A066]/20 flex items-center justify-center text-guroh-ink shrink-0">
                    <Star className="w-5 h-5 text-guroh-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-guroh-ink">
                      Anti-Predatory Architecture Pledge
                    </h3>
                    <p className="text-xs text-guroh-ink/75 font-body mt-0.5">
                      No countdown timers to induce panic, no manipulative dark patterns, and no lockouts of foundational K-1 mathematics.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("membership")}
                  className="shrink-0 min-h-[48px] px-4 py-2 rounded-xl bg-guroh-primary text-guroh-ivory hover:bg-[#721112] text-xs font-bold font-mono transition-all shadow-sm cursor-pointer"
                >
                  View Tier Specifications
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: KNOWLEDGE DAG TELEMETRY */}
          {activeTab === "analytics" && (
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-white border border-black/10 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-display font-bold text-guroh-ink">
                      Cognitive Mastery Distribution
                    </h2>
                    <p className="text-xs text-guroh-ink/70 font-body">
                      Real-time cross-referencing with Tony&apos;s verified K-1 Knowledge Graph.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-guroh-primary bg-black/[0.04] px-3 py-1.5 rounded-lg border border-black/10">
                    {progressRecords.length} Active Records
                  </span>
                </div>

                {/* Progress Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono uppercase font-bold text-[#10B981]">Mastered</span>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <div className="text-2xl font-bold font-display text-guroh-ink">{masteredCount} Nodes</div>
                    <p className="text-[11px] text-guroh-ink/70 mt-1">Passed with verified mathematical accuracy</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#8D1516]/10 border border-[#8D1516]/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono uppercase font-bold text-guroh-primary">In Progress</span>
                      <Flame className="w-4 h-4 text-guroh-primary" />
                    </div>
                    <div className="text-2xl font-bold font-display text-guroh-ink">{inProgressCount} Nodes</div>
                    <p className="text-[11px] text-guroh-ink/70 mt-1">Exploration active across Shu &amp; Ha stages</p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/[0.03] border border-black/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono uppercase font-bold text-guroh-ink/60">Curriculum Total</span>
                      <Layers className="w-4 h-4 text-guroh-ink/60" />
                    </div>
                    <div className="text-2xl font-bold font-display text-guroh-ink">{dagSummary.totalNodes} Nodes</div>
                    <p className="text-[11px] text-guroh-ink/70 mt-1">Formally verified acyclic pedagogical DAG</p>
                  </div>
                </div>

                {/* Granular Node Record Table */}
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-guroh-ink/70 mb-3">
                  Recent Lesson &amp; Diagnostic Records
                </h3>

                {progressRecords.length === 0 ? (
                  <div className="p-8 text-center bg-black/[0.02] rounded-xl border border-dashed border-black/15">
                    <Brain className="w-8 h-8 text-guroh-ink/30 mx-auto mb-2" />
                    <p className="text-xs text-guroh-ink/70 font-body">
                      No lesson progress stored in IndexedDB yet. Have the learner try an interactive lab or the diagnostic sandbox!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-black/10 text-guroh-ink/60">
                          <th className="py-2.5 px-3">Node ID</th>
                          <th className="py-2.5 px-3">Flywheel Stage</th>
                          <th className="py-2.5 px-3">Score</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {progressRecords.map((item) => (
                          <tr key={item.nodeId} className="hover:bg-black/[0.02] transition-colors">
                            <td className="py-3 px-3 font-bold text-guroh-primary">{item.nodeId}</td>
                            <td className="py-3 px-3">
                              Stage {item.stage}: {item.stage === 1 ? "Intuition" : item.stage === 2 ? "Experiment" : "Mastery"}
                            </td>
                            <td className="py-3 px-3 font-semibold">{item.score}%</td>
                            <td className="py-3 px-3">
                              {item.completed ? (
                                <span className="inline-flex items-center gap-1 text-[#10B981] font-bold">
                                  <Check className="w-3.5 h-3.5" /> Mastered
                                </span>
                              ) : (
                                <span className="text-guroh-primary font-bold">In Progress</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right text-guroh-ink/60">
                              {new Date(item.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSPARENT ANTI-PREDATORY PAYWALL & MEMBERSHIP */}
          {activeTab === "membership" && (
            <div className="flex flex-col gap-6">
              <div className="text-center max-w-2xl mx-auto mb-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#D9A066]/20 text-guroh-primary border border-[#D9A066]/30 uppercase tracking-wider">
                  Ethical Monetization Model
                </span>
                <h2 className="text-2xl font-display font-bold text-guroh-ink mt-2">
                  Transparent, Pressure-Free Education
                </h2>
                <p className="text-xs text-guroh-ink/75 font-body mt-1 leading-relaxed">
                  We reject addictive gamification, predatory countdown timers, and paywalling foundational numeracy.
                  Early learners can master foundational math freely forever.
                </p>
              </div>

              {/* Comparison Tier Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Free Tier */}
                <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  profile?.membershipTier !== "scholar_club"
                    ? "bg-white border-guroh-primary/40 shadow-md ring-2 ring-guroh-primary/20"
                    : "bg-white/80 border-black/10"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-guroh-ink/60">
                        Foundational Tier
                      </span>
                      {profile?.membershipTier !== "scholar_club" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2D6A4F]/10 text-[#2D6A4F]">
                          Current Tier
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-3xl font-display font-bold text-guroh-ink">$0</span>
                      <span className="text-xs text-guroh-ink/60 font-mono">/ Free Forever</span>
                    </div>
                    <p className="text-xs text-guroh-ink/75 font-body leading-relaxed mb-6">
                      Full access to foundational early childhood mathematics, tactile manipulatives, and local device persistence.
                    </p>

                    <div className="space-y-3 pt-4 border-t border-black/10 text-xs font-body">
                      {[
                        "Complete K.CC Foundational Counting & Cardinality Labs",
                        "24-Node Verified K-1 Knowledge Graph Access",
                        "Interactive Sensory Scaffolding & Audio Synthesizer",
                        "Zero Advertising & Zero Third-Party Tracking",
                        "Local-First IndexedDB Progress Retention",
                        "Parent Session Governance & Timer Controls",
                      ].map((perk, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-guroh-ink/80">
                          <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    {profile?.membershipTier === "scholar_club" ? (
                      <button
                        onClick={handleDowngradeTier}
                        className="w-full min-h-[48px] rounded-xl border border-black/15 bg-white hover:bg-black/[0.03] text-xs font-semibold text-guroh-ink transition-all cursor-pointer"
                      >
                        Switch to Free Foundational Tier
                      </button>
                    ) : (
                      <div className="w-full min-h-[48px] rounded-xl bg-black/[0.04] border border-black/10 flex items-center justify-center text-xs font-mono font-bold text-guroh-ink/60">
                        Currently Active
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Scholar Club / Pro Tier */}
                <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  profile?.membershipTier === "scholar_club"
                    ? "bg-white border-[#8D1516] shadow-xl ring-2 ring-[#8D1516]/20"
                    : "bg-white border-[#D9A066]/40 shadow-md"
                }`}>
                  <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-[#8D1516]/5 rounded-full pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-guroh-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#D9A066]" />
                        Scholar Club (P2)
                      </span>
                      {profile?.membershipTier === "scholar_club" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-guroh-primary text-guroh-ivory">
                          Active Membership
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D9A066]/20 text-guroh-primary">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-3xl font-display font-bold text-guroh-ink">$9</span>
                      <span className="text-xs text-guroh-ink/60 font-mono">/ month (Cancel anytime)</span>
                    </div>
                    <p className="text-xs text-guroh-ink/75 font-body leading-relaxed mb-6">
                      For parents seeking end-to-end mathematical rigor across all 12 grades and deep cognitive state tracking.
                    </p>

                    <div className="space-y-3 pt-4 border-t border-black/10 text-xs font-body">
                      {[
                        "Full K-12 Neo4j Knowledge DAG (528+ Validated Nodes)",
                        "Deep Bayesian Knowledge Tracing (BKT) Cognitive Diagnostics",
                        "Multi-Device Cloud Synchronization & Guardian Pairing",
                        "Weekly Guardian Telegram / WhatsApp Cognitive Digests",
                        "Continuous Physical AI & Robotics Simulation Sandbox",
                        "Priority Access to Competitive Math (JEE / Olympiad) Tracks",
                      ].map((perk, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-guroh-ink">
                          <CheckCircle2 className="w-4 h-4 text-guroh-primary shrink-0" />
                          <span className="font-medium">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    {profile?.membershipTier === "scholar_club" ? (
                      <div className="w-full min-h-[48px] rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 text-[#2D6A4F] flex items-center justify-center text-xs font-mono font-bold gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Active Scholar Club Membership</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleUpgradeTier}
                        className="w-full min-h-[52px] rounded-xl bg-guroh-primary hover:bg-[#721112] text-guroh-ivory text-xs font-bold font-mono transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <Zap className="w-4 h-4 text-[#D9A066] fill-[#D9A066]" />
                        <span>Activate Scholar Club (1-Click Test Sandbox)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Guarantee Footer */}
              <div className="p-4 rounded-xl bg-black/[0.02] border border-black/10 text-center text-xs text-guroh-ink/70 font-body">
                💡 <span className="font-semibold text-guroh-ink">Transparent Billing Promise:</span> No unexpected renewals, zero hidden cancellation flows, and instant account downgrade with full data export.
              </div>
            </div>
          )}

          {/* TAB 4: SESSION LIMITS & PIN SETTINGS */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
              {/* Session Limit Controls */}
              <div className="p-6 rounded-2xl bg-white border border-black/10 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-guroh-primary" />
                  <h2 className="text-lg font-display font-bold text-guroh-ink">
                    Session Duration &amp; Screen Limits
                  </h2>
                </div>
                <p className="text-xs text-guroh-ink/70 font-body mb-6">
                  Protect early learner visual ergonomics. The sandbox gracefully pauses with a friendly rest suggestion when reached.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[30, 45, 60, 0].map((mins) => {
                    const isSelected = sessionLimitMins === mins;
                    return (
                      <button
                        key={mins}
                        onClick={async () => {
                          synth.playClick();
                          const updated = await saveGuestProfile({ sessionLimitMinutes: mins });
                          setProfile(updated);
                        }}
                        className={`min-h-[48px] p-3 rounded-xl border text-center transition-all cursor-pointer font-mono ${
                          isSelected
                            ? "bg-guroh-primary text-guroh-ivory border-guroh-primary shadow-sm font-bold"
                            : "bg-black/[0.02] hover:bg-black/[0.05] border-black/10 text-guroh-ink"
                        }`}
                      >
                        <div className="text-sm font-bold">
                          {mins === 0 ? "Unlimited" : `${mins} min`}
                        </div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          {mins === 0 ? "Self-Guided" : "Recommended"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PIN Modification */}
              <div className="p-6 rounded-2xl bg-white border border-black/10 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <KeyRound className="w-5 h-5 text-guroh-primary" />
                  <h2 className="text-lg font-display font-bold text-guroh-ink">
                    Guardian PIN Protection
                  </h2>
                </div>
                <p className="text-xs text-guroh-ink/70 font-body mb-4">
                  Customize your 4-digit security PIN to prevent children from inadvertently altering settings.
                </p>

                {!isSettingNewPin ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] border border-black/10">
                    <div>
                      <span className="text-xs font-mono text-guroh-ink/60 block">Current PIN</span>
                      <span className="text-lg font-mono font-bold tracking-widest text-guroh-ink">
                        •••• (Configured)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        synth.playClick();
                        setIsSettingNewPin(true);
                        setPinError(null);
                      }}
                      className="min-h-[48px] px-4 py-2 rounded-xl bg-black/[0.05] hover:bg-black/10 text-xs font-mono font-bold text-guroh-ink border border-black/10 transition-all cursor-pointer"
                    >
                      Change PIN
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-black/[0.02] border border-black/10 flex flex-col gap-3">
                    <label className="text-xs font-mono text-guroh-ink/70">
                      Enter New 4-Digit Numeric PIN:
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPinValue}
                      onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 5678"
                      className="min-h-[48px] px-4 rounded-xl bg-white border border-black/15 font-mono text-base tracking-widest text-guroh-ink outline-none focus:border-guroh-primary"
                    />
                    {pinError && <p className="text-xs text-[#8D1516] font-semibold">{pinError}</p>}
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => {
                          synth.playClick();
                          setIsSettingNewPin(false);
                          setNewPinValue("");
                        }}
                        className="min-h-[48px] px-4 py-2 rounded-xl border border-black/10 text-xs font-mono font-semibold text-guroh-ink hover:bg-black/[0.03] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdatePin}
                        className="min-h-[48px] px-5 py-2 rounded-xl bg-guroh-primary text-guroh-ivory text-xs font-mono font-bold hover:bg-[#721112] cursor-pointer shadow-sm"
                      >
                        Save PIN
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
