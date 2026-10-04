"use client";

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";

export interface SVGStrokeItem {
  id: string;
  pathD: string;
  strokeColor: string;
  strokeWidth: number;
  startTimeSec: number;
  durationSec: number;
}

export interface DrawingConceptPayload {
  conceptId: string;
  title: string;
  mode: "svg_stroke" | "video_stream";
  audioUrl?: string | null;
  aspectRatio?: string; // default "16:9"
  svgStrokes?: SVGStrokeItem[];
  videoStreamUrl?: string | null;
}

export interface DualModeIntuitionPlayerProps {
  payload: DrawingConceptPayload;
  onConceptComplete?: () => void;
  className?: string;
}

export interface DualModeIntuitionPlayerRef {
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export const DualModeIntuitionPlayer = forwardRef<DualModeIntuitionPlayerRef, DualModeIntuitionPlayerProps>(
  ({ payload, onConceptComplete, className = "" }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
    const pathLengths = useRef<Map<string, number>>(new Map());

    const isSvgMode = payload.mode === "svg_stroke";

    // Expose control methods to parent via ref
    useImperativeHandle(ref, () => ({
      play: () => handlePlay(),
      pause: () => handlePause(),
      reset: () => handleReset(),
    }));

    // Pre-calculate path lengths for SVG mode
    useEffect(() => {
      if (isSvgMode && payload.svgStrokes) {
        pathRefs.current.forEach((pathEl, id) => {
          if (pathEl) {
            try {
              const len = pathEl.getTotalLength();
              pathLengths.current.set(id, len);
            } catch {
              pathLengths.current.set(id, 1000);
            }
          }
        });
      }
    }, [isSvgMode, payload.svgStrokes]);

    // Animation frame loop for SVG mode synced with audio currentTime
    useEffect(() => {
      if (!isSvgMode || !isPlaying) {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        return;
      }

      const updateSync = () => {
        if (audioRef.current) {
          const now = audioRef.current.currentTime;
          setCurrentTime(now);

          // Calculate total duration from strokes or audio duration
          const maxStrokeEndTime = payload.svgStrokes?.reduce(
            (max, stroke) => Math.max(max, stroke.startTimeSec + stroke.durationSec),
            0
          ) || 5;

          if (audioRef.current.ended || now >= maxStrokeEndTime) {
            setIsPlaying(false);
            setIsCompleted(true);
            if (onConceptComplete) onConceptComplete();
            return;
          }
        } else {
          // Fallback timer if audioUrl is absent (synthetic demo mode)
          setCurrentTime((prev) => {
            const next = prev + 0.016;
            const maxStrokeEndTime = payload.svgStrokes?.reduce(
              (max, stroke) => Math.max(max, stroke.startTimeSec + stroke.durationSec),
              0
            ) || 5;
            if (next >= maxStrokeEndTime) {
              setIsPlaying(false);
              setIsCompleted(true);
              if (onConceptComplete) onConceptComplete();
              return maxStrokeEndTime;
            }
            return next;
          });
        }
        animFrameRef.current = requestAnimationFrame(updateSync);
      };

      animFrameRef.current = requestAnimationFrame(updateSync);

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }, [isSvgMode, isPlaying, payload.svgStrokes, onConceptComplete]);

    const handlePlay = () => {
      if (isCompleted) {
        handleReset();
      }
      setIsPlaying(true);
      if (isSvgMode) {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      } else {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (isSvgMode) {
        if (audioRef.current) audioRef.current.pause();
      } else {
        if (videoRef.current) videoRef.current.pause();
      }
    };

    const togglePlayPause = () => {
      if (isPlaying) handlePause();
      else handlePlay();
    };

    const handleReset = () => {
      setIsPlaying(false);
      setIsCompleted(false);
      setCurrentTime(0);
      if (isSvgMode) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } else {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }
    };

    const handleVideoEnded = () => {
      setIsPlaying(false);
      setIsCompleted(true);
      if (onConceptComplete) onConceptComplete();
    };

    return (
      <div className={`flex flex-col items-center w-full max-w-4xl mx-auto p-4 select-none ${className}`}>
        {/* Child-Friendly Stage Progress Header */}
        <div className="w-full flex items-center justify-between mb-4 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
          <div className="flex items-center space-x-2 text-sm font-semibold text-blue-600">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
            <span>Intuition</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-300"></div>
          <div className="flex items-center space-x-2 text-sm font-medium text-slate-400">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs">2</span>
            <span>Lab</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-300"></div>
          <div className="flex items-center space-x-2 text-sm font-medium text-slate-400">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs">3</span>
            <span>Drill</span>
          </div>
        </div>

        {/* Title Header */}
        <h2 className="text-2xl font-bold text-slate-800 mb-3 text-center">{payload.title}</h2>

        {/* 16:9 Canvas Frame (>85% Viewport Focal Area) */}
        <div className="relative w-full aspect-video bg-white rounded-3xl shadow-xl border-4 border-slate-200 overflow-hidden flex items-center justify-center">
          {isSvgMode ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {payload.audioUrl && (
                <audio
                  ref={audioRef}
                  src={payload.audioUrl}
                  onEnded={handleVideoEnded}
                  preload="auto"
                />
              )}
              <svg
                className="w-full h-full p-6"
                viewBox="0 0 400 300"
                preserveAspectRatio="xMidYMid meet"
              >
                {payload.svgStrokes?.map((stroke) => {
                  const strokeLength = pathLengths.current.get(stroke.id) || 1000;
                  
                  // Compute interpolation progress
                  let strokeProgress = 0;
                  if (currentTime >= stroke.startTimeSec + stroke.durationSec) {
                    strokeProgress = 1;
                  } else if (currentTime > stroke.startTimeSec) {
                    strokeProgress = (currentTime - stroke.startTimeSec) / stroke.durationSec;
                  }
                  
                  const dashoffset = strokeLength * (1 - strokeProgress);

                  return (
                    <path
                      key={stroke.id}
                      ref={(el) => {
                        if (el) pathRefs.current.set(stroke.id, el);
                      }}
                      d={stroke.pathD}
                      fill="none"
                      stroke={stroke.strokeColor}
                      strokeWidth={stroke.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={strokeLength}
                      strokeDashoffset={dashoffset}
                      style={{ transition: isPlaying ? "none" : "stroke-dashoffset 0.1s linear" }}
                    />
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {payload.videoStreamUrl ? (
                <video
                  ref={videoRef}
                  src={payload.videoStreamUrl}
                  className="w-full h-full object-cover"
                  onEnded={handleVideoEnded}
                  playsInline
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-300">
                  No video stream URL provided
                </div>
              )}
            </div>
          )}

          {/* Completion Overlay Banner */}
          {isCompleted && (
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 transition-opacity duration-300">
              <CheckCircle2 className="w-20 h-20 text-green-400 animate-bounce" />
              <p className="text-2xl font-bold">Great Job!</p>
              <p className="text-sm opacity-90">Ready to test it in the interactive lab?</p>
            </div>
          )}
        </div>

        {/* Child-First Oversized Touch Controls (Minimum 64x64px, 80px Primary) */}
        <div className="flex items-center justify-center space-x-6 mt-6">
          <button
            onClick={handleReset}
            aria-label="Replay Concept"
            className="w-16 h-16 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center shadow-md active:scale-95 transition"
          >
            <RotateCcw className="w-8 h-8" />
          </button>

          <button
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 fill-current" />
            ) : (
              <Play className="w-10 h-10 fill-current ml-1" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

DualModeIntuitionPlayer.displayName = "DualModeIntuitionPlayer";
