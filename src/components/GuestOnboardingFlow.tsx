"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Lock,
  ChevronRight,
  Target,
  RefreshCw,
  Award
} from "lucide-react";
import { InteractiveLabCanvas, InteractiveLabPayload } from "@/components/InteractiveLabCanvas";
import { saveLessonProgress, saveGuestProfile, getGuestProfile, getOrCreateGuestId } from "@/lib/indexedDB";
import { synth } from "@/components/AudioEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type OnboardingStep = "archetype" | "profile" | "controls" | "diagnostic" | "completed";

interface GuestOnboardingFlowProps {
  onFlowCompleted?: () => void;
  onExploreDashboard?: () => void;
  onOpenParentPortal?: () => void;
  onRequestAuth?: (reason: string) => void;
}

export default function GuestOnboardingFlow({
  onFlowCompleted,
  onExploreDashboard,
  onOpenParentPortal,
  onRequestAuth,
}: GuestOnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>("archetype");
  const [archetype, setArchetype] = useState<"young_learner" | "independent">("young_learner");
  
  // Step 2 profile inputs
  const [learnerName, setLearnerName] = useState("");
  const [dobMonth, setDobMonth] = useState("06");
  const [dobYear, setDobYear] = useState("2018");
  const [parentConsent, setParentConsent] = useState(true);

  // Step 3 parent controls
  const [sessionLimit, setSessionLimit] = useState<number>(45);
  const [reportChannel, setReportChannel] = useState<"email" | "whatsapp" | "telegram" | "wechat">("email");
  const [reportFrequency, setReportFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [reportContact, setReportContact] = useState("parent@example.com");

  // Step 4 diagnostic simulation state
  const [diagnosticScore, setDiagnosticScore] = useState<number>(0);
  const [challengeIdx, setChallengeIdx] = useState<number>(0);
  const [labPayload, setLabPayload] = useState<InteractiveLabPayload>({
    labId: "vector-intuition-lab-01",
    conceptId: "vector-trajectory-01",
    instructionText: "Drag all 3 vector tokens into the Target Zone to establish trajectory!",
    audioInstructionUrl: null,
    draggables: [
      { id: "vec-1", type: "circle-token", initialX: 40, initialY: 180 },
      { id: "vec-2", type: "circle-token", initialX: 110, initialY: 180 },
      { id: "vec-3", type: "circle-token", initialX: 180, initialY: 180 },
    ],
    dropZone: {
      id: "target-zone",
      shape: "circle",
      bounds: { x: 380, y: 150, radius: 80 },
      targetCount: 3,
    },
  });
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [hintMessage, setHintMessage] = useState<string>(
    "Drag all 3 vector tokens into the circular target zone to establish baseline spatial intuition."
  );

  // Load existing profile if available
  useEffect(() => {
    async function loadInitial() {
      const existing = await getGuestProfile();
      if (existing) {
        if (existing.learnerName) setLearnerName(existing.learnerName);
        if (existing.archetype) setArchetype(existing.archetype);
        if (existing.sessionLimitMinutes) setSessionLimit(existing.sessionLimitMinutes);
        if (existing.reportChannel) setReportChannel(existing.reportChannel);
        if (existing.reportFrequency) setReportFrequency(existing.reportFrequency);
        if (existing.reportTarget) setReportContact(existing.reportTarget);
        if (existing.diagnosticCompleted) {
          setDiagnosticScore(existing.diagnosticScore || 100);
          setStep("completed");
        }
      }
    }
    loadInitial();
  }, []);

  // Archetype continue
  const handleArchetypeContinue = async () => {
    synth.playClick();
    if (archetype === "independent") return; // Coming soon guard
    await saveGuestProfile({ archetype });
    setStep("profile");
  };

  // Profile continue
  const handleProfileContinue = async () => {
    synth.playClick();
    await saveGuestProfile({
      archetype,
      learnerName: learnerName.trim() || "Young Explorer",
      dobMonth,
      dobYear,
    });
    setStep("controls");
  };

  // Controls continue -> launches Diagnostic Sandbox in Zone 2
  const handleControlsContinue = async () => {
    synth.playClick();
    await saveGuestProfile({
      sessionLimitMinutes: sessionLimit,
      reportChannel,
      reportFrequency,
      reportTarget: reportContact,
    });
    setStep("diagnostic");
  };

  // Diagnostic feedback handler from InteractiveLabCanvas
  const handleLabSolve = async () => {
    if (!isSuccess) {
      synth.playSuccess();
      setIsSuccess(true);
      const newScore = Math.min(100, diagnosticScore + 50);
      setDiagnosticScore(newScore);
      setHintMessage("Bullseye! Intuition target reached!");

      if (challengeIdx === 0) {
        setTimeout(() => {
          setChallengeIdx(1);
          setIsSuccess(false);
          setLabPayload({
            labId: "vector-intuition-lab-02",
            conceptId: "vector-magnitude-02",
            instructionText: "Challenge 2: Drag 4 tokens into the precision target!",
            audioInstructionUrl: null,
            draggables: [
              { id: "vec-a", type: "circle-token", initialX: 30, initialY: 180 },
              { id: "vec-b", type: "circle-token", initialX: 90, initialY: 180 },
              { id: "vec-c", type: "circle-token", initialX: 150, initialY: 180 },
              { id: "vec-d", type: "circle-token", initialX: 210, initialY: 180 },
            ],
            dropZone: {
              id: "target-zone-2",
              shape: "circle",
              bounds: { x: 390, y: 150, radius: 90 },
              targetCount: 4,
            },
          });
          setHintMessage("Level 2: Calibrate multi-token vector equilibrium inside the precision zone.");
        }, 1200);
      } else {
        // Complete diagnostic & persist directly to IndexedDB
        setTimeout(async () => {
          const finalScore = 100;
          setDiagnosticScore(finalScore);
          await saveLessonProgress({
            nodeId: "diagnostic_vector_intuition",
            stage: 1,
            completed: true,
            score: finalScore,
          });
          await saveGuestProfile({
            diagnosticCompleted: true,
            diagnosticScore: finalScore,
          });
          setStep("completed");
          if (onFlowCompleted) onFlowCompleted();
        }, 1200);
      }
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start bg-vidya-bg text-guroh-ivory p-4 sm:p-6 md:p-8">
      {/* Top Breadcrumb Indicator */}
      {step !== "completed" && (
        <div className="w-full max-w-md mx-auto mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            {step !== "archetype" && (
              <button
                onClick={() => {
                  synth.playClick();
                  if (step === "profile") setStep("archetype");
                  else if (step === "controls") setStep("profile");
                  else if (step === "diagnostic") setStep("controls");
                }}
                className="p-2 rounded-full bg-vidya-surface border border-white/10 hover:border-guroh-primary text-guroh-ivory transition-colors cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Badge variant="outline" className="border-guroh-primary/30 text-guroh-ivory bg-guroh-primary/10">
              {step === "archetype" && "Step 1 of 3: Archetype"}
              {step === "profile" && "Step 2 of 3: Profile"}
              {step === "controls" && "Step 3 of 3: Parent Settings"}
              {step === "diagnostic" && "Intuition Diagnostic"}
            </Badge>
          </div>
          <div className="text-xs font-mono text-guroh-gold-dark font-medium">
            Guest Session Active
          </div>
        </div>
      )}

      {/* Screen 1: Archetype Selection */}
      <AnimatePresence mode="wait">
        {step === "archetype" && (
          <motion.div
            key="archetype"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md flex flex-col gap-6"
          >
            <div className="text-left space-y-2">
              <h1 className="text-3xl font-display font-bold text-guroh-ivory tracking-tight">
                What best describes you?
              </h1>
              <p className="text-sm text-guroh-gold-dark/80 font-sans">
                Select profile type to customize pacing and tactile learning modules.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Young Learner Card */}
              <div
                onClick={() => {
                  synth.playClick();
                  setArchetype("young_learner");
                }}
                className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between h-56 ${
                  archetype === "young_learner"
                    ? "bg-[#FFF5F4]/10 border-guroh-primary ring-2 ring-guroh-primary shadow-[0_8px_24px_rgba(141,21,22,0.25)]"
                    : "bg-guroh-surface border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex justify-end">
                  {archetype === "young_learner" && (
                    <span className="w-6 h-6 rounded-full bg-guroh-primary flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-guroh-ivory font-display">
                    Young Learner
                  </div>
                  <div className="text-xs text-guroh-gold-dark">
                    Ages 5 – 15
                  </div>
                </div>
              </div>

              {/* Independent Adult Card (Coming Soon) */}
              <div
                onClick={() => {
                  synth.playClick();
                  setArchetype("independent");
                }}
                className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between h-56 ${
                  archetype === "independent"
                    ? "bg-[#FFF5F4]/10 border-guroh-primary ring-2 ring-guroh-primary"
                    : "bg-guroh-surface/60 border-white/5 opacity-80"
                }`}
              >
                <div className="flex justify-end">
                  <Badge variant="ghost" className="text-[10px] bg-white/10 text-guroh-gold-dark px-2 py-0.5">
                    Coming Soon
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-guroh-ivory/80 font-display">
                    Independent
                  </div>
                  <div className="text-xs text-guroh-gold-dark/70">
                    Ages 16 & above
                  </div>
                </div>
              </div>
            </div>

            {archetype === "independent" && (
              <div className="p-4 rounded-xl bg-guroh-primary/10 border border-guroh-primary/30 text-xs text-guroh-ivory flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-guroh-gold-dark shrink-0" />
                <span>
                  Independent adult mode is launching soon! Please choose <strong>Young Learner</strong> for immediate access.
                </span>
              </div>
            )}

            <Button
              onClick={handleArchetypeContinue}
              disabled={archetype === "independent"}
              className="w-full min-h-[52px] rounded-xl text-base font-bold"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Screen 2: Profile Setup */}
        {step === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md flex flex-col gap-6"
          >
            <div className="text-left space-y-2">
              <h1 className="text-3xl font-display font-bold text-guroh-ivory tracking-tight">
                Set up learner profile
              </h1>
              <p className="text-sm text-guroh-gold-dark/80 font-sans">
                Create a profile tailored for your young learner. No password required.
              </p>
            </div>

            {/* Guardian Consent Box */}
            <div className="p-4 rounded-2xl bg-guroh-surface border border-white/10 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-guroh-primary/20 text-guroh-primary flex items-center justify-center">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <span className="text-sm font-bold text-guroh-ivory">Parent / Guardian Consent</span>
              </div>
              <label className="flex items-start gap-3 cursor-pointer text-xs text-guroh-gold-dark/90 leading-relaxed">
                <input
                  type="checkbox"
                  checked={parentConsent}
                  onChange={(e) => setParentConsent(e.target.checked)}
                  className="mt-0.5 accent-guroh-primary w-4 h-4 rounded"
                />
                <span>I verify that I am a parent or guardian of the child and am authorised to calibrate this profile.</span>
              </label>
              <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[11px] text-guroh-gold-dark/60 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero third-party data tracking. Stored locally first.</span>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-guroh-ivory uppercase tracking-wider mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                  placeholder="e.g. Aarav or Priya"
                  className="w-full px-4 py-3 rounded-xl bg-guroh-surface border border-white/15 focus:border-guroh-primary text-guroh-ivory text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-guroh-ivory uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <span className="text-[10px] text-guroh-gold-dark/70 font-mono">
                    (Calibrates age-appropriate drills)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-guroh-surface border border-white/15 text-guroh-ivory text-sm outline-none"
                  >
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  <select
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-guroh-surface border border-white/15 text-guroh-ivory text-sm outline-none"
                  >
                    <option value="2019">2019 (Age 7)</option>
                    <option value="2018">2018 (Age 8)</option>
                    <option value="2017">2017 (Age 9)</option>
                    <option value="2016">2016 (Age 10)</option>
                    <option value="2015">2015 (Age 11)</option>
                    <option value="2014">2014 (Age 12)</option>
                    <option value="2013">2013 (Age 13)</option>
                  </select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleProfileContinue}
              disabled={!parentConsent}
              className="w-full min-h-[52px] rounded-xl text-base font-bold"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Screen 3: Parent Controls & Updates */}
        {step === "controls" && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md flex flex-col gap-6"
          >
            <div className="text-left space-y-2">
              <h1 className="text-3xl font-display font-bold text-guroh-ivory tracking-tight">
                Parent Controls
              </h1>
              <p className="text-sm text-guroh-gold-dark/80 font-sans">
                Set healthy session limits and configure progress delivery.
              </p>
            </div>

            {/* Session Limits Card */}
            <div className="p-5 rounded-2xl bg-guroh-surface border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-guroh-primary" />
                  <span className="text-sm font-bold text-guroh-ivory">Session Time Limit</span>
                </div>
                <Badge variant="secondary" className="font-bold">
                  {sessionLimit === 0 ? "Self-Guided" : `${sessionLimit} min`}
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 0].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      synth.playClick();
                      setSessionLimit(mins);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      sessionLimit === mins
                        ? "bg-guroh-primary text-white border-guroh-primary shadow-sm"
                        : "bg-white/5 border-white/10 text-guroh-gold-dark hover:border-white/20"
                    }`}
                  >
                    {mins === 0 ? "Unlimited" : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports Channel Selector */}
            <div className="p-5 rounded-2xl bg-guroh-surface border border-white/10 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-guroh-gold-dark" />
                  <span className="text-sm font-bold text-guroh-ivory">Progress Reports</span>
                </div>
                <p className="text-xs text-guroh-gold-dark/80">
                  Receive AI tutor mastery insights and cognitive recommendations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "email", label: "Email", icon: Mail },
                  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                  { id: "telegram", label: "Telegram", icon: Send },
                  { id: "wechat", label: "WeChat", icon: MessageSquare },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        synth.playClick();
                        setReportChannel(item.id as typeof reportChannel);
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        reportChannel === item.id
                          ? "bg-guroh-primary/20 border-guroh-primary text-guroh-ivory"
                          : "bg-white/5 border-white/10 text-guroh-gold-dark/80 hover:border-white/20"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={reportContact}
                onChange={(e) => setReportContact(e.target.value)}
                placeholder="parent@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-guroh-ivory font-mono outline-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-guroh-gold-dark/80 font-medium">Frequency</span>
                <div className="flex gap-1.5">
                  {(["daily", "weekly", "monthly"] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => {
                        synth.playClick();
                        setReportFrequency(freq);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                        reportFrequency === freq
                          ? "bg-guroh-gold-dark text-guroh-gold-ink"
                          : "text-guroh-gold-dark/60 hover:text-guroh-ivory"
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleControlsContinue}
              className="w-full min-h-[52px] rounded-xl text-base font-bold"
            >
              <span>Launch Diagnostic Sandbox</span>
              <Target className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Screen 4: Interactive Vector Intuition Sandbox (Zone 2) */}
        {step === "diagnostic" && (
          <motion.div
            key="diagnostic"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-2xl flex flex-col items-center gap-6"
          >
            <div className="w-full text-center space-y-2">
              <Badge variant="mastery" className="px-3 py-1">
                Challenge {challengeIdx + 1} of 2: Tactile Intuition
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-guroh-ivory">
                Calibrate Vector Trajectory
              </h2>
              <p className="text-sm text-guroh-gold-dark/90 max-w-lg mx-auto">
                {hintMessage}
              </p>
            </div>

            {/* Sandbox Canvas Container in Zone 2 Canvas styling */}
            <div className="w-full p-4 rounded-3xl bg-guroh-surface border border-white/10 shadow-2xl flex flex-col items-center">
              <div className="w-full aspect-[16/9] max-h-[380px] rounded-2xl overflow-hidden bg-guroh-bg-light/95 relative border border-black/10">
                <InteractiveLabCanvas
                  payload={labPayload}
                  onLabSuccess={handleLabSolve}
                />
              </div>

              <div className="w-full mt-4 flex items-center justify-between text-xs text-guroh-gold-dark font-mono px-2">
                <span>Touch/Drag to direct the beam</span>
                <span className="text-guroh-ivory font-bold">Score: {diagnosticScore}/100</span>
              </div>
            </div>

            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Trajectory Locked! Advancing sequence...</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Screen 5: Diagnostic Complete / Value Activation */}
        {step === "completed" && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md flex flex-col items-center text-center gap-6 py-6"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <Badge variant="mastery" className="px-3 py-1">
                Diagnostic Verified
              </Badge>
              <h1 className="text-3xl font-display font-bold text-guroh-ivory tracking-tight">
                Intuition Baseline Established!
              </h1>
              <p className="text-sm text-guroh-gold-dark/80 max-w-sm">
                Your guest profile has calibrated Level 1 Vector Intuition. All progress is safely saved locally in IndexedDB.
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl bg-guroh-surface border border-white/10 text-left space-y-2.5 font-mono text-xs">
              <div className="flex justify-between text-guroh-gold-dark">
                <span>Learner:</span>
                <span className="text-guroh-ivory font-bold">{learnerName || "Young Explorer"}</span>
              </div>
              <div className="flex justify-between text-guroh-gold-dark">
                <span>Diagnostic Score:</span>
                <span className="text-emerald-400 font-bold">{diagnosticScore || 100}%</span>
              </div>
              <div className="flex justify-between text-guroh-gold-dark">
                <span>IndexedDB Sync:</span>
                <span className="text-guroh-gold-dark">Ready (Deferred Sync)</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              {/* Primary Value-First Conversion CTA */}
              <Button
                onClick={() => {
                  synth.playSuccess();
                  if (onRequestAuth) {
                    onRequestAuth("Diagnostic complete! Save your verified progress and invite a guardian to monitor results.");
                  }
                }}
                className="w-full min-h-[52px] rounded-xl text-base font-bold bg-[#D9A066] hover:bg-[#B57C38] text-[#180608] shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-[#8D1516]" />
                <span>Save Progress & Claim Profile</span>
              </Button>

              {onOpenParentPortal && (
                <Button
                  variant="outline"
                  onClick={() => {
                    synth.playClick();
                    onOpenParentPortal();
                  }}
                  className="w-full min-h-[48px] rounded-xl text-sm font-semibold border-guroh-gold-dark/30 text-guroh-gold-dark hover:bg-guroh-gold-dark/10 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Parent Portal (P2)</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  synth.playClick();
                  if (onExploreDashboard) onExploreDashboard();
                  else {
                    const el = document.getElementById("content-library-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full min-h-[48px] rounded-xl text-sm font-semibold border-white/20 text-guroh-ivory hover:bg-white/10"
              >
                <span>Continue as Guest Scholar</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <button
                onClick={() => {
                  synth.playClick();
                  setStep("archetype");
                }}
                className="text-xs text-guroh-gold-dark/70 hover:text-guroh-ivory flex items-center justify-center gap-1.5 mx-auto cursor-pointer pt-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-calibrate Diagnostic</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
