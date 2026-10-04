"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Compass, Zap, Award, RotateCcw, Sparkles, Layers, Activity } from "lucide-react";
import { synth } from "./AudioEngine";
import confetti from "canvas-confetti";

interface TriangleSumSandboxProps {
  onSequenceComplete: () => void;
  creatorMode: boolean;
  theme?: "dark" | "light";
}

interface Vertex {
  x: number;
  y: number;
}

// Highly legible rounded badge renderer for angles inside the canvas
const drawAngleBadge = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  isLight: boolean,
  borderColor = "rgba(255, 176, 32, 0.5)"
) => {
  ctx.save();
  ctx.font = "bold 11px IBM Plex Mono, monospace";
  const textWidth = ctx.measureText(text).width;
  const paddingX = 8;
  const paddingY = 4;
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = 14 + paddingY * 2;

  // Background card styling
  ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 10, 10, 0.85)";
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;

  // Draw capsule
  const rx = x - badgeWidth / 2;
  const ry = y - badgeHeight / 2;
  const radius = 6;

  ctx.beginPath();
  ctx.moveTo(rx + radius, ry);
  ctx.lineTo(rx + badgeWidth - radius, ry);
  ctx.quadraticCurveTo(rx + badgeWidth, ry, rx + badgeWidth, ry + radius);
  ctx.lineTo(rx + badgeWidth, ry + badgeHeight - radius);
  ctx.quadraticCurveTo(rx + badgeWidth, ry + badgeHeight, rx + badgeWidth - radius, ry + badgeHeight);
  ctx.lineTo(rx + radius, ry + badgeHeight);
  ctx.quadraticCurveTo(rx, ry + badgeHeight, rx, ry + badgeHeight - radius);
  ctx.lineTo(rx, ry + radius);
  ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw text
  ctx.fillStyle = isLight ? "#111827" : "#F5F0E8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
};

