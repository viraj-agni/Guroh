"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Compass, Zap, Award, RotateCcw, Sparkles, Layers, ShieldAlert, CheckCircle2, HelpCircle } from "lucide-react";
import { synth } from "./AudioEngine";
import confetti from "canvas-confetti";

interface ParallelTransversalsSandboxProps {
  onSequenceComplete: () => void;
  creatorMode: boolean;
  theme?: "dark" | "light";
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

export default function ParallelTransversalsSandbox({
  onSequenceComplete,
  creatorMode,
  theme = "dark",
}: ParallelTransversalsSandboxProps) {
  const [stage, setStage] = useState<"shu" | "ha" | "ri">("shu");

  // Exploration / Slider angle
  const [transversalAngle, setTransversalAngle] = useState<number>(60); // In degrees
  const railSpacing = 120; // Spacing in pixels

  // Stage 1 Concept Matching state
  const [s1TargetConcept, setS1TargetConcept] = useState<"corresponding" | "alternate_interior" | "co_interior">("corresponding");
  const [s1SelectedSectors, setS1SelectedSectors] = useState<number[]>([]);
  const [s1MasteredConcepts, setS1CompletedConcepts] = useState<string[]>([]);
  const [s1FeedbackText, setS1FeedbackText] = useState<string>("Select the correct matching pairs on the canvas!");

  // Stage 2 Faded Worked Example state
  const [s2Step, setS2Step] = useState<"A" | "B" | "C">("A");
  const [s2InputB, setS2InputB] = useState<string>(""); // input for Angle X in Step B
  const [s2InputC_X, setS2InputC_X] = useState<string>(""); // input for Angle X in Step C
  const [s2InputC_Y, setS2InputC_Y] = useState<string>(""); // input for Angle Y in Step C
  const [s2Status, setS2Status] = useState<"idle" | "correct" | "incorrect">("idle");
  const [s2Feedback, setS2Feedback] = useState<string>("");

  // Stage 3 Capstone Roof Truss state
  const [s3StartAngle] = useState<number>(55); // fixed starting truss angle
  const [s3Inputs, setS3Inputs] = useState<string[]>(["", "", "", "", ""]); // inputs for 5 joints: J1, J2, J3, J4, J5
  const [s3Status, setS3Status] = useState<"idle" | "correct" | "incorrect">("idle");
  const [s3Feedback, setS3Feedback] = useState<string>("");
  const [s3IsSecured, setS3IsSecured] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Helper to retrieve user mastery status from localStorage
  const saveKCMastery = (kcCode: string) => {
    try {
      localStorage.setItem(`Vidyā.KC_Mastery.${kcCode}`, "true");
    } catch (e) {
      console.warn("Storage write failed: ", e);
    }
  };

  // Stage 1 Click Handler for Sector Sorting Game
  const getSectorFromClick = (mouseX: number, mouseY: number, x1: number, y_top: number, x2: number, y_bottom: number, aRad: number) => {
    const clickRadius = 75;

    // Check distance to top intersection
    const distTop = Math.sqrt((mouseX - x1) ** 2 + (mouseY - y_top) ** 2);
    if (distTop < clickRadius) {
      let angle = Math.atan2(mouseY - y_top, mouseX - x1);
      if (angle < 0) angle += Math.PI * 2;
      
      // Determine sector
      if (angle >= 0 && angle < aRad) return 1;
      if (angle >= aRad && angle < Math.PI) return 2;
      if (angle >= Math.PI && angle < Math.PI + aRad) return 3;
      return 4;
    }

    // Check distance to bottom intersection
    const distBottom = Math.sqrt((mouseX - x2) ** 2 + (mouseY - y_bottom) ** 2);
    if (distBottom < clickRadius) {
      let angle = Math.atan2(mouseY - y_bottom, mouseX - x2);
      if (angle < 0) angle += Math.PI * 2;
      
      // Determine sector
      if (angle >= 0 && angle < aRad) return 5;
      if (angle >= aRad && angle < Math.PI) return 6;
      if (angle >= Math.PI && angle < Math.PI + aRad) return 7;
      return 8;
    }

    return null;
  };

  // Check matching rules
  const checkS1Match = (sectorA: number, sectorB: number) => {
    const minS = Math.min(sectorA, sectorB);
    const maxS = Math.max(sectorA, sectorB);

    if (s1TargetConcept === "corresponding") {
      // Pairs are (1,5), (2,6), (3,7), (4,8)
      return (minS === 1 && maxS === 5) || (minS === 2 && maxS === 6) || (minS === 3 && maxS === 7) || (minS === 4 && maxS === 8);
    } else if (s1TargetConcept === "alternate_interior") {
      // Interior sectors of top are 3, 4. Bottom interior are 5, 6.
      // Alternate opposite side pairs: (3, 5) or (4, 6)
      return (minS === 3 && maxS === 5) || (minS === 4 && maxS === 6);
    } else if (s1TargetConcept === "co_interior") {
      // Inside parallel rails, same side: (3, 6) or (4, 5)
      return (minS === 3 && maxS === 6) || (minS === 4 && maxS === 5);
    }
    return false;
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

    // Centers of intersections
    const x1 = width / 2;
    const y_top = 100;
    const y_bottom = y_top + railSpacing;

    // Angle of transversal in Radians
    const angleRad = (transversalAngle * Math.PI) / 180;
    const dx = Math.tan(angleRad) !== 0 ? railSpacing / Math.tan(angleRad) : 0;
    const x2 = x1 + dx;

    const tAngleRad = Math.atan2(y_bottom - y_top, x2 - x1);

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid Lines
    ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    const gridScale = 30;
    for (let x = 0; x < width; x += gridScale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridScale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (stage === "shu") {
      // ==========================================
      // STAGE 1 RENDERING: CATEGORY INDUCTION GAME
      // ==========================================
      
      // Draw Parallel Rails
      ctx.strokeStyle = isLight ? "rgba(15, 118, 110, 0.6)" : "rgba(38, 198, 180, 0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, y_top);
      ctx.lineTo(width - 60, y_top);
      ctx.moveTo(60, y_bottom);
      ctx.lineTo(width - 60, y_bottom);
      ctx.stroke();

      // Parallel arrows
      const drawRailArrow = (cy: number) => {
        ctx.fillStyle = isLight ? "rgba(15, 118, 110, 0.8)" : "rgba(38, 198, 180, 0.8)";
        ctx.beginPath();
        ctx.moveTo(80, cy - 6); ctx.lineTo(90, cy); ctx.lineTo(80, cy + 6); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(92, cy - 6); ctx.lineTo(102, cy); ctx.lineTo(92, cy + 6); ctx.closePath(); ctx.fill();
      };
      drawRailArrow(y_top);
      drawRailArrow(y_bottom);

      // Label lines
      ctx.font = "bold 9px IBM Plex Mono, monospace";
      ctx.fillStyle = isLight ? "#0F766E" : "#26C6B4";
      ctx.fillText("PARALLEL RAIL L1", 110, y_top - 8);
      ctx.fillText("PARALLEL RAIL L2", 110, y_bottom + 15);

      // Draw Transversal Line
      const extendLen = 65;
      const startX = x1 - Math.cos(tAngleRad) * extendLen;
      const startY = y_top - Math.sin(tAngleRad) * extendLen;
      const endX = x2 + Math.cos(tAngleRad) * extendLen;
      const endY = y_bottom + Math.sin(tAngleRad) * extendLen;

      ctx.strokeStyle = isLight ? "#B45309" : "#FFB020";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Sector Rendering function
      const drawSortingSector = (id: number, cx: number, cy: number, start: number, end: number, label: string) => {
        const isSelected = s1SelectedSectors.includes(id);
        const radius = isSelected ? 40 : 30;

        let fill = "rgba(154, 146, 136, 0.04)";
        let stroke = isLight ? "rgba(100, 116, 139, 0.2)" : "rgba(148, 163, 184, 0.15)";
        let lineWidth = 1.5;

        if (isSelected) {
          fill = "rgba(255, 176, 32, 0.25)";
          stroke = "#FFB020";
          lineWidth = 2.5;
        } else {
          // Pre-highlight active targets to facilitate perceptual induction
          const activeTeal = "rgba(38, 198, 180, 0.12)";
          const activeTealStroke = "rgba(38, 198, 180, 0.4)";
          const activeOrange = "rgba(255, 140, 66, 0.12)";
          const activeOrangeStroke = "rgba(255, 140, 66, 0.4)";

          if (s1TargetConcept === "corresponding") {
            // corresponding sectors (1,5), (2,6), (3,7), (4,8)
            if (id === 1 || id === 5) { fill = activeTeal; stroke = activeTealStroke; }
            if (id === 3 || id === 7) { fill = activeOrange; stroke = activeOrangeStroke; }
          } else if (s1TargetConcept === "alternate_interior") {
            // alternate interior sectors (3,5), (4,6)
            if (id === 3 || id === 5) { fill = activeTeal; stroke = activeTealStroke; }
            if (id === 4 || id === 6) { fill = activeOrange; stroke = activeOrangeStroke; }
          } else if (s1TargetConcept === "co_interior") {
            // co-interior sectors (3,6), (4,5)
            if (id === 3 || id === 6) { fill = activeTeal; stroke = activeTealStroke; }
            if (id === 4 || id === 5) { fill = activeOrange; stroke = activeOrangeStroke; }
          }
        }

        ctx.save();
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, end, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw sector numeric label inside
        const bisector = start + (end - start) / 2;
        const lx = cx + Math.cos(bisector) * (radius - 12);
        const ly = cy + Math.sin(bisector) * (radius - 12);
        ctx.font = "bold 9px IBM Plex Mono, monospace";
        ctx.fillStyle = isSelected ? "#FFB020" : (isLight ? "#475569" : "#94A3B8");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, lx, ly);
        ctx.restore();
      };

      // Draw Top Sectors (1-4)
      drawSortingSector(1, x1, y_top, 0, tAngleRad, "1");
      drawSortingSector(2, x1, y_top, tAngleRad, Math.PI, "2");
      drawSortingSector(3, x1, y_top, Math.PI, Math.PI + tAngleRad, "3");
      drawSortingSector(4, x1, y_top, Math.PI + tAngleRad, Math.PI * 2, "4");

      // Draw Bottom Sectors (5-8)
      drawSortingSector(5, x2, y_bottom, 0, tAngleRad, "5");
      drawSortingSector(6, x2, y_bottom, tAngleRad, Math.PI, "6");
      drawSortingSector(7, x2, y_bottom, Math.PI, Math.PI + tAngleRad, "7");
      drawSortingSector(8, x2, y_bottom, Math.PI + tAngleRad, Math.PI * 2, "8");

      // Bisector labels for real angles
      const drawS1Angles = () => {
        const rad_1 = tAngleRad / 2;
        const rad_2 = tAngleRad + (Math.PI - tAngleRad) / 2;
        drawAngleBadge(ctx, `∠1 = ${transversalAngle.toFixed(0)}°`, x1 + Math.cos(rad_1) * 58, y_top + Math.sin(rad_1) * 58, isLight, "rgba(38, 198, 180, 0.4)");
        drawAngleBadge(ctx, `∠2 = ${(180 - transversalAngle).toFixed(0)}°`, x1 + Math.cos(rad_2) * 58, y_top + Math.sin(rad_2) * 58, isLight, "rgba(255, 140, 66, 0.4)");
      };
      drawS1Angles();

      // Render draggable handle
      ctx.fillStyle = isDraggingRef.current ? (isLight ? "#0D9488" : "#26C6B4") : (isLight ? "#FFFFFF" : "#1A1A1A");
      ctx.strokeStyle = isLight ? "#0F766E" : "#26C6B4";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x2, y_bottom, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLight ? "#0F766E" : "#26C6B4";
      ctx.beginPath();
      ctx.arc(x2, y_bottom, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "bold 8px IBM Plex Mono, monospace";
      ctx.fillStyle = isLight ? "#0F766E" : "#26C6B4";
      ctx.fillText("DRAG ROTATE", x2 - 28, y_bottom + 26);

    } else if (stage === "ha") {
      // ==========================================
      // STAGE 2 RENDERING: FADED WORKED EXAMPLES
      // ==========================================
      // Static premium rails for blueprint feel
      ctx.strokeStyle = isLight ? "rgba(100, 116, 139, 0.4)" : "rgba(71, 85, 105, 0.4)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(80, y_top); ctx.lineTo(width - 80, y_top);
      ctx.moveTo(80, y_bottom); ctx.lineTo(width - 80, y_bottom);
      ctx.stroke();

      const givenAngle = s2Step === "A" ? 70 : (s2Step === "B" ? 65 : 120);
      const dynamicAngleRad = (givenAngle * Math.PI) / 180;
      const staticDx = railSpacing / Math.tan(dynamicAngleRad);
      const staticX2 = x1 + staticDx;
      const staticTAngleRad = Math.atan2(y_bottom - y_top, staticX2 - x1);

      // Transversal
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1 - Math.cos(staticTAngleRad) * 45, y_top - Math.sin(staticTAngleRad) * 45);
      ctx.lineTo(staticX2 + Math.cos(staticTAngleRad) * 45, y_bottom + Math.sin(staticTAngleRad) * 45);
      ctx.stroke();

      // Wedges and Badges
      const drawAngleWedge = (cx: number, cy: number, start: number, end: number, color: string, fill = "rgba(255,176,32,0.12)") => {
        ctx.fillStyle = fill;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 28, start, end); ctx.closePath(); ctx.fill(); ctx.stroke();
      };

      // Given Sector (top right)
      drawAngleWedge(x1, y_top, 0, staticTAngleRad, "#FFB020");
      drawAngleBadge(ctx, `${givenAngle}°`, x1 + Math.cos(staticTAngleRad / 2) * 45, y_top + Math.sin(staticTAngleRad / 2) * 45, isLight, "#FFB020");

      // Angle X Sector (top left - supplementary)
      drawAngleWedge(x1, y_top, staticTAngleRad, Math.PI, "#A78BFA", "rgba(167, 139, 250, 0.15)");
      drawAngleBadge(ctx, `∠X = ?`, x1 + Math.cos(staticTAngleRad + (Math.PI - staticTAngleRad) / 2) * 45, y_top + Math.sin(staticTAngleRad + (Math.PI - staticTAngleRad) / 2) * 45, isLight, "#A78BFA");

      // Angle Y Sector (bottom left - alternate interior)
      drawAngleWedge(staticX2, y_bottom, Math.PI, Math.PI + staticTAngleRad, "#2DD4BF", "rgba(45, 212, 191, 0.15)");
      drawAngleBadge(ctx, `∠Y = ?`, staticX2 + Math.cos(Math.PI + staticTAngleRad / 2) * 45, y_bottom + Math.sin(Math.PI + staticTAngleRad / 2) * 45, isLight, "#2DD4BF");

    } else if (stage === "ri") {
      // ==========================================
      // STAGE 3 RENDERING: ROOF TRUSS CHALLENGE
      // ==========================================
      
      // Render static Architectural Blueprint background
      ctx.strokeStyle = isLight ? "rgba(15, 118, 110, 0.1)" : "rgba(38, 198, 180, 0.08)";
      ctx.lineWidth = 1;
      const diagonalGap = 20;
      for (let offset = -width; offset < width; offset += diagonalGap) {
        ctx.beginPath(); ctx.moveTo(offset, 0); ctx.lineTo(offset + height, height); ctx.stroke();
      }

      // Draw Main Horizontal Truss Beams
      const trussY_top = 100;
      const trussY_bottom = 230;
      ctx.strokeStyle = isLight ? "#0F766E" : "#26C6B4";
      ctx.lineWidth = 4;
      
      // Double outline for steel plate structural effect
      ctx.beginPath();
      ctx.moveTo(40, trussY_top - 2); ctx.lineTo(width - 40, trussY_top - 2);
      ctx.moveTo(40, trussY_top + 2); ctx.lineTo(width - 40, trussY_top + 2);
      ctx.moveTo(40, trussY_bottom - 2); ctx.lineTo(width - 40, trussY_bottom - 2);
      ctx.moveTo(40, trussY_bottom + 2); ctx.lineTo(width - 40, trussY_bottom + 2);
      ctx.stroke();

      // Truss Nodes coordinates
      const nodes = [
        { x: 80, y: trussY_bottom, label: "J1" },
        { x: 180, y: trussY_top, label: "J2" },
        { x: 280, y: trussY_bottom, label: "J3" },
        { x: 380, y: trussY_top, label: "J4" },
        { x: 480, y: trussY_bottom, label: "J5" }
      ];

      // Structural Diagonal struts
      ctx.strokeStyle = s3IsSecured ? "#10B981" : (isLight ? "#D97706" : "#F59E0B");
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, trussY_top);
      ctx.lineTo(80, trussY_bottom);
      ctx.lineTo(180, trussY_top);
      ctx.lineTo(280, trussY_bottom);
      ctx.lineTo(380, trussY_top);
      ctx.lineTo(480, trussY_bottom);
      ctx.lineTo(width - 40, trussY_top);
      ctx.stroke();

      // Secondary structural diagonals for roof trusses
      ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80, trussY_bottom); ctx.lineTo(180, trussY_bottom);
      ctx.moveTo(180, trussY_top); ctx.lineTo(280, trussY_top);
      ctx.moveTo(280, trussY_bottom); ctx.lineTo(380, trussY_bottom);
      ctx.moveTo(380, trussY_top); ctx.lineTo(480, trussY_top);
      ctx.stroke();

