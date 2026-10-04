"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Sparkles, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";

export interface DrillOption {
  id: string;
  label: string;
  shapeType: "circle" | "square" | "triangle" | "star" | "oval" | "ellipse";
  isCorrect: boolean;
  svgPath: string;
  fillColor: string;
}

export interface DrillQuestion {
  questionId: string;
  promptText: string;
  audioPromptUrl?: string | null;
  difficultyLevel: 1 | 2; // Tier 1: Distinct, Tier 2: Perceptual Similarity
  options: DrillOption[];
}

export interface ParametricDrillPayload {
  drillId: string;
  conceptId: string;
  title: string;
  masteryStreakTarget: number; // default 3
  questions: DrillQuestion[];
}

export interface ParametricDrillEngineProps {
  payload: ParametricDrillPayload;
  onDrillMastery?: () => void;
  className?: string;
}

export function ParametricDrillEngine({
  payload,
  onDrillMastery,
  className = "",
}: ParametricDrillEngineProps) {
  // Queue-based state management for within-session Leitner scheduling
  const [questionQueue, setQuestionQueue] = useState<DrillQuestion[]>(payload.questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "incorrect" | null>(null);
  const [isMastered, setIsMastered] = useState(false);

  const currentQuestion = questionQueue[currentIndex] || questionQueue[0];

  // Sound synthesis (<50ms zero-lag Web Audio)
  const playAudioFeedback = (type: "correct" | "incorrect" | "mastery") => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "correct") {
        const now = ctx.currentTime;
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "incorrect") {
        const now = ctx.currentTime;
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "mastery") {
        const now = ctx.currentTime;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
        osc.frequency.setValueAtTime(1046.5, now + 0.36); // C6
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // Ignore Web Audio errors in test or headless environments
    }
  };

  const handleOptionSelect = (option: DrillOption) => {
    if (feedbackState !== null || isMastered) return;

    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      setFeedbackState("correct");
      playAudioFeedback("correct");
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);

      setTimeout(() => {
        if (nextStreak >= payload.masteryStreakTarget) {
          setIsMastered(true);
          playAudioFeedback("mastery");
          if (onDrillMastery) onDrillMastery();
        } else {
          // Advance queue
          setSelectedOptionId(null);
          setFeedbackState(null);
          setCurrentIndex((prev) => (prev + 1) % questionQueue.length);
        }
      }, 700);
    } else {
      // Incorrect answer: reset streak, re-queue missed item after 2-item gap (within-session Leitner scheduling)
      setFeedbackState("incorrect");
      playAudioFeedback("incorrect");
      setStreakCount(0);

      setTimeout(() => {
        setSelectedOptionId(null);
        setFeedbackState(null);

        // Re-insert current question into queue at position currentIndex + 3 (a 2-item gap)
        const newQueue = [...questionQueue];
        const reinsertIndex = Math.min(currentIndex + 3, newQueue.length);
        newQueue.splice(reinsertIndex, 0, currentQuestion);

        setQuestionQueue(newQueue);
        setCurrentIndex((prev) => prev + 1);
      }, 800);
    }
  };

  const playPromptAudio = () => {
    if (currentQuestion.audioPromptUrl) {
      const audio = new Audio(currentQuestion.audioPromptUrl);
      audio.play().catch(() => {});
    }
  };

  const handleReset = () => {
    setQuestionQueue(payload.questions);
    setCurrentIndex(0);
    setStreakCount(0);
    setSelectedOptionId(null);
    setFeedbackState(null);
    setIsMastered(false);
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-4xl mx-auto p-4 select-none ${className}`}>
      {/* Stage Progress Header */}
      <div className="w-full flex items-center justify-between mb-4 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs">1</span>
          <span>Intuition</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-300"></div>
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs">2</span>
          <span>Lab</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-300"></div>
        <div className="flex items-center space-x-2 text-sm font-semibold text-purple-600">
          <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">3</span>
          <span>Drill (Active)</span>
        </div>
      </div>

      {/* Audio Prompt Bar */}
      <div className="w-full flex items-center justify-between bg-purple-50 border border-purple-200 p-4 rounded-2xl mb-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={playPromptAudio}
            className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md active:scale-95 transition"
            aria-label="Play Prompt Audio"
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <span className="text-xl font-bold text-purple-950">{currentQuestion.promptText}</span>
        </div>

        {/* Streak Meter (Mastery Target) */}
        <div className="flex items-center space-x-1 bg-purple-100 px-3 py-1.5 rounded-full border border-purple-300">
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
          <span className="text-sm font-bold text-purple-900">
            Streak: {streakCount} / {payload.masteryStreakTarget}
          </span>
        </div>
      </div>

      {/* Difficulty Level Indicator */}
      <div className="w-full flex items-center justify-end mb-2 px-2">
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
          currentQuestion.difficultyLevel === 1 
            ? "bg-slate-200 text-slate-700" 
            : "bg-amber-100 text-amber-800 border border-amber-300"
        }`}>
          {currentQuestion.difficultyLevel === 1 ? "Tier 1: Distinct Shapes" : "Tier 2: Fine Visual Discrimination"}
        </span>
      </div>

      {/* Visual Options Card Matrix (Minimum 96x96px touch targets for 5yo pre-readers) */}
      <div className="relative w-full min-h-[320px] bg-white rounded-3xl shadow-xl border-4 border-slate-200 p-6 flex items-center justify-center">
        {isMastered ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <ShieldCheck className="w-24 h-24 text-emerald-500 animate-bounce" />
            <h2 className="text-3xl font-black text-slate-800">Concept Mastered!</h2>
            <p className="text-slate-600 max-w-md">
              Congratulations! You demonstrated mastery across all 3 flywheel stages (Intuition → Lab → Drill).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              let optionStyle = "bg-slate-50 border-slate-300 hover:border-purple-400 hover:bg-purple-50/50";

              if (isSelected) {
                if (feedbackState === "correct") {
                  optionStyle = "bg-emerald-100 border-emerald-500 ring-4 ring-emerald-300 scale-105";
                } else if (feedbackState === "incorrect") {
                  optionStyle = "bg-rose-100 border-rose-500 ring-4 ring-rose-300 animate-shake";
                }
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option)}
                  disabled={feedbackState !== null}
                  className={`w-full h-32 rounded-2xl border-4 flex flex-col items-center justify-center shadow-md transition-all touch-none select-none ${optionStyle}`}
                  style={{ minWidth: "96px", minHeight: "96px" }}
                  aria-label={option.label}
                >
                  <svg className="w-16 h-16" viewBox="0 0 100 100">
                    <path d={option.svgPath} fill={option.fillColor} stroke="#1E293B" strokeWidth="4" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Control Footer */}
      <div className="flex items-center justify-center space-x-6 mt-6">
        <button
          onClick={handleReset}
          aria-label="Restart Drill"
          className="w-16 h-16 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center shadow-md active:scale-95 transition"
        >
          <RotateCcw className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