export default function TriangleSumSandbox({
  onSequenceComplete,
  creatorMode,
  theme = "dark",
}: TriangleSumSandboxProps) {
  const [stage, setStage] = useState<"shu" | "ha" | "ri">("shu");

  // Draggable triangle vertices for Stage 1
  const [vertices, setVertices] = useState<{ A: Vertex; B: Vertex; C: Vertex }>({
    A: { x: 300, y: 70 },
    B: { x: 160, y: 250 },
    C: { x: 440, y: 250 },
  });

  const [activeHighlight, setActiveHighlight] = useState<"none" | "A" | "B" | "C">("none");

  // Folding/origami animation state
  const [foldingProgress, setFoldingProgress] = useState<number>(0); // 0 (unfolded) to 1 (folded)
  const isFoldingRef = useRef<boolean>(false);

  // Stage 2 adjacent double-triangle state
  const [s2Step, setS2Step] = useState<"A" | "B" | "C">("A");
  const [s2InputB, setS2InputB] = useState<string>(""); // input for final Angle E in Step B
  const [s2InputC_D, setS2InputC_D] = useState<string>(""); // input for shared adjacent angle in Step C
  const [s2InputC_E, setS2InputC_E] = useState<string>(""); // input for target remote angle in Step C
  const [s2Status, setS2Status] = useState<"idle" | "correct" | "incorrect">("idle");
  const [s2Feedback, setS2Feedback] = useState<string>("");

  // Stage 3 Capstone Arch Bridge joint state
  const [s3TargetAngle] = useState<number>(65); // target balancing angle C
  const [s3IsSecured, setS3IsSecured] = useState<boolean>(false);
  const [s3Feedback, setS3Feedback] = useState<string>("");
  const [s3Status, setS3Status] = useState<"idle" | "correct" | "incorrect">("idle");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<"none" | "A" | "B" | "C">("none");

  // Helper to save KC mastery state
  const saveKCMastery = (kcCode: string) => {
    try {
      localStorage.setItem(`Vidyā.KC_Mastery.${kcCode}`, "true");
    } catch (e) {
      console.warn("Storage write failed: ", e);
    }
  };

  // Math helper functions
  const getDistance = (p1: Vertex, p2: Vertex) => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  };

  const getAngles = () => {
    const { A, B, C } = vertices;
    const lenAB = getDistance(A, B);
    const lenBC = getDistance(B, C);
    const lenCA = getDistance(C, A);

    if (lenAB === 0 || lenBC === 0 || lenCA === 0) {
      return { degA: 60, degB: 60, degC: 60, radA: Math.PI / 3, radB: Math.PI / 3, radC: Math.PI / 3 };
    }

    // Law of Cosines
    const radA = Math.acos(Math.max(-1, Math.min(1, (lenAB ** 2 + lenCA ** 2 - lenBC ** 2) / (2 * lenAB * lenCA))));
    const radB = Math.acos(Math.max(-1, Math.min(1, (lenAB ** 2 + lenBC ** 2 - lenCA ** 2) / (2 * lenAB * lenBC))));
    const radC = Math.acos(Math.max(-1, Math.min(1, (lenBC ** 2 + lenCA ** 2 - lenAB ** 2) / (2 * lenBC * lenCA))));

    const degA = (radA * 180) / Math.PI;
    const degB = (radB * 180) / Math.PI;
    const degC = (radC * 180) / Math.PI;

    return { degA, degB, degC, radA, radB, radC };
  };

  const normalizeAngle = (angle: number, target: number) => {
    while (angle - target > Math.PI) angle -= 2 * Math.PI;
    while (angle - target < -Math.PI) angle += 2 * Math.PI;
    return angle;
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const isLight = theme === "light";

    const { A, B, C } = vertices;
    const { degA, degB, degC, radA, radB, radC } = getAngles();

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid Lines
    ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    const gridScale = 30;
    for (let x = 0; x < width; x += gridScale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridScale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    if (stage === "shu") {
      // ==========================================
      // STAGE 1 RENDERING: VERIDICAL ORIGAMI PROOF
      // ==========================================
      
      // Draw Baseline for straight horizon
      if (foldingProgress > 0) {
        ctx.strokeStyle = isLight ? "rgba(75, 85, 99, 0.35)" : "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(60, 310);
        ctx.lineTo(width - 60, 310);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = "bold 9px IBM Plex Mono, monospace";
        ctx.fillStyle = isLight ? "#475569" : "#94A3B8";
        ctx.fillText("180° STRAIGHT LINE PROJECTIONS", 70, 324);
      }

      // Draw original triangle bodies (fading out as fold advances)
      const alpha = 1 - foldingProgress;
      if (alpha > 0.01) {
        ctx.strokeStyle = isLight ? `rgba(15, 118, 110, ${alpha})` : `rgba(38, 198, 180, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.fillStyle = isLight ? `rgba(13, 148, 136, ${0.05 * alpha})` : `rgba(38, 198, 180, ${0.03 * alpha})`;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }

      // Helper function to draw dynamic angle wedge
      const drawAngleWedge = (cx: number, cy: number, start: number, end: number, color: string, radius = 35, fill = "rgba(0,0,0,0)") => {
        ctx.fillStyle = fill;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, start, end, false); ctx.closePath(); ctx.fill(); ctx.stroke();
      };

      // Base angle directions
      const tAB = Math.atan2(B.y - A.y, B.x - A.x);
      const tAC = Math.atan2(C.y - A.y, C.x - A.x);
      const tBC = Math.atan2(C.y - B.y, C.x - B.x);
      const tBA = Math.atan2(A.y - B.y, A.x - B.x);
      const tCB = Math.atan2(B.y - C.y, B.x - C.x);
      const tCA = Math.atan2(A.y - C.y, A.x - C.x);

      // Unified color-matched coding (A=Purple, B=Teal, C=Orange/Gold)
      const colorA = isLight ? "#7C3AED" : "#A78BFA"; // Purple
      const colorB = isLight ? "#0D9488" : "#2DD4BF"; // Teal
      const colorC = isLight ? "#EA580C" : "#F97316"; // Orange/Gold

      const fillA = "rgba(167, 139, 250, 0.15)";
      const fillB = "rgba(45, 212, 191, 0.15)";
      const fillC = "rgba(249, 115, 22, 0.15)";

      const baseCenter = { x: 300, y: 310 };

      // Wedge B (Teal)
      const bStart0 = tBA; const bEnd0 = tBC;
      const bStart1 = Math.PI; const bEnd1 = Math.PI - radB;
      const bStartCur = normalizeAngle(bStart0, bStart1) * (1 - foldingProgress) + bStart1 * foldingProgress;
      const bEndCur = normalizeAngle(bEnd0, bEnd1) * (1 - foldingProgress) + bEnd1 * foldingProgress;
      const bX = B.x * (1 - foldingProgress) + baseCenter.x * foldingProgress;
      const bY = B.y * (1 - foldingProgress) + baseCenter.y * foldingProgress;
      drawAngleWedge(bX, bY, bStartCur, bEndCur, colorB, 35, fillB);

      // Wedge A (Purple)
      const aStart0 = tAC; const aEnd0 = tAB;
      const aStart1 = Math.PI - radB; const aEnd1 = Math.PI - radB - radA;
      const aStartCur = normalizeAngle(aStart0, aStart1) * (1 - foldingProgress) + aStart1 * foldingProgress;
      const aEndCur = normalizeAngle(aEnd0, aEnd1) * (1 - foldingProgress) + aEnd1 * foldingProgress;
      const aX = A.x * (1 - foldingProgress) + baseCenter.x * foldingProgress;
      const aY = A.y * (1 - foldingProgress) + baseCenter.y * foldingProgress;
      drawAngleWedge(aX, aY, aStartCur, aEndCur, colorA, 38, fillA);

      // Wedge C (Orange)
      const cStart0 = tCB; const cEnd0 = tCA;
      const cStart1 = Math.PI - radB - radA; const cEnd1 = 0;
      const cStartCur = normalizeAngle(cStart0, cStart1) * (1 - foldingProgress) + cStart1 * foldingProgress;
      const cEndCur = normalizeAngle(cEnd0, cEnd1) * (1 - foldingProgress) + cEnd1 * foldingProgress;
      const cX = C.x * (1 - foldingProgress) + baseCenter.x * foldingProgress;
      const cY = C.y * (1 - foldingProgress) + baseCenter.y * foldingProgress;
      drawAngleWedge(cX, cY, cStartCur, cEndCur, colorC, 35, fillC);

      // Draw Crisp Origami dividers on straight flat base line
      if (foldingProgress > 0.05) {
        ctx.strokeStyle = isLight ? "#111827" : "#FFFFFF";
        ctx.lineWidth = 2.5;

        // Divider between B and A
        ctx.beginPath(); ctx.moveTo(baseCenter.x, baseCenter.y);
        ctx.lineTo(baseCenter.x + Math.cos(bEndCur) * 38, baseCenter.y + Math.sin(bEndCur) * 38);
        ctx.stroke();

        // Divider between A and C
        ctx.beginPath(); ctx.moveTo(baseCenter.x, baseCenter.y);
        ctx.lineTo(baseCenter.x + Math.cos(aEndCur) * 38, baseCenter.y + Math.sin(aEndCur) * 38);
        ctx.stroke();
      }

      // Display dynamic degree labels
      if (foldingProgress < 0.95) {
        ctx.font = "bold 10px IBM Plex Mono, monospace";
        ctx.fillStyle = colorA; ctx.fillText(`∠A=${degA.toFixed(0)}°`, A.x - 22, A.y + 35);
        ctx.fillStyle = colorB; ctx.fillText(`∠B=${degB.toFixed(0)}°`, B.x + 30, B.y - 12);
        ctx.fillStyle = colorC; ctx.fillText(`∠C=${degC.toFixed(0)}°`, C.x - 55, C.y - 12);
      } else {
        // Complete perceptual proof sums
        ctx.font = "bold 13px IBM Plex Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = isLight ? "#111827" : "#FFFFFF";
        ctx.fillText(`${degB.toFixed(0)}° (Teal) + ${degA.toFixed(0)}° (Purple) + ${degC.toFixed(0)}° (Orange) = 180°`, baseCenter.x, baseCenter.y - 30);
        ctx.textAlign = "left";
      }

      // Draggable handle rings
      if (foldingProgress === 0) {
        const drawHandle = (pt: Vertex, color: string, active: boolean) => {
          ctx.fillStyle = active ? color : (isLight ? "#FFFFFF" : "#111111");
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2); ctx.fill();
        };
        drawHandle(A, colorA, isDraggingRef.current === "A");
        drawHandle(B, colorB, isDraggingRef.current === "B");
        drawHandle(C, colorC, isDraggingRef.current === "C");
      }

    } else if (stage === "ha") {
      // ==========================================
      // STAGE 2 RENDERING: DOUBLE TRIANGLE SHEETS
      // ==========================================
      // Render adjacent triangles blueprint
      const node1 = { x: 120, y: 220 };
      const node2 = { x: 260, y: 100 }; // shared apex
      const node3 = { x: 340, y: 220 }; // shared base adjacent node
      const node4 = { x: 480, y: 110 };

      ctx.strokeStyle = isLight ? "#64748B" : "#475569";
      ctx.lineWidth = 2;

      // Triangle 1 body
      ctx.fillStyle = "rgba(124, 58, 237, 0.05)";
      ctx.beginPath(); ctx.moveTo(node1.x, node1.y); ctx.lineTo(node2.x, node2.y); ctx.lineTo(node3.x, node3.y); ctx.closePath(); ctx.fill(); ctx.stroke();

      // Triangle 2 body
      ctx.fillStyle = "rgba(45, 212, 191, 0.05)";
      ctx.beginPath(); ctx.moveTo(node3.x, node3.y); ctx.lineTo(node2.x, node2.y); ctx.lineTo(node4.x, node4.y); ctx.closePath(); ctx.fill(); ctx.stroke();

      // Core anchor labels
      ctx.font = "bold 10px IBM Plex Mono, monospace";
      ctx.fillStyle = isLight ? "#475569" : "#94A3B8";
      ctx.fillText("Triangle T1", 170, 200);
      ctx.fillText("Triangle T2 (Adjacent)", 340, 140);

      // Given sectors
      const drawAngleWedge = (cx: number, cy: number, start: number, end: number, color: string) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 25, start, end); ctx.closePath(); ctx.stroke();
      };

      // T1 known angles: Left (55°) and Shared Top (65°)
      drawAngleWedge(node1.x, node1.y, -Math.PI/4, 0, "#A78BFA");
      drawAngleBadge(ctx, "55°", node1.x + 38, node1.y - 12, isLight, "#A78BFA");

      drawAngleWedge(node2.x, node2.y, Math.PI/2, Math.PI, "#A78BFA");
      drawAngleBadge(ctx, "65°", node2.x - 20, node2.y + 40, isLight, "#A78BFA");

      // Shared adjacent angle on line: ∠C1
      drawAngleWedge(node3.x, node3.y, Math.PI, Math.PI + Math.PI/3, "#EA580C");
      drawAngleBadge(ctx, "∠C1", node3.x - 38, node3.y - 15, isLight, "#EA580C");

      // T2 target angle: ∠E (Deduction point)
      drawAngleWedge(node4.x, node4.y, Math.PI/2, Math.PI, "#2DD4BF");
      drawAngleBadge(ctx, "∠E = ?", node4.x - 22, node4.y + 38, isLight, "#2DD4BF");

    } else if (stage === "ri") {
      // ==========================================
      // STAGE 3 RENDERING: ARCHED BRIDGE CHASSIS
      // ==========================================
      
      // Beautiful structural outline of arched civil bridge joints
      ctx.strokeStyle = isLight ? "rgba(15, 118, 110, 0.15)" : "rgba(38, 198, 180, 0.1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(300, 340, 180, Math.PI, 0, false);
      ctx.stroke();

      // Top roadway line of the bridge
      ctx.strokeStyle = isLight ? "#64748B" : "#334155";
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(40, 80); ctx.lineTo(width - 40, 80); ctx.stroke();

      // Steel truss triangles
      ctx.strokeStyle = s3IsSecured ? "#10B981" : (isLight ? "#0F766E" : "#26C6B4");
      ctx.lineWidth = 3;
      
      const bridgeA = { x: 120, y: 220 };
      const bridgeB = { x: 210, y: 110 };
      const bridgeC = { x: vertices.C.x, y: 220 }; // dynamically warped C
      const bridgeD = { x: 440, y: 110 };

      ctx.beginPath();
      ctx.moveTo(40, 220);
      ctx.lineTo(bridgeA.x, bridgeA.y);
      ctx.lineTo(bridgeB.x, bridgeB.y);
      ctx.lineTo(bridgeC.x, bridgeC.y);
      ctx.lineTo(bridgeD.x, bridgeD.y);
      ctx.lineTo(width - 40, 220);
      ctx.stroke();

      // Overlapping locking structural support struts
      ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bridgeA.x, bridgeA.y); ctx.lineTo(bridgeC.x, bridgeC.y);
      ctx.moveTo(bridgeB.x, bridgeB.y); ctx.lineTo(bridgeD.x, bridgeD.y);
      ctx.stroke();

      // Vertex C is interactive drag handle (Glowing gold/orange)
      ctx.fillStyle = isDraggingRef.current === "C" ? "#FF8C42" : (isLight ? "#FFFFFF" : "#111111");
      ctx.strokeStyle = "#FF8C42";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bridgeC.x, bridgeC.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#FF8C42";
      ctx.beginPath(); ctx.arc(bridgeC.x, bridgeC.y, 4, 0, Math.PI * 2); ctx.fill();

      // Locked handles (gray)
      const drawLockedPin = (pt: Vertex, name: string) => {
        ctx.fillStyle = isLight ? "#E2E8F0" : "#1E293B";
        ctx.strokeStyle = isLight ? "#94A3B8" : "#475569";
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      };
      drawLockedPin(bridgeA, "A");
      drawLockedPin(bridgeB, "B");
      drawLockedPin(bridgeD, "D");

      // Realtime interior angle C display badge
      const curC = getAngles().degC;
      ctx.font = "bold 9px IBM Plex Mono, monospace";
      ctx.fillStyle = "#FF5722";
      ctx.fillText(`JOINT C = ${curC.toFixed(0)}°`, bridgeC.x - 35, bridgeC.y + 26);
    }

  }, [stage, vertices, activeHighlight, foldingProgress, theme, s2Step, s2InputB, s3TargetAngle, s3IsSecured]);

  // Event handlers for dragging
  const handleMouseDown = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (stage === "shu") {
      if (foldingProgress > 0) return;
      const { A, B, C } = vertices;
      const distA = Math.sqrt((mouseX - A.x) ** 2 + (mouseY - A.y) ** 2);
      const distB = Math.sqrt((mouseX - B.x) ** 2 + (mouseY - B.y) ** 2);
      const distC = Math.sqrt((mouseX - C.x) ** 2 + (mouseY - C.y) ** 2);

      if (distA < 15) isDraggingRef.current = "A";
      else if (distB < 15) isDraggingRef.current = "B";
      else if (distC < 15) isDraggingRef.current = "C";
      
      if (isDraggingRef.current !== "none") synth.playClick();
    } else if (stage === "ri") {
      const distC = Math.sqrt((mouseX - vertices.C.x) ** 2 + (mouseY - 220) ** 2);
      if (distC < 18) {
        isDraggingRef.current = "C";
        synth.playClick();
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingRef.current === "none") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width;

    setVertices((prev) => {
      const next = { ...prev };
      const id = isDraggingRef.current;

      if (id === "A") {
        next.A = {
          x: Math.max(120, Math.min(width - 120, mouseX)),
          y: Math.max(45, Math.min(140, mouseY)),
        };
      } else if (id === "B") {
        next.B = {
          x: Math.max(60, Math.min(prev.C.x - 80, mouseX)),
          y: Math.max(180, Math.min(280, mouseY)),
        };
      } else if (id === "C") {
        if (stage === "ri") {
          next.C = {
            x: Math.max(220, Math.min(420, mouseX)),
            y: 220,
          };
        } else {
          next.C = {
            x: Math.max(prev.B.x + 80, Math.min(width - 60, mouseX)),
            y: Math.max(180, Math.min(280, mouseY)),
          };
        }
      }
      return next;
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = "none";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [vertices, stage]);

  // Folding animator
  const triggerFoldingAnimation = () => {
    if (isFoldingRef.current) return;
    synth.playClick();
    isFoldingRef.current = true;
    setFoldingProgress(0.01);

    let progress = 0.01;
    const animate = () => {
      progress += 0.02;
      if (progress >= 1.0) {
        setFoldingProgress(1.0);
        isFoldingRef.current = false;
        synth.playSuccess();
        confetti({ particleCount: 20, spread: 35, origin: { y: 0.7 } });
        saveKCMastery("KC.5.1"); // Triangle Angle Sum Principle
      } else {
        setFoldingProgress(progress);
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  };

  // Stage 2: Submit adjacent double triangle solvers
  const handleS2Verify = () => {
    if (s2Step === "B") {
      const ansE = parseFloat(s2InputB);
      // Triangle 1: 55° and 65° -> C1 = 180 - (55 + 65) = 60°.
      // C1 and C2 on a line -> C2 = 180 - 60 = 120°. (Step B solved C2 for them).
      // Triangle 2 has Apex C2 = 120° and Top Apex node4 = 40°. 
      // Answer E = 180 - (120 + 40) = 20°.
      if (!isNaN(ansE) && ansE === 20) {
        setS2Status("correct");
        setS2Feedback("Correct! Triangle T2 third angle E is 180 - (120 + 40) = 20°.");
        synth.playSuccess();
        saveKCMastery("KC.5.2"); // External Straight-Line Fact
      } else {
        setS2Status("incorrect");
        setS2Feedback("Incorrect deduction. Follow the angle sum calculations carefully.");
        synth.playThud();
      }
    } else if (s2Step === "C") {
      const ansC = parseFloat(s2InputC_D);
      const ansE = parseFloat(s2InputC_E);
      // New random-style task step: Given T1: 50° and 80° -> C1 = 180 - (50 + 80) = 50°.
      // Supplementary C2 = 180 - 50 = 130°.
      // Given T2 Apex = 30° -> E = 180 - (130 + 30) = 20°.
      if (!isNaN(ansC) && !isNaN(ansE) && ansC === 130 && ansE === 20) {
        setS2Status("correct");
        setS2Feedback("Stunning! Supplementary angle C2 is 130° and remote apex E is 20°. Multiple-triangle chasing verified.");
        synth.playSuccess();
        saveKCMastery("KC.5.3"); // Composite Polygon Decomposition
        confetti({ particleCount: 25, spread: 40 });
      } else {
        setS2Status("incorrect");
        setS2Feedback("Incorrect values. Check your sequential supplementary and angle sum properties.");
        synth.playThud();
      }
    }
  };

  // Stage 3: Steel arch bridge structural verify
  const handleS3Verify = () => {
    const { degC } = getAngles();
    const error = Math.abs(degC - s3TargetAngle);

    if (error < 2.0) {
      setS3Status("correct");
      setS3IsSecured(true);
      setS3Feedback("Structural stress SECURED! Arch loading is fully aligned and balanced at 65°.");
      synth.playSuccess();
      const end = Date.now() + 1000;
      const frame = () => {
        confetti({ particleCount: 3, colors: ["#10B981", "#2DD4BF"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else {
      setS3Status("incorrect");
      setS3Feedback(`Bridge deflection risk! Angle C is ${degC.toFixed(1)}° (${error.toFixed(1)}° deviation). Drag handle C to exactly 65°.`);
      synth.playThud();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-vidya-surface p-6 rounded-xl border border-vidya-border max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
      {!creatorMode && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-vidya-accent/40" />
      )}

      {/* Main Interactive Canvas */}
      <div className="flex-1 flex flex-col items-center">
        <div className="relative border border-vidya-border bg-vidya-void rounded-lg overflow-hidden w-full aspect-video md:w-[600px] md:h-[350px]">
          <canvas
            ref={canvasRef}
            width={600}
            height={350}
            className="w-full h-full block cursor-pointer"
          />

          {creatorMode && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 border border-vidya-accent/40 bg-vidya-void/80 text-vidya-accent text-[10px] font-mono rounded-full backdrop-blur-md uppercase tracking-widest animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Recording Active
            </div>
          )}
        </div>

        {/* Dynamic status feedback */}
        <div className="w-full mt-4 bg-vidya-void p-3 rounded border border-vidya-border/60 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-vidya-accent animate-pulse" />
            <span className="text-vidya-text-muted">KLI Active Grader:</span>
            <span className="text-vidya-text font-semibold">
              {stage === "shu"
                ? foldingProgress > 0 ? "Verifying corner fold onto straight base..." : "Drag vertex handles to change interior geometry."
                : stage === "ha"
                ? `Scaffolded Calculation Step ${s2Step}`
                : s3IsSecured ? "Arch Bridge securely load-balanced!" : "Drag Vertex C to neutralize arch load tension."}
            </span>
          </div>
          <div className="text-vidya-accent-warm font-bold">
            {stage === "shu"
              ? `Sum = 180°`
              : stage === "ha"
              ? `Sum = 180°`
              : `Current C: ${getAngles().degC.toFixed(0)}° / ${s3TargetAngle}°`}
          </div>
        </div>
      </div>

      {/* Control Panel HUD */}
      <AnimatePresence>
        {!creatorMode && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-full lg:w-[320px] flex flex-col justify-between"
          >
            <div className="flex flex-col gap-5">
              {/* Stepper Stage Tracker (Fully Read-Only) */}
              <div className="flex items-center gap-2 border-b border-vidya-border pb-4">
                <div className="flex gap-1.5">
                  {(["shu", "ha", "ri"] as const).map((s) => (
                    <div
                      key={s}
                      className={`h-2.5 rounded-full transition-all ${
                        stage === s
                          ? "w-8 bg-vidya-accent"
                          : "w-2.5 bg-vidya-surface-raised border border-vidya-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-vidya-text-muted uppercase tracking-wider ml-auto font-semibold">
                  {stage === "shu"
                    ? "Stage 1: Category Induction"
                    : stage === "ha"
                    ? "Stage 2: Scaffolded Deduction"
                    : "Stage 3: Strategic Transfer"}
                </span>
              </div>

              {/* Dynamic HUD Content based on active stage */}
              <div className="flex-1">
                {stage === "shu" && (
                  <div>
                    <h3 className="text-base font-display font-bold text-vidya-text flex items-center gap-2">
                      <Compass className="w-4 h-4 text-vidya-accent" />
                      Stage 1: Veridical Origami Proof
                    </h3>
                    <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                      Drag any corner of the triangle to warp it. Then click below to fold all three interior corners onto a flat straight horizon!
                    </p>

                    <div className="mt-5 space-y-3">
                      {foldingProgress === 0 ? (
                        <button
                          onClick={triggerFoldingAnimation}
                          className="w-full py-2.5 bg-vidya-surface-raised border border-vidya-border hover:border-vidya-accent text-vidya-text font-mono text-xs rounded transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Fold Corners (Prove 180°)
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            synth.playClick();
                            setFoldingProgress(0);
                          }}
                          className="w-full py-2.5 bg-vidya-void border border-vidya-accent text-vidya-accent font-mono text-xs rounded transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Unfold Triangle
                        </button>
                      )}

                      <div className="p-3 bg-vidya-accent/5 border border-vidya-accent/20 rounded-lg text-[11px] leading-relaxed font-mono">
                        <strong className="text-vidya-accent block mb-0.5 text-[10px] uppercase tracking-wider">Perceptual Proof:</strong>
                        Notice how the color wedges (A=Purple, B=Teal, C=Orange/Gold) merge flawlessly into a perfectly straight line total of exactly 180° in all cases!
                      </div>
                    </div>
                  </div>
                )}

                {stage === "ha" && (
                  <div>
                    <h3 className="text-base font-display font-bold text-vidya-text flex items-center gap-2">
                      <Zap className="w-4 h-4 text-vidya-accent-warm" />
                      Stage 2: Scaffolded Multi-Triangle
                    </h3>
                    <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                      STEM exams test composite shapes, not single triangles. Work through these faded steps to build polygon decomposition skills:
                    </p>

                    {/* Step Cards */}
                    <div className="mt-4 space-y-4">
                      {s2Step === "A" && (
                        <div className="p-3.5 bg-vidya-surface-raised border border-vidya-border rounded-lg font-mono text-xs space-y-2.5">
                          <div className="text-vidya-accent font-bold">Step 2A: Full Double-Triangle Worked Example</div>
                          <div>Given Triangle T1: <strong>∠A = 55°</strong>, <strong>∠B = 65°</strong>. Adjacent to Triangle T2.</div>
                          <div className="text-vidya-text-muted">
                            1. Calculate third angle C1 in T1: <br />
                            <span className="text-white font-semibold">180 - (55 + 65) = 60°</span>
                          </div>
                          <div className="text-vidya-text-muted">
                            2. Since C1 and adjacent C2 sit on a flat line: <br />
                            <span className="text-white font-semibold">C2 = 180 - 60 = 120°</span>
                          </div>
                          <div className="text-vidya-text-muted">
                            3. Given Apex node4 = 40°, third angle E in T2 is: <br />
                            <span className="text-white font-semibold">180 - (120 + 40) = 20°</span>
                          </div>
                          <button
                            onClick={() => {
                              synth.playClick();
                              setS2Step("B");
                              setS2Status("idle");
                            }}
                            className="w-full mt-2 py-2 bg-vidya-accent text-vidya-void font-bold rounded uppercase tracking-wider text-[10px]"
                          >
                            Proceed to Step 2B
                          </button>
                        </div>
                      )}

                      {s2Step === "B" && (
                        <div className="p-3.5 bg-vidya-surface-raised border border-vidya-border rounded-lg font-mono text-xs space-y-3">
                          <div className="text-vidya-accent-warm font-bold">Step 2B: Faded Practice Blank</div>
                          <div>T1 angles: <strong>55°</strong>, <strong>65°</strong>. T2 apex: <strong>40°</strong>.</div>
                          <div>
                            C2 solved for you: <span className="text-vidya-accent font-semibold">120°</span>
                          </div>
                          <div>
                            <label className="block text-[10px] text-vidya-text-muted uppercase mb-1">Calculate Final Target Angle E (deg):</label>
                            <input
                              type="text"
                              placeholder="180 - (120 + 40) = ?"
                              value={s2InputB}
                              onChange={(e) => setS2InputB(e.target.value)}
                              className="w-full py-1.5 px-2.5 border border-vidya-border bg-vidya-void text-vidya-text text-sm rounded outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {s2Step === "C" && (
                        <div className="p-3.5 bg-vidya-surface-raised border border-vidya-border rounded-lg font-mono text-xs space-y-3">
                          <div className="text-vidya-accent font-bold">Step 2C: Independent Deduction</div>
                          <div>T1: <strong>50°</strong>, <strong>80°</strong>. T2 apex: <strong>30°</strong>.</div>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] text-vidya-text-muted uppercase mb-0.5">Calculate intermediate adjacent C2 (deg):</label>
                              <input
                                type="text"
                                placeholder="Supplementary C2"
                                value={s2InputC_D}
                                onChange={(e) => setS2InputC_D(e.target.value)}
                                className="w-full py-1.5 px-2.5 border border-vidya-border bg-vidya-void text-vidya-text text-sm rounded outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-vidya-text-muted uppercase mb-0.5">Calculate final remote Angle E (deg):</label>
                              <input
                                type="text"
                                placeholder="Target Angle E"
                                value={s2InputC_E}
                                onChange={(e) => setS2InputC_E(e.target.value)}
                                className="w-full py-1.5 px-2.5 border border-vidya-border bg-vidya-void text-vidya-text text-sm rounded outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {s2Status !== "idle" && (
                      <div
                        className={`mt-3 p-2.5 rounded border text-[11px] font-mono leading-relaxed ${
                          s2Status === "correct"
                            ? "bg-vidya-success/5 border-vidya-success/30 text-vidya-success"
                            : "bg-vidya-error/5 border-vidya-error/30 text-vidya-error"
                        }`}
                      >
                        {s2Feedback}
                      </div>
                    )}
                  </div>
                )}

                {stage === "ri" && (
                  <div>
                    <h3 className="text-base font-display font-bold text-vidya-text flex items-center gap-2">
                      <Award className="w-4 h-4 text-vidya-accent" />
                      Stage 3: Steel Arch Bridge Joint Alignment
                    </h3>
                    <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                      Vertex C acts as an adjustable load-bearing arch anchor. Drag C to distort the truss system until Joint C's angle is exactly:
                      <span className="text-vidya-accent-warm font-semibold block text-base mt-1 font-mono">
                        {s3TargetAngle}° (Balancing Load limit)
                      </span>
                    </p>

                    <div className="mt-4 bg-vidya-void p-3.5 border border-vidya-border rounded-lg space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span>Current Arch Angle C:</span>
                        <span className="text-vidya-accent font-bold">{getAngles().degC.toFixed(0)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target Loading Angle:</span>
                        <span className="text-vidya-accent-warm font-bold">{s3TargetAngle}°</span>
                      </div>
                    </div>

                    {s3Feedback && (
                      <div
                        className={`mt-3 p-2.5 rounded border text-[11px] font-mono leading-relaxed ${
                          s3Status === "correct"
                            ? "bg-vidya-success/5 border-vidya-success/30 text-vidya-success"
                            : "bg-vidya-error/5 border-vidya-error/30 text-vidya-error"
                        }`}
                      >
                        {s3Feedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions progress bar HUD */}
            <div className="mt-8 border-t border-vidya-border pt-4 flex flex-col gap-3">
              <div className="flex gap-2.5">
                {stage !== "shu" && (
                  <button
                    onClick={() => {
                      synth.playClick();
                      if (stage === "ha") {
                        setStage("shu");
                        setFoldingProgress(0);
                        setS2Status("idle");
                      } else if (stage === "ri") {
                        setS2Step("C");
                        setS2Status("idle");
                        setS2InputC_D("");
                        setS2InputC_E("");
                        setStage("ha");
                      }
                    }}
                    className="px-4 py-3 border border-vidya-border bg-vidya-void hover:bg-vidya-surface hover:text-vidya-accent text-vidya-text-muted font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                {stage === "shu" && (
                  <button
                    onClick={() => {
                      if (foldingProgress < 0.95) return;
                      synth.playClick();
                      setFoldingProgress(0); // unfolded transition guard
                      setS2Step("A");
                      setS2Status("idle");
                      setStage("ha");
                    }}
                    disabled={foldingProgress < 0.95}
                    className={`flex-1 py-3 font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      foldingProgress >= 0.95
                        ? "bg-gradient-to-r from-vidya-accent to-vidya-accent-hover text-vidya-void animate-pulse"
                        : "bg-vidya-surface border border-vidya-border text-vidya-text-muted opacity-40 cursor-not-allowed"
                    }`}
                  >
                    Submit
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {stage === "ha" && (
                  <>
                    {s2Status !== "correct" ? (
                      <button
                        onClick={handleS2Verify}
                        disabled={s2Step === "A"}
                        className="flex-1 py-3 bg-gradient-to-r from-vidya-accent-warm to-vidya-accent-warm-strong text-vidya-void font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        Verify Answer
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          synth.playClick();
                          if (s2Step === "B") {
                            setS2Step("C");
                            setS2Status("idle");
                          } else {
                            setStage("ri");
                            setS3Status("idle");
                            setS3IsSecured(false);
                            setS3Feedback("");
                          }
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-vidya-accent to-vidya-accent-hover text-vidya-void font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        Proceed
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}

                {stage === "ri" && (
                  <>
                    {!s3IsSecured ? (
                      <button
                        onClick={handleS3Verify}
                        className="flex-1 py-3 bg-gradient-to-r from-vidya-accent-warm to-vidya-accent-warm-strong text-vidya-void font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg cursor-pointer animate-pulse"
                      >
                        Verify Arch Alignment
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          synth.playClick();
                          onSequenceComplete();
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-vidya-accent to-vidya-accent-hover text-vidya-void font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg animate-bounce"
                      >
                        Complete & Earn Token
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Progress subtexts helper */}
              {stage === "shu" && (
                <p className="text-[10px] text-vidya-text-muted text-center font-mono">
                  Interact with the triangle vertices, click fold corners, then click Submit.
                </p>
              )}
              {stage === "ha" && s2Status !== "correct" && (
                <p className="text-[10px] text-vidya-text-muted text-center font-mono">
                  Perform calculations for the active step, then click Verify.
                </p>
              )}
              {stage === "ha" && s2Status === "correct" && (
                <p className="text-[10px] text-vidya-success text-center font-mono animate-pulse">
                  Step correct! Click Proceed.
                </p>
              )}
              {stage === "ri" && !s3IsSecured && (
                <p className="text-[10px] text-vidya-text-muted text-center font-mono">
                  Drag Vertex C horizontally to find the exact balancing 65° loading angle.
                </p>
              )}
              {stage === "ri" && s3IsSecured && (
                <p className="text-[10px] text-vidya-success text-center font-mono animate-pulse">
                  Arch truss locked! Sequence complete. Claim your token!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