      // Render starting joint details: Given angle of 55° on left joint strut
      ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, trussY_top);
      ctx.arc(40, trussY_top, 25, 0, (55 * Math.PI) / 180);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      drawAngleBadge(ctx, `Given: ${s3StartAngle}°`, 100, trussY_top - 20, isLight, "#F59E0B");

      // Draw active joint pins (glow circles)
      nodes.forEach((n, i) => {
        const nodeCorrect = s3Status === "correct" || s3IsSecured;
        ctx.fillStyle = nodeCorrect ? "#10B981" : "#FF5722";
        ctx.shadowBlur = 10;
        ctx.shadowColor = nodeCorrect ? "#10B981" : "#FF5722";
        ctx.beginPath();
        ctx.arc(n.x, n.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset glow

        // Pin border
        ctx.strokeStyle = isLight ? "#0F172A" : "#F8FAFC";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 7, 0, Math.PI * 2);
        ctx.stroke();

        // Joint Label Badge
        const badgeY = n.y === trussY_top ? n.y - 18 : n.y + 18;
        ctx.font = "bold 9px IBM Plex Mono, monospace";
        ctx.fillStyle = nodeCorrect ? "#10B981" : "#FF5722";
        ctx.textAlign = "center";
        ctx.fillText(`${n.label} = ?`, n.x, badgeY);
      });
    }

  }, [stage, transversalAngle, railSpacing, theme, s1TargetConcept, s1SelectedSectors, s2Step, s3StartAngle, s3Inputs, s3Status, s3IsSecured]);

  const handleMouseDown = (e: MouseEvent) => {
    if (stage !== "shu") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width;
    const x1 = width / 2;
    const angleRad = (transversalAngle * Math.PI) / 180;
    const dx = Math.tan(angleRad) !== 0 ? railSpacing / Math.tan(angleRad) : 0;
    const x2 = x1 + dx;
    const y_bottom = 220;

    // Check distance to bottom slider handle
    const dist = Math.sqrt((mouseX - x2) * (mouseX - x2) + (mouseY - y_bottom) * (mouseY - y_bottom));
    if (dist < 18) {
      isDraggingRef.current = true;
      synth.playClick();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || stage !== "shu") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    const width = canvas.width;
    const x1 = width / 2;

    const clampedX = Math.max(120, Math.min(width - 120, mouseX));
    const dx = clampedX - x1;

    let angle = Math.atan2(railSpacing, dx) * (180 / Math.PI);
    if (angle < 0) angle += 180;

    const clampedAngle = Math.max(25, Math.min(155, angle));
    setTransversalAngle(clampedAngle);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stage !== "shu" || isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width;
    const x1 = width / 2;
    const y_top = 100;
    const y_bottom = y_top + railSpacing;

    const angleRad = (transversalAngle * Math.PI) / 180;
    const dx = Math.tan(angleRad) !== 0 ? railSpacing / Math.tan(angleRad) : 0;
    const x2 = x1 + dx;

    const clickedSector = getSectorFromClick(mouseX, mouseY, x1, y_top, x2, y_bottom, angleRad);
    if (clickedSector === null) return;

    synth.playClick();

    setS1SelectedSectors((prev) => {
      let next = [...prev];
      if (next.includes(clickedSector)) {
        // Deselect
        next = next.filter((s) => s !== clickedSector);
      } else {
        // Select
        next.push(clickedSector);
        if (next.length > 2) {
          next.shift(); // keep max 2
        }
      }

      // Check Match
      if (next.length === 2) {
        const match = checkS1Match(next[0], next[1]);
        if (match) {
          synth.playSuccess();
          confetti({ particleCount: 15, spread: 30, origin: { y: 0.6 } });
          
          const newlyCompleted = [...s1MasteredConcepts, s1TargetConcept];
          setS1CompletedConcepts(newlyCompleted);

          // Save dynamic KC to local storage
          if (s1TargetConcept === "corresponding") saveKCMastery("KC.4.2");
          if (s1TargetConcept === "alternate_interior") saveKCMastery("KC.4.3");
          if (s1TargetConcept === "co_interior") saveKCMastery("KC.4.4");

          if (s1TargetConcept === "corresponding") {
            setS1FeedbackText("Correct! Corresponding angles map to identical positions at top and bottom rails, meaning they are equivalent twins.");
            setS1TargetConcept("alternate_interior");
          } else if (s1TargetConcept === "alternate_interior") {
            setS1FeedbackText("Perfect! Alternate Interior angles form a Z-shape inside the rails on opposite sides of the transversal line. They are equal.");
            setS1TargetConcept("co_interior");
          } else if (s1TargetConcept === "co_interior") {
            setS1FeedbackText("Awesome! Co-Interior angles are on the same side inside the rails. They are supplementary and sum to exactly 180°.");
          }
          return []; // Clear selection on successful match
        } else {
          synth.playThud();
          setS1FeedbackText("Match failed! Try again or consult the highlighter cards.");
        }
      }
      return next;
    });
  };

  // Wire up event listeners
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
  }, [transversalAngle]);

  // Stage 2: Submit and Grade procedural steps
  const handleS2Verify = () => {
    if (s2Step === "B") {
      const ansX = parseFloat(s2InputB);
      if (!isNaN(ansX) && ansX === 115) {
        setS2Status("correct");
        setS2Feedback("Correct! Since supplementary angles on a line add to 180°, Angle X = 180 - 65 = 115°.");
        synth.playSuccess();
        saveKCMastery("KC.4.1");
      } else {
        setS2Status("incorrect");
        setS2Feedback("Incorrect. Remember: Adjacent supplementary angles must sum to 180°.");
        synth.playThud();
      }
    } else if (s2Step === "C") {
      const ansX = parseFloat(s2InputC_X);
      const ansY = parseFloat(s2InputC_Y);
      if (!isNaN(ansX) && !isNaN(ansY) && ansX === 60 && ansY === 120) {
        setS2Status("correct");
        setS2Feedback("Incredible! 180 - 120 = 60° for supplementary Angle X, and Angle Y = 120° alternate interior.");
        synth.playSuccess();
        saveKCMastery("KC.4.6");
        confetti({ particleCount: 30, spread: 45 });
      } else {
        setS2Status("incorrect");
        setS2Feedback("Incorrect calculations. Check your supplementary and alternate interior mappings.");
        synth.playThud();
      }
    }
  };

  // Stage 3: Civil Roof Truss balancing equation solver
  const handleS3Verify = () => {
    const J1 = parseFloat(s3Inputs[0]);
    const J2 = parseFloat(s3Inputs[1]);
    const J3 = parseFloat(s3Inputs[2]);
    const J4 = parseFloat(s3Inputs[3]);
    const J5 = parseFloat(s3Inputs[4]);

    const correct = [125, 55, 125, 55, 125]; // derived values using 180 - 55 = 125 and equal alternate joint translations

    if (
      !isNaN(J1) && J1 === correct[0] &&
      !isNaN(J2) && J2 === correct[1] &&
      !isNaN(J3) && J3 === correct[2] &&
      !isNaN(J4) && J4 === correct[3] &&
      !isNaN(J5) && J5 === correct[4]
    ) {
      setS3Status("correct");
      setS3IsSecured(true);
      setS3Feedback("Truss balance SECURED! Tensile stresses neutralized across struts. Excellent civil engineering calculations!");
      synth.playSuccess();
      saveKCMastery("KC.4.5"); // Transversal Invariance Principle
      const end = Date.now() + 1200;
      const frame = () => {
        confetti({ particleCount: 4, colors: ["#10B981", "#26C6B4"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else {
      setS3Status("incorrect");
      setS3Feedback("Load stress imbalance! Structural analysis failed. Tweak your calculated joint angles.");
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
            onClick={handleCanvasClick}
            className="w-full h-full block cursor-crosshair"
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
                ? `Solve Angle-Pair Sort: Match ${s1TargetConcept.replace("_", " ")}`
                : stage === "ha"
                ? `Scaffolded Calculation Step ${s2Step}`
                : s3IsSecured ? "Truss stress secured!" : "Balance diagonal trusses to secure safety limits."}
            </span>
          </div>
          <div className="text-vidya-accent-warm font-bold">
            {stage === "shu"
              ? `Mastered: ${s1MasteredConcepts.length}/3`
              : stage === "ha"
              ? `Progression: ${s2Step}/C`
              : s3IsSecured ? "STRESS 0%" : "STRESS CRITICAL"}
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
                      Stage 1: Angle-Pair Match
                    </h3>
                    <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                      Move the slider handle to observe transversal properties. Then complete our Category Sorting Game to unlock deduction!
                    </p>

                    <div className="mt-4 p-3 bg-vidya-accent/5 border border-vidya-accent/20 rounded-lg text-xs leading-relaxed font-mono relative">
                      <strong className="text-vidya-accent block mb-1 text-[10px] uppercase tracking-wider">ACTIVE CHALLENGE:</strong>
                      Match the pair of angles that correspond to:
                      <span className="text-vidya-accent-warm font-bold block text-sm mt-1 uppercase">
                        {s1TargetConcept.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 text-[11px] font-mono leading-relaxed text-vidya-text-muted">
                      {s1FeedbackText}
                    </div>

                    {s1MasteredConcepts.length === 3 && (
                      <div className="mt-4 p-2.5 bg-vidya-success/10 border border-vidya-success/30 rounded text-xs text-vidya-success font-mono">
                        ✓ All concept pairs classified successfully! Click Submit below to proceed.
                      </div>
                    )}
                  </div>
                )}

                {stage === "ha" && (
                  <div>
                    <h3 className="text-base font-display font-bold text-vidya-text flex items-center gap-2">
                      <Zap className="w-4 h-4 text-vidya-accent-warm" />
                      Stage 2: Faded Worked Examples
                    </h3>
                    <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                      Let's transition from visual matching to calculating. Fill in the faded blanks to build your angle-chasing skills:
                    </p>

                    {/* Step Cards */}
                    <div className="mt-4 space-y-4">
                      {s2Step === "A" && (
                        <div className="p-3.5 bg-vidya-surface-raised border border-vidya-border rounded-lg font-mono text-xs space-y-2">
                          <div className="text-vidya-accent font-bold">Step 2A: Fully Worked Example</div>
                          <div>Given Angle = <strong>70°</strong></div>
                          <div className="text-vidya-text-muted">
                            1. Supplementary adjacent Angle X: <br />
                            <span className="text-white font-semibold">180° - 70° = 110°</span>
                          </div>
                          <div className="text-vidya-text-muted">
                            2. Alternate Interior Angle Y: <br />
                            <span className="text-white font-semibold">Equals 70° identically</span>
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
                          <div>Given Angle = <strong>65°</strong></div>
                          <div>
                            Y is Alternate Interior, so Y is solved for you: <span className="text-vidya-accent font-semibold">65°</span>
                          </div>
                          <div>
                            <label className="block text-[10px] text-vidya-text-muted uppercase mb-1">Calculate Supplementary Angle X (deg):</label>
                            <input
                              type="text"
                              placeholder="180 - 65 = ?"
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
                          <div>Given Angle = <strong>120°</strong></div>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] text-vidya-text-muted uppercase mb-0.5">Calculate Angle X:</label>
                              <input
                                type="text"
                                placeholder="Supplementary X"
                                value={s2InputC_X}
                                onChange={(e) => setS2InputC_X(e.target.value)}
                                className="w-full py-1.5 px-2.5 border border-vidya-border bg-vidya-void text-vidya-text text-sm rounded outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-vidya-text-muted uppercase mb-0.5">Calculate Angle Y:</label>
                              <input
                                type="text"
                                placeholder="Alternate Interior Y"
                                value={s2InputC_Y}
                                onChange={(e) => setS2InputC_Y(e.target.value)}
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
                      Stage 3: Roof Truss Structural Challenge
                    </h3>
                    <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                      Given a diagonal strut angle of <span className="text-vidya-accent-warm font-semibold">{s3StartAngle}°</span>, solve the interconnected parallel joints below to neutralize bending shear limits:
                    </p>

                    <div className="mt-4 space-y-2.5 font-mono text-[11px]">
                      {["J1 (Supplementary)", "J2 (Alternate Interior)", "J3 (Equal to J1)", "J4 (Equal to J2)", "J5 (Equal to J1)"].map((label, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 bg-vidya-void p-1.5 rounded border border-vidya-border/40">
                          <span className="text-vidya-text-muted">{label}:</span>
                          <input
                            type="text"
                            placeholder="Angle (deg)"
                            value={s3Inputs[index]}
                            disabled={s3IsSecured}
                            onChange={(e) => {
                              const val = e.target.value;
                              setS3Inputs((prev) => {
                                const next = [...prev];
                                next[index] = val;
                                return next;
                              });
                            }}
                            className="w-20 text-center py-1 px-1.5 border border-vidya-border bg-vidya-surface text-vidya-text rounded outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    {s3Status !== "idle" && (
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
                        setS1SelectedSectors([]);
                        setS1FeedbackText("Classify corresponding, alternate, and co-interior angle-pairs!");
                      } else if (stage === "ri") {
                        setS2Step("C");
                        setS2Status("idle");
                        setS2InputC_X("");
                        setS2InputC_Y("");
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
                      if (s1MasteredConcepts.length < 3) return;
                      synth.playClick();
                      setS2Step("A");
                      setS2Status("idle");
                      setStage("ha");
                    }}
                    disabled={s1MasteredConcepts.length < 3}
                    className={`flex-1 py-3 font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      s1MasteredConcepts.length === 3
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
                            // Proceed to Stage 3
                            setStage("ri");
                            setS3Status("idle");
                            setS3Inputs(["", "", "", "", ""]);
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
                        className="flex-1 py-3 bg-gradient-to-r from-vidya-accent-warm to-vidya-accent-warm-strong text-vidya-void font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        Analyze & Balance Truss
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
                  Identify Alternate Interior, Corresponding, and Co-Interior pairs on the diagram above.
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
                  Using parallel line rules, solve Joint angles 1 to 5 to secure structural safety.
                </p>
              )}
              {stage === "ri" && s3IsSecured && (
                <p className="text-[10px] text-vidya-success text-center font-mono animate-pulse">
                  Load balanced! Sequence complete. Claim your token!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
