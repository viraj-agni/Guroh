"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Flame,
  Layers,
  ArrowRight,
  Compass,
  Trophy,
  Info,
  CircleDot,
  GraduationCap
} from "lucide-react";
import { synth } from "@/components/AudioEngine";
import { getAllLessonProgress, LessonProgressRecord } from "@/lib/indexedDB";
import k1DagData from "../../curriculum-graph/output/k1-dag.verified.json";

// Types matching verified Lean K-1 DAG schema
export interface VerifiedDAGNode {
  id: string;
  domain: string;
  statement: string;
  title_one_line: string;
  description_paragraph: string;
  kc_types: string[];
  stage_hint: {
    shu: number;
    ha: number;
    ri: number;
  };
  color: string;
  x: number;
  y: number;
}

export interface VerifiedDAGEdge {
  from: string;
  to: string;
  kind: string;
  lean_module: string;
  theorem: string;
}

export type PedagogicalStage = "stage1" | "stage2" | "stage3";
export type NodeStatus = "locked" | "available" | "in_progress" | "mastered";

export interface EnrichedDAGNode extends VerifiedDAGNode {
  stage: PedagogicalStage;
  stageLabel: string;
  prerequisites: string[];
  status: NodeStatus;
  progressRecord?: LessonProgressRecord;
}

interface CurriculumExplorerProps {
  onNodeSelect?: (node: EnrichedDAGNode) => void;
  onRequestAuth?: (reason: string) => void;
  onOpenParentPortal?: () => void;
  className?: string;
}

