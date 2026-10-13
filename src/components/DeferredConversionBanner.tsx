"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shield, ArrowRight, X, Flame, Users } from "lucide-react";
import { synth } from "./AudioEngine";
import { getAllLessonProgress, getGuestProfile, getOrCreateGuestId } from "@/lib/indexedDB";

interface DeferredConversionBannerProps {
  onClaimProfile: () => void;
  className?: string;
}

export default function DeferredConversionBanner({
  onClaimProfile,
  className = "",
}: DeferredConversionBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [learnerName, setLearnerName] = useState<string>("");
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in current session
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("guroh_conversion_banner_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
        return;
      }

      // Check if user is already authenticated
      const isAuthed = localStorage.getItem("vidya_authenticated") === "true";
      if (isAuthed) {
        setIsVisible(false);
        return;
      }
    }

    const checkMilestones = async () => {
      try {
        const guestId = getOrCreateGuestId();
        const profile = await getGuestProfile(guestId);
        const progressList = await getAllLessonProgress();
        const completed = progressList.filter((p) => p.completed).length;

        setCompletedCount(completed);
        if (profile?.learnerName) {
          setLearnerName(profile.learnerName);
        }

        // Trigger banner if diagnostic completed or at least 1 milestone completed
        if (profile?.diagnosticCompleted || completed > 0) {
          setIsVisible(true);
        }
      } catch (err) {
        console.warn("Failed to inspect progress for deferred conversion banner:", err);
      }
    };

    checkMilestones();
  }, []);

  const handleDismiss = () => {
    synth.playClick();
    setIsVisible(false);
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("guroh_conversion_banner_dismissed", "true");
    }
  };

  const handleClaim = () => {
    synth.playClick();
    onClaimProfile();
  };

  if (!isVisible || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`w-full bg-[#8D1516] text-[#F9F1EC] border-b border-white/15 px-4 py-3 shadow-lg relative z-30 ${className}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left info badge */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Sparkles className="w-4 h-4 text-[#D9A066]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                <span>{learnerName ? `${learnerName}'s Progress` : "Guest Scholar Progress"} Stored Locally</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#D9A066] text-[#180608] font-mono text-[10px] font-bold">
                  {completedCount} {completedCount === 1 ? "Milestone" : "Milestones"}
                </span>
              </span>
              <span className="text-[#F9F1EC]/80 text-[11px]">
                Your vector intuition & mastery are stored on this device. Create an account to sync across devices & invite a guardian.
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={handleClaim}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#D9A066] hover:bg-[#B57C38] text-[#180608] font-bold rounded-xl shadow-md transition-all cursor-pointer min-h-[48px] text-xs font-mono"
            >
              <span>Save Progress</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}