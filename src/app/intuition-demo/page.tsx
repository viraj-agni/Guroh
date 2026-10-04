"use client";

import React, { useState } from "react";
import { DualModeIntuitionPlayer, DrawingConceptPayload } from "@/components/DualModeIntuitionPlayer";
import { InteractiveLabCanvas, InteractiveLabPayload } from "@/components/InteractiveLabCanvas";
import { ParametricDrillEngine, ParametricDrillPayload } from "@/components/ParametricDrillEngine";
import { AdaptiveVidyaContainer } from "@/components/AdaptiveVidyaContainer";

const sampleSvgPayload: DrawingConceptPayload = {
  conceptId: "spatial-circle-01",
  title: "What is a Circle?",
  mode: "svg_stroke",
  audioUrl: null,
  aspectRatio: "16:9",
  svgStrokes: [
    {
      id: "stroke-1",
      pathD: "M 200 70 A 80 80 0 1 0 200 230 A 80 80 0 1 0 200 70",
      strokeColor: "#2563EB",
      strokeWidth: 8,
      startTimeSec: 0.5,
      durationSec: 2.5,
    },
    {
      id: "stroke-2",
      pathD: "M 200 150 L 280 150",
      strokeColor: "#EF4444",
      strokeWidth: 6,
      startTimeSec: 3.2,
      durationSec: 1.5,
    },
  ],
  videoStreamUrl: null,
};

const sampleVideoPayload: DrawingConceptPayload = {
  conceptId: "spatial-video-01",
  title: "Exploring Shapes in 3D (Video Stream)",
  mode: "video_stream",
  videoStreamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
};

const sampleLabPayload: InteractiveLabPayload = {
  labId: "spatial-circle-lab-01",
  conceptId: "spatial-circle-01",
  instructionText: "Drag 3 dots into the circle!",
  audioInstructionUrl: null,
  draggables: [
    { id: "dot-1", type: "circle-token", initialX: 60, initialY: 340 },
    { id: "dot-2", type: "circle-token", initialX: 160, initialY: 340 },
    { id: "dot-3", type: "circle-token", initialX: 260, initialY: 340 },
  ],
  dropZone: {
    id: "target-circle",
    shape: "circle",
    bounds: { x: 450, y: 180, radius: 100 },
    targetCount: 3,
  },
};

const sampleDrillPayload: ParametricDrillPayload = {
  drillId: "spatial-circle-drill-01",
  conceptId: "spatial-circle-01",
  title: "Circle Identification & Discrimination Drill",
  masteryStreakTarget: 3,
  questions: [
    {
      questionId: "q1",
      promptText: "Touch the circle!",
      difficultyLevel: 1,
      options: [
        {
          id: "opt-1",
          label: "Circle",
          shapeType: "circle",
          isCorrect: true,
          svgPath: "M 50 15 A 35 35 0 1 0 50 85 A 35 35 0 1 0 50 15 Z",
          fillColor: "#3B82F6",
        },
        {
          id: "opt-2",
          label: "Square",
          shapeType: "square",
          isCorrect: false,
          svgPath: "M 15 15 H 85 V 85 H 15 Z",
          fillColor: "#10B981",
        },
        {
          id: "opt-3",
          label: "Triangle",
          shapeType: "triangle",
          isCorrect: false,
          svgPath: "M 50 15 L 85 85 L 15 85 Z",
          fillColor: "#F59E0B",
        },
        {
          id: "opt-4",
          label: "Star",
          shapeType: "star",
          isCorrect: false,
          svgPath: "M 50 10 L 63 38 L 93 38 L 68 56 L 78 86 L 50 68 L 22 86 L 32 56 L 7 38 L 37 38 Z",
          fillColor: "#EC4899",
        },
      ],
    },
    {
      questionId: "q2",
      promptText: "Which one is a true circle?",
      difficultyLevel: 2,
      options: [
        {
          id: "opt-2-1",
          label: "Oval (Stretched)",
          shapeType: "oval",
          isCorrect: false,
          svgPath: "M 50 10 A 25 40 0 1 0 50 90 A 25 40 0 1 0 50 10 Z",
          fillColor: "#8B5CF6",
        },
        {
          id: "opt-2-2",
          label: "Circle (True)",
          shapeType: "circle",
          isCorrect: true,
          svgPath: "M 50 15 A 35 35 0 1 0 50 85 A 35 35 0 1 0 50 15 Z",
          fillColor: "#3B82F6",
        },
        {
          id: "opt-2-3",
          label: "Ellipse (Flat)",
          shapeType: "ellipse",
          isCorrect: false,
          svgPath: "M 50 30 A 40 20 0 1 0 50 70 A 40 20 0 1 0 50 30 Z",
          fillColor: "#6366F1",
        },
        {
          id: "opt-2-4",
          label: "Squircle",
          shapeType: "square",
          isCorrect: false,
          svgPath: "M 25 15 H 75 Q 85 15 85 25 V 75 Q 85 85 75 85 H 25 Q 15 85 15 75 V 25 Q 15 15 25 15 Z",
          fillColor: "#14B8A6",
        },
      ],
    },
  ],
};