export default function CurriculumExplorer({
  onNodeSelect,
  onRequestAuth,
  onOpenParentPortal,
  className = "",
}: CurriculumExplorerProps) {
  const router = useRouter();

  const [progressMap, setProgressMap] = useState<Map<string, LessonProgressRecord>>(new Map());
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [activeStageFilter, setActiveStageFilter] = useState<PedagogicalStage | "ALL">("ALL");
  const [hoveredNode, setHoveredNode] = useState<EnrichedDAGNode | null>(null);
  const [inspectNode, setInspectNode] = useState<EnrichedDAGNode | null>(null);

  // 1. Load learner's local lesson progress from IndexedDB
  const refreshProgress = async () => {
    try {
      const records = await getAllLessonProgress();
      const map = new Map<string, LessonProgressRecord>();
      records.forEach((rec) => {
        map.set(rec.nodeId, rec);
      });
      // Also inspect localStorage tokens for instant reactive feedback
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("vidya_progress_")) {
            const nodeId = key.replace("vidya_progress_", "");
            if (!map.has(nodeId)) {
              map.set(nodeId, {
                nodeId,
                stage: 3,
                completed: true,
                score: 100,
                updatedAt: Date.now(),
                synced: false,
              });
            }
          }
        }
      }
      setProgressMap(map);
    } catch (err) {
      console.warn("Failed to retrieve lesson progress for curriculum explorer:", err);
    }
  };

  useEffect(() => {
    refreshProgress();
    const handleStorage = () => refreshProgress();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // 2. Compute Prerequisites Map & Flywheel Stages for all 24 K-1 nodes
  const nodes = useMemo<EnrichedDAGNode[]>(() => {
    const rawNodes: VerifiedDAGNode[] = (k1DagData as { nodes: VerifiedDAGNode[]; edges: VerifiedDAGEdge[] }).nodes;
    const rawEdges: VerifiedDAGEdge[] = (k1DagData as { nodes: VerifiedDAGNode[]; edges: VerifiedDAGEdge[] }).edges;

    // Build incoming prerequisite map: to -> [from]
    const prereqMap = new Map<string, string[]>();
    rawEdges.forEach((edge) => {
      const current = prereqMap.get(edge.to) || [];
      current.push(edge.from);
      prereqMap.set(edge.to, current);
    });

    return rawNodes.map((node) => {
      // Pedagogical Flywheel Assignment based on CCSS progression & Shu-Ha-Ri hints:
      // Stage 1: Intuition (Foundational concrete representation, Shu = 1.0 or entry nodes)
      // Stage 2: Experimentation (Interactive manipulatives & cardinality links, Ha > 0.0)
      // Stage 3: Mastery (Fluency challenges, comparisons, and multi-element sets)
      let stage: PedagogicalStage = "stage1";
      let stageLabel = "Stage 1: Intuition";

      if (node.id === "K.CC.1" || node.id === "K.CC.2" || node.id === "K.CC.3") {
        stage = "stage1";
        stageLabel = "Stage 1: Intuition";
      } else if (node.id === "K.CC.4a" || node.id === "K.CC.4b" || node.id === "K.CC.4c") {
        stage = "stage2";
        stageLabel = "Stage 2: Experimentation";
      } else {
        stage = "stage3";
        stageLabel = "Stage 3: Mastery";
      }

      const prereqs = prereqMap.get(node.id) || [];
      const record = progressMap.get(node.id);

      // Determine Node Status dynamically:
      let status: NodeStatus = "locked";

      if (record && record.completed) {
        status = "mastered";
      } else if (record && !record.completed) {
        status = "in_progress";
      } else {
        // Node is Available if it has no prerequisites OR all prerequisites are completed
        const allPrereqsMet =
          prereqs.length === 0 ||
          prereqs.every((pId) => {
            const pRec = progressMap.get(pId);
            return pRec && pRec.completed;
          });

        if (allPrereqsMet) {
          status = "available";
        } else {
          status = "locked";
        }
      }

      return {
        ...node,
        stage,
        stageLabel,
        prerequisites: prereqs,
        status,
        progressRecord: record,
      };
    });
  }, [progressMap]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchDomain = selectedDomain === "ALL" || n.domain === selectedDomain;
      const matchStage = activeStageFilter === "ALL" || n.stage === activeStageFilter;
      return matchDomain && matchStage;
    });
  }, [nodes, selectedDomain, activeStageFilter]);

  // Pedagogical Stages summary stats
  const stageStats = useMemo(() => {
    const s1 = nodes.filter((n) => n.stage === "stage1");
    const s2 = nodes.filter((n) => n.stage === "stage2");
    const s3 = nodes.filter((n) => n.stage === "stage3");

    return {
      stage1: {
        total: s1.length,
        mastered: s1.filter((n) => n.status === "mastered").length,
        unlocked: s1.filter((n) => n.status !== "locked").length,
      },
      stage2: {
        total: s2.length,
        mastered: s2.filter((n) => n.status === "mastered").length,
        unlocked: s2.filter((n) => n.status !== "locked").length,
      },
      stage3: {
        total: s3.length,
        mastered: s3.filter((n) => n.status === "mastered").length,
        unlocked: s3.filter((n) => n.status !== "locked").length,
      },
    };
  }, [nodes]);

  // Overall master completion
  const totalMastered = useMemo(() => {
    return nodes.filter((n) => n.status === "mastered").length;
  }, [nodes]);

  // Node launch handler adhering to PWA early learner ergonomics
  const handleNodeLaunch = (node: EnrichedDAGNode) => {
    synth.playClick();

    if (node.status === "locked") {
      synth.playThud();
      setInspectNode(node);
      return;
    }

    if (onNodeSelect) {
      onNodeSelect(node);
      return;
    }

    // Direct routing to dynamic sandbox / player
    router.push(`/play/${node.id}`);
  };

  // Node styles based on visual specifications:
  // - Locked: subtle slate border (#D7D5DA / #94A3B8), lock icon
  // - Available: Gold #A37134 accent & border #D9A066
  // - In Progress: Oxblood #8D1516 highlight & pulsing badge
  // - Mastered: Emerald #10B981 & checkmark
  const getNodeVisualStyles = (status: NodeStatus) => {
    switch (status) {
      case "mastered":
        return {
          cardBg: "bg-emerald-50/90 hover:bg-emerald-100/90",
          border: "border-emerald-500 shadow-sm shadow-emerald-500/10",
          badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
          iconColor: "text-emerald-600",
          ringColor: "ring-emerald-400",
          label: "Mastered",
        };
      case "in_progress":
        return {
          cardBg: "bg-[#8D1516]/5 hover:bg-[#8D1516]/10",
          border: "border-[#8D1516] shadow-md shadow-[#8D1516]/10",
          badgeBg: "bg-[#8D1516] text-[#F9F1EC] border-[#8D1516]",
          iconColor: "text-[#8D1516]",
          ringColor: "ring-[#8D1516]",
          label: "In Progress",
        };
      case "available":
        return {
          cardBg: "bg-amber-50/80 hover:bg-amber-100/80",
          border: "border-[#A37134] shadow-sm shadow-[#A37134]/15",
          badgeBg: "bg-[#A37134]/15 text-[#A37134] border-[#A37134]/30",
          iconColor: "text-[#A37134]",
          ringColor: "ring-[#A37134]",
          label: "Available",
        };
      case "locked":
      default:
        return {
          cardBg: "bg-slate-50/60 opacity-80 hover:opacity-95",
          border: "border-[#D7D5DA] border-dashed",
          badgeBg: "bg-slate-200/60 text-[#94A3B8] border-slate-300",
          iconColor: "text-[#94A3B8]",
          ringColor: "ring-slate-300",
          label: "Locked",
        };
    }
  };

  return (
    <div className={`w-full flex flex-col space-y-8 ${className}`}>
      {/* 1. Header Banner & Roadmap Mission Control */}
      <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8D1516]/10 text-[#8D1516] text-xs font-bold rounded-full font-mono">
              <Compass className="w-3.5 h-3.5" />
              <span>SPATIAL CURRICULUM DAG EXPLORER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#180608] tracking-tight">
              Early Foundations (K-1 Roadmap)
            </h2>
            <p className="text-sm text-[#5C5552] max-w-2xl leading-relaxed">
              Formally verified Lean 4 dependency path. Complete foundational intuition to unlock experimental manipulatives and mathematical fluency.
            </p>
          </div>

          {/* Quick Mastery Trophy Pill */}
          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <div className="flex items-center gap-4 bg-[#FDFBF7] p-3.5 rounded-xl border border-black/5">
              <div className="w-12 h-12 rounded-xl bg-[#8D1516] text-[#F9F1EC] flex items-center justify-center font-bold shadow-sm">
                <Trophy className="w-6 h-6 text-[#D9A066]" />
              </div>
              <div>
                <div className="text-xs text-[#5C5552] font-medium">Curriculum Mastery</div>
                <div className="text-lg font-extrabold text-[#180608]">
                  {totalMastered} / {nodes.length}{" "}
                  <span className="text-xs font-semibold text-emerald-600 ml-1">
                    ({Math.round((totalMastered / nodes.length) * 100)}%)
                  </span>
                </div>
              </div>
            </div>

            {onOpenParentPortal && (
              <button
                onClick={() => {
                  synth.playClick();
                  onOpenParentPortal();
                }}
                className="min-h-[48px] px-3.5 py-2.5 rounded-xl border border-black/10 bg-white hover:bg-black/[0.02] text-xs font-mono font-bold text-guroh-ink shadow-sm flex items-center gap-2 cursor-pointer"
                title="View Parent Portal & Progress Analytics"
              >
                <GraduationCap className="w-4 h-4 text-[#8D1516]" />
                <span>Parent Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Flywheel Stages Tracker Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-black/5">
          {/* Stage 1 */}
          <button
            onClick={() => {
              synth.playClick();
              setActiveStageFilter(activeStageFilter === "stage1" ? "ALL" : "stage1");
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-h-[48px] flex flex-col justify-between ${
              activeStageFilter === "stage1"
                ? "bg-[#8D1516]/5 border-[#8D1516] ring-2 ring-[#8D1516]/20"
                : "bg-[#FDFBF7] border-black/5 hover:border-black/15"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8D1516] uppercase tracking-wider font-mono">
                Stage 1: Intuition
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#180608] border border-black/10">
                {stageStats.stage1.mastered}/{stageStats.stage1.total}
              </span>
            </div>
            <p className="text-xs text-[#5C5552] mt-1 line-clamp-1">
              Sensory scaffolding & mental models (Counting 1-20).
            </p>
          </button>

          {/* Stage 2 */}
          <button
            onClick={() => {
              synth.playClick();
              setActiveStageFilter(activeStageFilter === "stage2" ? "ALL" : "stage2");
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-h-[48px] flex flex-col justify-between ${
              activeStageFilter === "stage2"
                ? "bg-[#A37134]/10 border-[#A37134] ring-2 ring-[#A37134]/20"
                : "bg-[#FDFBF7] border-black/5 hover:border-black/15"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A37134] uppercase tracking-wider font-mono">
                Stage 2: Experimentation
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#180608] border border-black/10">
                {stageStats.stage2.mastered}/{stageStats.stage2.total}
              </span>
            </div>
            <p className="text-xs text-[#5C5552] mt-1 line-clamp-1">
              Active manipulatives, cardinality & 1-to-1 pairings.
            </p>
          </button>

          {/* Stage 3 */}
          <button
            onClick={() => {
              synth.playClick();
              setActiveStageFilter(activeStageFilter === "stage3" ? "ALL" : "stage3");
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-h-[48px] flex flex-col justify-between ${
              activeStageFilter === "stage3"
                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                : "bg-[#FDFBF7] border-black/5 hover:border-black/15"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono">
                Stage 3: Mastery
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#180608] border border-black/10">
                {stageStats.stage3.mastered}/{stageStats.stage3.total}
              </span>
            </div>
            <p className="text-xs text-[#5C5552] mt-1 line-clamp-1">
              Fluency challenges, comparisons & symbolic bridges.
            </p>
          </button>
        </div>
      </div>

      {/* 3. Stage & Domain Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-white border border-black/10 rounded-xl">
          <button
            onClick={() => {
              synth.playClick();
              setActiveStageFilter("ALL");
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
              activeStageFilter === "ALL"
                ? "bg-[#8D1516] text-[#F9F1EC] shadow-sm"
                : "text-[#5C5552] hover:text-[#180608]"
            }`}
          >
            All Stages ({nodes.length})
          </button>
          <button
            onClick={() => {
              synth.playClick();
              setActiveStageFilter("stage1");
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
              activeStageFilter === "stage1"
                ? "bg-[#8D1516] text-[#F9F1EC] shadow-sm"
                : "text-[#5C5552] hover:text-[#180608]"
            }`}
          >
            1. Intuition
          </button>
          <button
            onClick={() => {
              synth.playClick();
              setActiveStageFilter("stage2");
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
              activeStageFilter === "stage2"
                ? "bg-[#A37134] text-white shadow-sm"
                : "text-[#5C5552] hover:text-[#180608]"
            }`}
          >
            2. Experimentation
          </button>
          <button
            onClick={() => {
              synth.playClick();
              setActiveStageFilter("stage3");
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
              activeStageFilter === "stage3"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[#5C5552] hover:text-[#180608]"
            }`}
          >
            3. Mastery
          </button>
        </div>

        {/* Legend pills */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-medium text-[#5C5552]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            Mastered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#8D1516]" />
            In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#A37134]" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            Locked
          </span>
        </div>
      </div>

      {/* 4. Spatial Learning Path Cluster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNodes.map((node, index) => {
          const styles = getNodeVisualStyles(node.status);
          const isInteractive = node.status !== "locked";

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between min-h-[220px] ${
                styles.border
              } ${styles.cardBg} ${
                isInteractive ? "hover:scale-[1.01] hover:shadow-lg" : "cursor-not-allowed"
              }`}
            >
              {/* Top metadata row */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold font-mono text-[#180608] px-2.5 py-1 bg-white rounded-lg border border-black/10">
                      {node.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider font-mono ${styles.badgeBg}`}
                    >
                      {styles.label}
                    </span>
                  </div>

                  {/* Status Indicator Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      node.status === "mastered"
                        ? "bg-emerald-100 text-emerald-600"
                        : node.status === "in_progress"
                        ? "bg-[#8D1516]/10 text-[#8D1516] animate-pulse"
                        : node.status === "available"
                        ? "bg-amber-100 text-[#A37134]"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {node.status === "mastered" ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                    ) : node.status === "in_progress" ? (
                      <Flame className="w-4 h-4" />
                    ) : node.status === "available" ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Node Title & Stage Tag */}
                <h3 className="text-base font-bold text-[#180608] line-clamp-1 tracking-tight">
                  {node.title_one_line}
                </h3>

                <p className="text-xs text-[#5C5552] mt-1.5 line-clamp-3 leading-relaxed">
                  {node.statement}
                </p>
              </div>

              {/* Bottom interactive action button */}
              <div className="pt-4 mt-3 border-t border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#5C5552]">
                  <CircleDot className="w-3 h-3 text-[#A37134]" />
                  <span>{node.stageLabel.replace("Stage ", "S")}</span>
                </div>

                <button
                  onClick={() => handleNodeLaunch(node)}
                  className={`min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[120px] ${
                    node.status === "mastered"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      : node.status === "in_progress"
                      ? "bg-[#8D1516] hover:bg-[#701011] text-[#F9F1EC] shadow-md shadow-[#8D1516]/20"
                      : node.status === "available"
                      ? "bg-[#A37134] hover:bg-[#865d2a] text-white shadow-sm"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-600"
                  }`}
                  aria-label={`${styles.label} ${node.title_one_line}`}
                >
                  {node.status === "mastered" ? (
                    <>
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : node.status === "in_progress" ? (
                    <>
                      <span>Resume</span>
                      <Flame className="w-3.5 h-3.5 fill-current" />
                    </>
                  ) : node.status === "available" ? (
                    <>
                      <span>Start Lab</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-0.5" />
                      <span>Locked</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 5. Prerequisite Inspection Drawer / Modal */}
      <AnimatePresence>
        {inspectNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-black/10 p-6 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-[#180608]">
                    Prerequisites Required
                  </h4>
                  <span className="text-xs text-[#5C5552] font-mono">
                    Module {inspectNode.id}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#5C5552] mb-4 leading-relaxed">
                Before unlocking <strong className="text-[#180608]">{inspectNode.title_one_line}</strong>, you must master the preceding knowledge components:
              </p>

              <div className="space-y-2 mb-6">
                {inspectNode.prerequisites.map((pId) => {
                  const pRec = progressMap.get(pId);
                  const isDone = pRec && pRec.completed;

                  return (
                    <div
                      key={pId}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                        isDone
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-amber-50/60 border-amber-300 text-[#180608]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <CircleDot className="w-4 h-4 text-[#A37134]" />
                        )}
                        <span className="font-bold">{pId}</span>
                      </div>
                      <span className="text-[11px] font-semibold">
                        {isDone ? "Completed" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    synth.playClick();
                    setInspectNode(null);
                  }}
                  className="px-5 py-2.5 bg-[#8D1516] text-[#F9F1EC] rounded-xl text-xs font-bold min-h-[48px] cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
