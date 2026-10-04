"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Tablet, Monitor, RefreshCw } from "lucide-react";

export type BreakpointTier = "compact" | "medium" | "expanded";

export interface AdaptiveVidyaContainerProps {
  children: (props: { breakpoint: BreakpointTier; width: number }) => React.ReactNode;
  className?: string;
}

export function AdaptiveVidyaContainer({ children, className = "" }: AdaptiveVidyaContainerProps) {
  const [overrideWidth, setOverrideWidth] = useState<number | null>(null);
  const [actualWidth, setActualWidth] = useState<number>(1000);

  useEffect(() => {
    const handleResize = () => {
      setActualWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeWidth = overrideWidth !== null ? overrideWidth : actualWidth;

  const getBreakpoint = (width: number): BreakpointTier => {
    if (width < 600) return "compact";
    if (width < 840) return "medium";
    return "expanded";
  };

  const breakpoint = getBreakpoint(activeWidth);

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Breakpoint Simulation Toolbar */}
      <div className="w-full bg-slate-800 border border-slate-700 p-3 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-2 text-slate-300 text-sm font-semibold">
          <span>Viewport Simulator:</span>
          <span className="bg-purple-900/60 text-purple-300 px-2.5 py-0.5 rounded-md border border-purple-500/30 text-xs uppercase font-mono">
            {breakpoint} ({activeWidth}px)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setOverrideWidth(375)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
              overrideWidth === 375
                ? "bg-purple-600 text-white shadow-md"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Compact (375px)</span>
          </button>

          <button
            onClick={() => setOverrideWidth(680)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
              overrideWidth === 680
                ? "bg-purple-600 text-white shadow-md"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Medium Fold (680px)</span>
          </button>

          <button
            onClick={() => setOverrideWidth(1200)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
              overrideWidth === 1200
                ? "bg-purple-600 text-white shadow-md"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Expanded (1200px)</span>
          </button>

          {overrideWidth !== null && (
            <button
              onClick={() => setOverrideWidth(null)}
              className="p-1.5 rounded-xl bg-slate-700 text-slate-400 hover:text-white transition"
              title="Reset to Actual Viewport"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Responsive Viewport Frame Wrap */}
      <div
        className="transition-all duration-300 ease-in-out w-full flex justify-center overflow-x-auto"
        style={{
          maxWidth: overrideWidth !== null ? `${overrideWidth}px` : "100%",
        }}
      >
        {children({ breakpoint, width: activeWidth })}
      </div>
    </div>
  );
}