export default function MicroSprintDemoPage() {
  const [activeStage, setActiveStage] = useState<"intuition" | "lab" | "drill">("intuition");
  const [activeMode, setActiveMode] = useState<"svg_stroke" | "video_stream">("svg_stroke");
  const [completionMessage, setCompletionMessage] = useState<string>("");

  const payload = activeMode === "svg_stroke" ? sampleSvgPayload : sampleVideoPayload;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl bg-slate-800 p-6 rounded-2xl shadow-2xl mb-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-2">Project Vidya: Micro-Sprint Demo</h1>
        <p className="text-slate-400 text-center mb-6">
          Mobile-First Responsive Layouts (MS 2.1) + Full 3-Stage Flywheel Engine
        </p>

        {/* Viewport Simulator */}
        <AdaptiveVidyaContainer>
          {({ breakpoint }) => (
            <div className="w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
              {/* Stage Selection Tabs */}
              <div className="flex flex-wrap justify-center gap-2 mb-6 w-full">
                <button
                  onClick={() => {
                    setActiveStage("intuition");
                    setCompletionMessage("");
                  }}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                    activeStage === "intuition"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Stage 1: Intuition
                </button>
                <button
                  onClick={() => {
                    setActiveStage("lab");
                    setCompletionMessage("");
                  }}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                    activeStage === "lab"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Stage 2: Interactive Lab
                </button>
                <button
                  onClick={() => {
                    setActiveStage("drill");
                    setCompletionMessage("");
                  }}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                    activeStage === "drill"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Stage 3: Parametric Drill
                </button>
              </div>

              {activeStage === "intuition" && (
                <div className="flex justify-center space-x-3 mb-6">
                  <button
                    onClick={() => {
                      setActiveMode("svg_stroke");
                      setCompletionMessage("");
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeMode === "svg_stroke"
                        ? "bg-blue-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    SVG Vector Stroke
                  </button>
                  <button
                    onClick={() => {
                      setActiveMode("video_stream");
                      setCompletionMessage("");
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeMode === "video_stream"
                        ? "bg-blue-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Video Stream
                  </button>
                </div>
              )}

              {completionMessage && (
                <div className="mb-4 p-4 bg-emerald-900/50 border border-emerald-500 rounded-xl text-emerald-300 text-center font-medium animate-pulse w-full">
                  {completionMessage}
                </div>
              )}

              {/* Layout Reflow based on Breakpoint Tier */}
              <div
                className={`w-full transition-all ${
                  breakpoint === "compact"
                    ? "flex flex-col space-y-4"
                    : breakpoint === "medium"
                    ? "grid grid-cols-1 md:grid-cols-12 gap-4"
                    : "grid grid-cols-12 gap-6"
                }`}
              >
                {activeStage === "intuition" && (
                  <div className="w-full col-span-12">
                    <DualModeIntuitionPlayer
                      key={activeMode}
                      payload={payload}
                      onConceptComplete={() => {
                        setCompletionMessage(
                          `[Event Dispatched] Stage 1 Complete! Auto-advancing to Stage 2.`
                        );
                        setTimeout(() => setActiveStage("lab"), 1500);
                      }}
                    />
                  </div>
                )}

                {activeStage === "lab" && (
                  <div className="w-full col-span-12">
                    <InteractiveLabCanvas
                      payload={sampleLabPayload}
                      onLabSuccess={() => {
                        setCompletionMessage(
                          `[Event Dispatched] Stage 2 Complete! Auto-advancing to Stage 3.`
                        );
                        setTimeout(() => setActiveStage("drill"), 1500);
                      }}
                    />
                  </div>
                )}

                {activeStage === "drill" && (
                  <div className="w-full col-span-12">
                    <ParametricDrillEngine
                      payload={sampleDrillPayload}
                      onDrillMastery={() => {
                        setCompletionMessage(
                          `[Event Dispatched] Stage 3 Complete! Concept fully mastered.`
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </AdaptiveVidyaContainer>
      </div>
    </div>
  );
}
