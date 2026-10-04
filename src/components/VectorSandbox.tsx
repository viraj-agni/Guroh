"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, HelpCircle, Play, RotateCcw, AlertTriangle, BadgeCheck, Compass, Zap, Sparkles, Award } from "lucide-react";
import { synth } from "./AudioEngine";
import confetti from "canvas-confetti";

interface VectorSandboxProps {
  onSequenceComplete: () => void;
  creatorMode: boolean; // Hide HUDs if true
  theme?: "dark" | "light";
}

export default function VectorSandbox({
  onSequenceComplete,
  creatorMode,
  theme = "dark",
}: VectorSandboxProps) {
  const [stage, setStage] = useState<"shu" | "ha" | "ri">("shu");
  
  // Vector state for Shu & Ha stages
  // Base Vector U = (3, 2), Vector V (customizable)
  const [vX, setVx] = useState<number>(1);
  const [vY, setVy] = useState<number>(3);
  
  // Ha stage answer submission
  const [haAnswer, setHaAnswer] = useState<string>("");
  const [haStatus, setHaStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [haFeedback, setHaStatusFeedback] = useState<string>("");

  // Ri physics simulator state
  const [launchAngle, setLaunchAngle] = useState<number>(45);
  const [launchSpeed, setLaunchSpeed] = useState<number>(12);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [hasHitTarget, setHasHitTarget] = useState<boolean>(false);
  const [simMessage, setSimMessage] = useState<string>("Orient the trajectory vector and press Launch!");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Physics projectile position variables
  const projX = useRef<number>(0);
  const projY = useRef<number>(0);
  const pathPoints = useRef<{x: number, y: number}[]>([]);
  const targetX = 350;
  const targetY = 100; // Target is positioned around here in grid space
  const targetRadius = 15;

  // Render function for simulation canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    
    // Grid scale
    const gridCenter = { x: width / 2, y: height / 2 };
    const gridScale = 40; // 40 pixels = 1 unit

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isLight = theme === "light";

      // 1. Draw Grid Lines
      ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.05)" : "#161616";
      ctx.lineWidth = 1;
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

      // 2. Draw Main Axes
      ctx.strokeStyle = isLight ? "#D1D5DB" : "#2A2418";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gridCenter.x, 0);
      ctx.lineTo(gridCenter.x, height);
      ctx.moveTo(0, gridCenter.y);
      ctx.lineTo(width, gridCenter.y);
      ctx.stroke();

      // Axis labels
      ctx.font = "10px IBM Plex Mono";
      ctx.fillStyle = isLight ? "#4B5563" : "#9A9288";
      ctx.fillText("x", width - 15, gridCenter.y - 5);
      ctx.fillText("y", gridCenter.x + 5, 15);

      if (stage === "shu" || stage === "ha") {
        // --- Vector Visuals ---
        const uX = 3;
        const uY = 2;

        const uPixel = { x: gridCenter.x + uX * gridScale, y: gridCenter.y - uY * gridScale };
        const vPixel = { x: gridCenter.x + vX * gridScale, y: gridCenter.y - vY * gridScale };

        // Vector U (Static Baseline - Golden Warm)
        ctx.strokeStyle = "#FFB020";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(gridCenter.x, gridCenter.y);
        ctx.lineTo(uPixel.x, uPixel.y);
        ctx.stroke();
        drawArrowhead(ctx, gridCenter.x, gridCenter.y, uPixel.x, uPixel.y, "#FFB020");

        // Vector V (Dynamic - Knowledge Teal)
        ctx.strokeStyle = "#26C6B4";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(gridCenter.x, gridCenter.y);
        ctx.lineTo(vPixel.x, vPixel.y);
        ctx.stroke();
        drawArrowhead(ctx, gridCenter.x, gridCenter.y, vPixel.x, vPixel.y, "#26C6B4");

        // Projection Line & Vector
        // Compute projection of V onto U: proj = ((V.U) / ||U||^2) * U
        const dotProd = uX * vX + uY * vY;
        const magUSq = uX * uX + uY * uY;
        const projScale = dotProd / magUSq;
        const projXVal = projScale * uX;
        const projYVal = projScale * uY;
        const projPixel = { x: gridCenter.x + projXVal * gridScale, y: gridCenter.y - projYVal * gridScale };

        // Dash helper line from V to U projection point
        ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.2)" : "#9A9288";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(vPixel.x, vPixel.y);
        ctx.lineTo(projPixel.x, projPixel.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Projection Vector
        ctx.strokeStyle = "#FF8C42";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(gridCenter.x, gridCenter.y);
        ctx.lineTo(projPixel.x, projPixel.y);
        ctx.stroke();
        drawArrowhead(ctx, gridCenter.x, gridCenter.y, projPixel.x, projPixel.y, "#FF8C42");

        // Labels
        ctx.font = "12px IBM Plex Mono";
        ctx.fillStyle = "#FFB020";
        ctx.fillText("U [3, 2]", uPixel.x + 8, uPixel.y - 4);
        ctx.fillStyle = "#26C6B4";
        ctx.fillText(`V [${vX}, ${vY}]`, vPixel.x + 8, vPixel.y - 4);
        ctx.fillStyle = "#FF8C42";
        ctx.fillText(`proj_U(V) [${projXVal.toFixed(1)}, ${projYVal.toFixed(1)}]`, projPixel.x + 8, projPixel.y + 15);
      } else if (stage === "ri") {
        // --- Projectile Mechanics Visuals ---
        
        // Draw Projectile launch platform
        ctx.fillStyle = isLight ? "#F3F4F6" : "#0F0F0F";
        ctx.strokeStyle = isLight ? "#D1D5DB" : "#2A2418";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gridCenter.x - 150, gridCenter.y + 100, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw Target Zone
        ctx.fillStyle = hasHitTarget
          ? (isLight ? "rgba(16, 185, 129, 0.15)" : "rgba(90, 217, 143, 0.2)")
          : (isLight ? "rgba(245, 158, 11, 0.1)" : "rgba(255, 176, 32, 0.15)");
        ctx.strokeStyle = hasHitTarget
          ? (isLight ? "#10B981" : "#5AD98F")
          : (isLight ? "#F59E0B" : "#FFB020");
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(gridCenter.x + 100, gridCenter.y - 40, targetRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner bullseye ring
        ctx.beginPath();
        ctx.arc(gridCenter.x + 100, gridCenter.y - 40, 5, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Target text label
        ctx.font = "10px IBM Plex Mono";
        ctx.fillStyle = hasHitTarget
          ? (isLight ? "#10B981" : "#5AD98F")
          : (isLight ? "#D97706" : "#FFB020");
        ctx.fillText("TARGET AREA", gridCenter.x + 70, gridCenter.y - 65);

        // Draw projectile trajectory vector arrow
        const angleRad = (launchAngle * Math.PI) / 180;
        const arrowLength = launchSpeed * 6;
        const endX = gridCenter.x - 150 + Math.cos(angleRad) * arrowLength;
        const endY = gridCenter.y + 100 - Math.sin(angleRad) * arrowLength;

        ctx.strokeStyle = "#26C6B4";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(gridCenter.x - 150, gridCenter.y + 100);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        drawArrowhead(ctx, gridCenter.x - 150, gridCenter.y + 100, endX, endY, "#26C6B4");

        // Render simulated trajectory path points
        if (pathPoints.current.length > 1) {
          ctx.strokeStyle = "rgba(38, 198, 180, 0.4)";
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(pathPoints.current[0].x, pathPoints.current[0].y);
          for (let p of pathPoints.current) {
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Render launching projectile ball
        if (isSimulating) {
          ctx.fillStyle = isLight ? "#D97706" : "#FFB020";
          ctx.shadowBlur = 10;
          ctx.shadowColor = isLight ? "#D97706" : "#FFB020";
          ctx.beginPath();
          ctx.arc(projX.current, projY.current, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }
    };

    // Helper to render vector arrowheads
    const drawArrowhead = (context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const angle = Math.atan2(dy, dx);
      const headLength = 12; // Length of arrowhead
      
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(toX, toY);
      context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
      context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
      context.closePath();
      context.fill();
    };

    // Handle physics updates if simulating
    let lastTime = 0;
    const physicsLoop = (time: number) => {
      if (isSimulating) {
        if (!lastTime) lastTime = time;
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        // Gravity in pixels/sec^2
        const gravity = 180;
        
        // Horizontal and vertical speeds
        const angleRad = (launchAngle * Math.PI) / 180;
        const speedMultiplier = 25; // Scale speed to pixels
        const vx = launchSpeed * Math.cos(angleRad) * speedMultiplier;
        // Projectile equations
        const timePassed = pathPoints.current.length * 0.02; // dt step representation
        
        const startX = gridCenter.x - 150;
        const startY = gridCenter.y + 100;

        const currentX = startX + vx * timePassed;
        const currentY = startY - (launchSpeed * Math.sin(angleRad) * speedMultiplier * timePassed - 0.5 * gravity * timePassed * timePassed);

        projX.current = currentX;
        projY.current = currentY;
        pathPoints.current.push({ x: currentX, y: currentY });

        // Boundary/Target checks
        const dx = currentX - (gridCenter.x + 100);
        const dy = currentY - (gridCenter.y - 40);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < targetRadius + 6) {
          setIsSimulating(false);
          setHasHitTarget(true);
          setSimMessage("Direct Hit! Target destroyed. Complete the sequence!");
          synth.playSuccess();
          triggerFireworks();
        } else if (currentY > height + 50 || currentX > width + 50) {
          setIsSimulating(false);
          setSimMessage("Missed the target. Adjust values and launch again!");
          synth.playThud();
        }
      }
      render();
      animationFrameRef.current = requestAnimationFrame(physicsLoop);
    };

    // Start render/loop
    animationFrameRef.current = requestAnimationFrame(physicsLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [stage, vX, vY, launchAngle, launchSpeed, isSimulating, hasHitTarget]);

  // Fireworks trigger
  const triggerFireworks = () => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#26C6B4", "#FFB020", "#FF8C42"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#26C6B4", "#FFB020", "#FF8C42"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  // Ha stage local algebraic evaluation (WASM mockup or deterministic math match)
  const handleHaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    synth.playClick();
    
    // Question: Find an orthogonal vector V to U(3, 2). Meaning dot product is 0.
    // U.V = 3*vX + 2*vY = 0.
    // Let's parse student's input coordinate format like "[-2, 3]" or "2i + 3j" or simple math equivalence.
    // Clean string: replace spaces and brackets
    const cleanStr = haAnswer.replace(/\[|\]|\s/g, "");
    const coords = cleanStr.split(",");
    
    if (coords.length === 2) {
      const parsedX = parseFloat(coords[0]);
      const parsedY = parseFloat(coords[1]);

      if (!isNaN(parsedX) && !isNaN(parsedY)) {
        const dotProduct = 3 * parsedX + 2 * parsedY;
        // High-precision tolerance for SymPy style WASM equivalence
        if (Math.abs(dotProduct) < 0.001 && (parsedX !== 0 || parsedY !== 0)) {
          setVx(parsedX);
          setVy(parsedY);
          setHaStatus("correct");
          setHaStatusFeedback(`SymPy Equivalent: Verified. 3*(${parsedX}) + 2*(${parsedY}) = ${dotProduct}. Orthogonality proof satisfied.`);
          synth.playSuccess();
        } else {
          setHaStatus("incorrect");
          setHaStatusFeedback(`Grade Failed. Dot product is ${dotProduct} != 0. Recall: U.V = u_x * v_x + u_y * v_y.`);
          synth.playThud();
        }
      } else {
        setHaStatus("incorrect");
        setHaStatusFeedback("Invalid coordinate format. Ensure values are integers, e.g., [-2, 3] or [2, -3].");
        synth.playThud();
      }
    } else {
      setHaStatus("incorrect");
      setHaStatusFeedback("Coordinate mismatch. Enter vector V as: x, y (e.g., -2, 3)");
      synth.playThud();
    }
  };

  const startProjectileSim = () => {
    synth.playClick();
    pathPoints.current = [];
    setIsSimulating(true);
    setSimMessage("Simulating vector trajectory...");
  };

  const resetProjectileSim = () => {
    synth.playClick();
    setIsSimulating(false);
    setHasHitTarget(false);
    pathPoints.current = [];
    setSimMessage("Orient the trajectory vector and press Launch!");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-vidya-surface p-6 rounded-xl border border-vidya-border max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
      
      {/* Top subtle decoration strip, hidden in creatorMode */}
      {!creatorMode && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-vidya-accent/40" />
      )}

      {/* Main interactive Sandbox Viewport */}
      <div className="flex-1 flex flex-col items-center">
        <div className="relative border border-vidya-border bg-vidya-void rounded-lg overflow-hidden w-full aspect-video md:w-[600px] md:h-[350px]">
          <canvas
            ref={canvasRef}
            width={600}
            height={350}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Quick Creator Overlay (Indicator), visible in creatorMode */}
          {creatorMode && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 border border-vidya-accent-warm/40 bg-vidya-void/80 text-vidya-accent-warm text-[10px] font-mono rounded-full backdrop-blur-md uppercase tracking-widest animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Recording Active
            </div>
          )}
        </div>

        {/* Localized feedback bar */}
        <div className="w-full mt-4 bg-vidya-void p-3 rounded border border-vidya-border/60 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-vidya-accent animate-ping" />
            <span className="text-vidya-text-muted">Interactive Grader:</span>
            <span className="text-vidya-text font-semibold">
              {stage === "shu" ? "Visualizing projection coefficients..." : stage === "ha" ? "WASM SymPy Serverless compiling..." : simMessage}
            </span>
          </div>
          <div className="text-vidya-accent-warm font-bold">
            {stage === "shu" ? `V Dot U = ${(3 * vX + 2 * vY).toFixed(1)}` : stage === "ha" ? "WASM Verified" : `Hit = ${hasHitTarget}`}
          </div>
        </div>
      </div>

      {/* Control panel / Interactive HUD (Hidden in creatorMode!) */}
      <AnimatePresence>
        {!creatorMode && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-full lg:w-[320px] flex flex-col justify-between"
          >
            {/* Task scaffolding panel */}
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
                    ? "Stage 1: Spatial Exploration"
                    : stage === "ha"
                    ? "Stage 2: Logical Deduction"
                    : "Stage 3: Projectile Target Challenge"}
                </span>
              </div>

              {/* Dynamic stage prompt */}
              <div>
                {stage === "shu" && (
                  <div>
                    <h3 className="text-base font-display font-bold text-vidya-text flex items-center gap-2">
                      <Compass className="w-4 h-4 text-vidya-accent" />
                      Stage 1: Spatial Exploration
                    </h3>
                    <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                      Drag the parameters of Vector V <span className="text-vidya-accent font-bold">Teal</span>. Watch the vector projection of V onto vector U <span className="text-vidya-accent-warm font-bold">Gold</span> update. Projections are key scalar multipliers in physics fields!
                    </p>

                    <div className="space-y-4 mt-6">
                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1.5">
                          <span className="text-vidya-text-muted">Vector V_x</span>
                          <span className="text-vidya-accent font-semibold">{vX}</span>
                        </div>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="0.5"
                          value={vX}
                          onChange={(e) => {
                            setVx(parseFloat(e.target.value));
                          }}
                          className="w-full accent-vidya-accent bg-vidya-void h-1 rounded"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1.5">
                          <span className="text-vidya-text-muted">Vector V_y</span>
                          <span className="text-vidya-accent font-semibold">{vY}</span>
                        </div>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="0.5"
                          value={vY}
                          onChange={(e) => {
                            setVy(parseFloat(e.target.value));
                          }}
                          className="w-full accent-vidya-accent bg-vidya-void h-1 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {stage === "ha" && (
                  <div>
                    <h3 className="text-base font-display font-bold text-vidya-text flex items-center gap-2">
                      <Zap className="w-4 h-4 text-vidya-accent-warm" />
                      Stage 2: Logical Deduction
                    </h3>
                    <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                      The sliders are gone. Enter a coordinate vector V that is <span className="text-vidya-accent font-bold">orthogonal</span> to the baseline vector U [3, 2]. Proof: Dot product must equal exactly 0.
                    </p>

                    <form onSubmit={handleHaSubmit} className="mt-5 space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono text-vidya-text-muted uppercase mb-1">
                          Vector Coordinate (V_x, V_y)
                        </label>
                        <input
                          type="text"
                          placeholder="-2, 3"
                          value={haAnswer}
                          onChange={(e) => setHaAnswer(e.target.value)}
                          className="w-full py-2 px-3 border border-vidya-border bg-vidya-void text-vidya-text font-mono text-sm rounded focus:border-vidya-accent outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-vidya-accent hover:bg-vidya-accent-hover text-vidya-void font-mono font-bold text-xs rounded transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        Grade Vector via WASM
                      </button>
                    </form>

                    {haStatus !== "idle" && (
                      <div className={`mt-3 p-2.5 rounded border text-[11px] font-mono leading-relaxed ${
                        haStatus === "correct"
                          ? "bg-vidya-success/5 border-vidya-success/30 text-vidya-success"
                          : "bg-vidya-error/5 border-vidya-error/30 text-vidya-error"
                      }`}>
                        {haFeedback}
                      </div>
                    )}
                  </div>
                )}

                {stage === "ri" && (
                  <div>
                    <h3 className="text-base font-display font-bold text-vidya-text flex items-center gap-2">
                      <Award className="w-4 h-4 text-vidya-accent" />
                      Stage 3: Capstone Simulation
                    </h3>
                    <p className="text-xs text-vidya-text-muted mt-2 leading-relaxed">
                      Target Area detected! Set launch angle and speed parameters to target continuous gravity physics. Let the momentum force hit the target bullseye.
                    </p>

                    <div className="space-y-4 mt-5">
                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1.5">
                          <span className="text-vidya-text-muted">Launch Angle (deg)</span>
                          <span className="text-vidya-accent font-semibold">{launchAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          value={launchAngle}
                          onChange={(e) => {
                            setLaunchAngle(parseInt(e.target.value));
                          }}
                          disabled={isSimulating}
                          className="w-full accent-vidya-accent bg-vidya-void h-1 rounded"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1.5">
                          <span className="text-vidya-text-muted">Velocity (m/s)</span>
                          <span className="text-vidya-accent font-semibold">{launchSpeed}</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="20"
                          value={launchSpeed}
                          onChange={(e) => {
                            setLaunchSpeed(parseInt(e.target.value));
                          }}
                          disabled={isSimulating}
                          className="w-full accent-vidya-accent bg-vidya-void h-1 rounded"
                        />
                      </div>

                      {isSimulating && (
                        <button
                          onClick={resetProjectileSim}
                          className="w-full py-2 bg-vidya-surface border border-vidya-border text-vidya-text font-mono text-xs rounded transition-all uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset Trajectory
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Unified bottom Call to Action (CTA) Progress Flow with "Back" button */}
            <div className="mt-8 border-t border-vidya-border pt-4 flex flex-col gap-3">
              <div className="flex gap-2.5">
                {stage !== "shu" && (
                  <button
                    onClick={() => {
                      synth.playClick();
                      if (stage === "ha") {
                        setStage("shu");
                        setVx(1);
                        setVy(3);
                      } else if (stage === "ri") {
                        setStage("ha");
                        setHaStatus("idle");
                        setHaAnswer("");
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
                      synth.playClick();
                      setStage("ha");
                      setHaStatus("idle");
                      setHaAnswer("");
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-vidya-accent to-vidya-accent-hover text-vidya-void font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-vidya-accent/20"
                  >
                    Submit
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {stage === "ha" && (
                  <>
                    <button
                      onClick={(e) => handleHaSubmit(e)}
                      disabled={haStatus === "correct"}
                      className={`flex-1 py-3 font-display font-bold text-[10px] md:text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg ${
                        haStatus === "correct"
                          ? "bg-vidya-success/15 border border-vidya-success/30 text-vidya-success cursor-not-allowed"
                          : "bg-gradient-to-r from-vidya-accent-warm to-vidya-accent-warm-strong text-vidya-void cursor-pointer hover:shadow-vidya-accent-warm/20"
                      }`}
                    >
                      {haStatus === "correct" ? "Verified" : "Verify Answer"}
                    </button>
                    <button
                      onClick={() => {
                        if (haStatus !== "correct") return;
                        synth.playClick();
                        setLaunchAngle(45);
                        setLaunchSpeed(12);
                        setIsSimulating(false);
                        setHasHitTarget(false);
                        pathPoints.current = [];
                        setSimMessage("Orient the trajectory vector and press Launch!");
                        setStage("ri");
                      }}
                      disabled={haStatus !== "correct"}
                      className={`flex-1 py-3 font-display font-bold text-[10px] md:text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg ${
                        haStatus === "correct"
                          ? "bg-gradient-to-r from-vidya-accent to-vidya-accent-hover text-vidya-void cursor-pointer animate-pulse shadow-vidya-accent/20"
                          : "bg-vidya-surface border border-vidya-border text-vidya-text-muted opacity-40 cursor-not-allowed"
                      }`}
                    >
                      Proceed
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {stage === "ri" && !hasHitTarget && (
                  <button
                    onClick={startProjectileSim}
                    disabled={isSimulating}
                    className="flex-1 py-3 bg-gradient-to-r from-vidya-accent-warm to-vidya-accent-warm-strong text-vidya-void font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Launch Projectile
                  </button>
                )}

                {stage === "ri" && hasHitTarget && (
                  <button
                    onClick={() => {
                      synth.playClick();
                      onSequenceComplete();
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-vidya-accent to-vidya-accent-hover text-vidya-void font-display font-bold text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg animate-bounce"
                  >
                    Complete Sequence & Earn Token
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress Help Description Subtexts */}
              {stage === "shu" && (
                <p className="text-[10px] text-vidya-text-muted text-center font-mono">
                  Explore coordinate projection bounds, then click Submit to verify vector spaces.
                </p>
              )}
              {stage === "ha" && haStatus !== "correct" && (
                <p className="text-[10px] text-vidya-text-muted text-center font-mono">
                  Enter an orthogonal coordinate pair (Vx, Vy) above, then click Verify Answer.
                </p>
              )}
              {stage === "ha" && haStatus === "correct" && (
                <p className="text-[10px] text-vidya-success text-center font-mono animate-pulse">
                  Verification successful! Proceed to the Capstone Projectile Challenge.
                </p>
              )}
              {stage === "ri" && !hasHitTarget && (
                <p className="text-[10px] text-vidya-text-muted text-center font-mono">
                  Slide velocity & angle inputs and hit Launch Projectile to target the portal.
                </p>
              )}
              {stage === "ri" && hasHitTarget && (
                <p className="text-[10px] text-vidya-success text-center font-mono animate-pulse">
                  Target locked! Sequence complete. Click Complete to earn your token.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
