"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, RotateCcw, Sparkles, CheckCircle2 } from "lucide-react";

export interface DraggableItem {
  id: string;
  type: string;
  initialX: number;
  initialY: number;
}

export interface DropZone {
  id: string;
  shape: "circle" | "rectangle";
  bounds: { x: number; y: number; radius?: number; width?: number; height?: number };
  targetCount: number;
}

export interface InteractiveLabPayload {
  labId: string;
  conceptId: string;
  instructionText: string;
  audioInstructionUrl?: string | null;
  draggables: DraggableItem[];
  dropZone: DropZone;
}

export interface InteractiveLabCanvasProps {
  payload: InteractiveLabPayload;
  onLabSuccess?: () => void;
  className?: string;
}

export function InteractiveLabCanvas({
  payload,
  onLabSuccess,
  className = "",
}: InteractiveLabCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Position state for each draggable: { x, y, isSnapped }
  const [positions, setPositions] = useState<{ [id: string]: { x: number; y: number; isSnapped: boolean } }>(() => {
    const initial: { [id: string]: { x: number; y: number; isSnapped: boolean } } = {};
    payload.draggables.forEach((item) => {
      initial[item.id] = { x: item.initialX, y: item.initialY, isSnapped: false };
    });
    return initial;
  });

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio synth for immediate sound feedback (<50ms)
  const playAudioFeedback = (type: "snap" | "success" | "reset") => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "snap") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "success") {
        const now = ctx.currentTime;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "reset") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Ignore Web Audio errors in headless environments
    }
  };

  // Reset/Resetting Idle Timer on interaction
  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 8000); // 8 seconds AC4 guidance prompt
  };

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Pointer down (Touch/Mouse) handler
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    if (isSuccess) return;
    resetIdleTimer();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pos = positions[id];
    setActiveDragId(id);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  // Pointer move handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragId || !containerRef.current) return;
    resetIdleTimer();

    const rect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep target within canvas bounds
    const clampedX = Math.max(36, Math.min(rect.width - 36, newX));
    const clampedY = Math.max(36, Math.min(rect.height - 36, newY));

    setPositions((prev) => ({
      ...prev,
      [activeDragId]: {
        ...prev[activeDragId],
        x: clampedX,
        y: clampedY,
      },
    }));
  };

  // Pointer up handler (Drop & Evaluation)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!activeDragId) return;
    resetIdleTimer();

    const currentId = activeDragId;
    setActiveDragId(null);

    const pos = positions[currentId];
    const dropZone = payload.dropZone;

    // Check distance to target circle drop zone
    let isInside = false;
    if (dropZone.shape === "circle" && dropZone.bounds.radius) {
      const dx = pos.x - dropZone.bounds.x;
      const dy = pos.y - dropZone.bounds.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= dropZone.bounds.radius + 20) {
        // Drop within snap radius!
        isInside = true;
      }
    }

    const updatedPositions = {
      ...positions,
      [currentId]: {
        ...pos,
        isSnapped: isInside,
      },
    };

    setPositions(updatedPositions);

    if (isInside) {
      playAudioFeedback("snap");
    }

    // Evaluate success condition (AC3)
    const snappedCount = Object.values(updatedPositions).filter((p) => p.isSnapped).length;
    if (snappedCount >= dropZone.targetCount) {
      setIsSuccess(true);
      playAudioFeedback("success");
      if (onLabSuccess) onLabSuccess();
    }
  };

  const handleReset = () => {
    resetIdleTimer();
    const resetPositions: { [id: string]: { x: number; y: number; isSnapped: boolean } } = {};
    payload.draggables.forEach((item) => {
      resetPositions[item.id] = { x: item.initialX, y: item.initialY, isSnapped: false };
    });
    setPositions(resetPositions);
    setIsSuccess(false);
    playAudioFeedback("reset");
  };

  const playInstructionAudio = () => {
    if (payload.audioInstructionUrl) {
      const audio = new Audio(payload.audioInstructionUrl);
      audio.play().catch(() => {});
    }
  };

  const snappedCount = Object.values(positions).filter((p) => p.isSnapped).length;

  return (
    <div className={`flex flex-col items-center w-full max-w-4xl mx-auto p-4 select-none ${className}`}>
      {/* Stage Progress Header */}
      <div className="w-full flex items-center justify-between mb-4 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs">1</span>
          <span>Intuition</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-300"></div>
        <div className="flex items-center space-x-2 text-sm font-semibold text-blue-600">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
          <span>Lab (Active)</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-300"></div>
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs">3</span>
          <span>Drill</span>
        </div>
      </div>

      {/* Audio Instruction Bar */}
      <div className="w-full flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={playInstructionAudio}
            className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md active:scale-95 transition"
            aria-label="Play Instruction Audio"
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <span className="text-xl font-bold text-blue-900">{payload.instructionText}</span>
        </div>
        <div className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
          {snappedCount} / {payload.dropZone.targetCount} Dropped
        </div>
      </div>

      {/* 16:9 Interactive Canvas */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full aspect-video bg-white rounded-3xl shadow-xl border-4 border-slate-200 overflow-hidden touch-none"
      >
        {/* Drop Zone Visual Target */}
        {payload.dropZone.shape === "circle" && (
          <div
            className={`absolute rounded-full border-4 border-dashed flex items-center justify-center transition-all duration-300 ${
              isSuccess
                ? "border-green-500 bg-green-50/50 shadow-lg scale-105"
                : "border-blue-400 bg-blue-50/30"
            }`}
            style={{
              width: `${(payload.dropZone.bounds.radius || 120) * 2}px`,
              height: `${(payload.dropZone.bounds.radius || 120) * 2}px`,
              left: `${payload.dropZone.bounds.x - (payload.dropZone.bounds.radius || 120)}px`,
              top: `${payload.dropZone.bounds.y - (payload.dropZone.bounds.radius || 120)}px`,
            }}
          >
            <span className="text-blue-400 font-bold text-lg pointer-events-none opacity-60">
              Target Drop Zone
            </span>
          </div>
        )}

        {/* Draggable Tokens (AC1: minimum 72x72px touch targets) */}
        {payload.draggables.map((item) => {
          const pos = positions[item.id];
          const isDragging = activeDragId === item.id;

          return (
            <div
              key={item.id}
              onPointerDown={(e) => handlePointerDown(item.id, e)}
              className={`absolute cursor-grab active:cursor-grabbing w-18 h-18 rounded-full flex items-center justify-center shadow-lg transition-transform touch-none select-none ${
                pos.isSnapped
                  ? "bg-emerald-500 text-white ring-4 ring-emerald-300 scale-105"
                  : isDragging
                  ? "bg-blue-600 text-white scale-125 z-50 ring-4 ring-blue-300"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              } ${isIdle && !pos.isSnapped ? "animate-bounce" : ""}`}
              style={{
                width: "72px",
                height: "72px",
                left: `${pos.x - 36}px`,
                top: `${pos.y - 36}px`,
                transform: isDragging ? "scale(1.2)" : "scale(1)",
                transition: isDragging ? "none" : "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
            >
              <span className="font-extrabold text-xl pointer-events-none">●</span>
            </div>
          );
        })}

        {/* Success Overlay Banner */}
        {isSuccess && (
          <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 animate-fade-in">
            <CheckCircle2 className="w-20 h-20 text-green-400 animate-bounce" />
            <p className="text-3xl font-extrabold">Lab Complete!</p>
            <p className="text-base text-emerald-100">Awesome job! You mastered this concept.</p>
          </div>
        )}
      </div>

      {/* Control Footer */}
      <div className="flex items-center justify-center space-x-6 mt-6">
        <button
          onClick={handleReset}
          aria-label="Try Again / Reset"
          className="w-16 h-16 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center shadow-md active:scale-95 transition"
        >
          <RotateCcw className="w-8 h-8" />
        </button>

        <button
          disabled={!isSuccess}
          className={`px-8 py-4 rounded-full font-bold text-lg flex items-center space-x-2 shadow-lg transition-all ${
            isSuccess
              ? "bg-emerald-500 hover:bg-emerald-600 text-white ring-4 ring-emerald-300 animate-pulse cursor-pointer"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          }`}
        >
          <Sparkles className="w-6 h-6" />
          <span>Stage 3: Parametric Drill</span>
        </button>
      </div>
    </div>
  );
}
