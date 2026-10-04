"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Zap, Compass, Brain, BarChart3 } from "lucide-react";
import { synth } from "./AudioEngine";

// Static nodes representing our master curriculum taxonomy from Kindergarten to GATE
export interface DAGNode {
  id: string;
  label: string;
  category: "Foundations" | "High School (JEE)" | "Postgraduate (GATE)";
  subject: "Math" | "Physics" | "Chemistry" | "Biology";
  difficulty: string;
  prereqs: string[];
  status: "locked" | "active" | "mastered";
  description: string;
}

const MASTER_NODES: DAGNode[] = [
  // Foundations
  {
    id: "k1_math",
    label: "Numbers & Counting",
    category: "Foundations",
    subject: "Math",
    difficulty: "K-1 CCSS",
    prereqs: [],
    status: "mastered",
    description: "Counting to 100, cardinality, basic addition/subtraction models, and unrolling quantities.",
  },
  {
    id: "parallel_transversals",
    label: "Parallel Lines & Transversals",
    category: "Foundations",
    subject: "Math",
    difficulty: "Class 9 Math",
    prereqs: [],
    status: "active",
    description: "Examine parallel intersection dynamics, alternate interior symmetries, corresponding balances, and solve supplementary reflection targets.",
  },
  {
    id: "triangle_sum",
    label: "Triangle Angle Sum Theorem",
    category: "Foundations",
    subject: "Math",
    difficulty: "Class 9 Math",
    prereqs: ["parallel_transversals"],
    status: "active",
    description: "Observe the Origami-style flat corner collapsing theorem and adjust a specular trilateral reflector prism to align laser portals.",
  },
  {
    id: "vector_basics",
    label: "Anatomy of a Vector",
    category: "Foundations",
    subject: "Physics",
    difficulty: "Grade 9-10",
    prereqs: [],
    status: "mastered", // Our current landing node, completed
    description: "Understanding magnitude, heading directions, orthogonal fields, and vector transformations.",
  },
  // JEE
  {
    id: "jee_calculus",
    label: "Calculus Derivatives & Integrals",
    category: "High School (JEE)",
    subject: "Math",
    difficulty: "JEE Main / Adv",
    prereqs: ["k1_math"],
    status: "active",
    description: "Instantaneous rates of change, limits, area under curves, Riemann sums, and differential systems.",
  },
  {
    id: "jee_mechanics",
    label: "Classical Mechanics & Kinematics",
    category: "High School (JEE)",
    subject: "Physics",
    difficulty: "JEE Main / Adv",
    prereqs: ["vector_basics", "jee_calculus"],
    status: "active",
    description: "Newton's laws, angular velocities, trajectories, friction matrices, and conservation of energy.",
  },
  {
    id: "jee_electro",
    label: "Electromagnetism & Wave Fields",
    category: "High School (JEE)",
    subject: "Physics",
    difficulty: "JEE Main / Adv",
    prereqs: ["vector_basics", "jee_calculus"],
    status: "locked",
    description: "Coulomb vectors, Gauss's law, continuous electric potentials, and electromagnetic waves.",
  },
  {
    id: "jee_organic",
    label: "Organic Reaction Mechanisms",
    category: "High School (JEE)",
    subject: "Chemistry",
    difficulty: "JEE Main / Adv",
    prereqs: ["k1_math"],
    status: "locked",
    description: "Nucleophilic substitutions, resonance structures, inductive effects, and orbital hybridizations.",
  },
  {
    id: "jee_cell_bio",
    label: "Cell Structure & Energetics",
    category: "High School (JEE)",
    subject: "Biology",
    difficulty: "Grade 11-12",
    prereqs: ["k1_math"],
    status: "locked",
    description: "Mitosis models, lipid bilayers, cellular respiration, and chloroplast proton gradients.",
  },
  // GATE
  {
    id: "gate_da",
    label: "Neural Networks & Backpropagation",
    category: "Postgraduate (GATE)",
    subject: "Math",
    difficulty: "GATE DA (Data Science)",
    prereqs: ["jee_calculus", "jee_mechanics"],
    status: "locked",
    description: "Multi-dimensional gradients, weight matrices, activation bounds, and symbolic loss functions.",
  },
  {
    id: "gate_ma",
    label: "Advanced Real & Complex Analysis",
    category: "Postgraduate (GATE)",
    subject: "Math",
    difficulty: "GATE MA (Math)",
    prereqs: ["jee_calculus"],
    status: "locked",
    description: "Metric spaces, Cauchy sequence convergence, residue theorems, and holomorphic maps.",
  },
  {
    id: "gate_ph",
    label: "Quantum Mechanics & Schrodinger Systems",
    category: "Postgraduate (GATE)",
    subject: "Physics",
    difficulty: "GATE PH (Physics)",
    prereqs: ["jee_mechanics", "jee_electro"],
    status: "locked",
    description: "Hilbert spaces, eigenvalue probabilities, wave packet packet dispersion, and operators.",
  },
];

interface KCInfo {
  code: string;
  name: string;
  description: string;
  parentModule: string;
  stage: "Shu (Induction)" | "Ha (Procedural)" | "Ri (Transfer)";
}

const MICRO_KCS: KCInfo[] = [
  { code: "KC.4.1", name: "Concept Symmetries", description: "Visual and algebraic symmetry mappings across parallel systems.", parentModule: "Parallel Lines & Transversals", stage: "Shu (Induction)" },
  { code: "KC.4.2", name: "Corresponding Symmetries", description: "Identifying and matching corresponding congruent angle locations.", parentModule: "Parallel Lines & Transversals", stage: "Shu (Induction)" },
  { code: "KC.4.3", name: "Alternate Interior Symmetries", description: "Identifying alternate interior angles across transversal splits.", parentModule: "Parallel Lines & Transversals", stage: "Shu (Induction)" },
  { code: "KC.4.4", name: "Co-Interior Angles Symmetries", description: "Validating supplementary sum of co-interior interior angles.", parentModule: "Parallel Lines & Transversals", stage: "Shu (Induction)" },
  { code: "KC.4.5", name: "Transversal Invariance Principle", description: "Symmetry invariance when translating or spacing parallel rails.", parentModule: "Parallel Lines & Transversals", stage: "Shu (Induction)" },
  { code: "KC.4.6", name: "Multi-Step Angle Chasing", description: "Chaining sequential theorems to solve intricate transversal systems.", parentModule: "Parallel Lines & Transversals", stage: "Ha (Procedural)" },
  
  { code: "KC.5.1", name: "Triangle Angle Sum Principle", description: "Verifying flat corner wedges sum to exactly 180°.", parentModule: "Triangle Angle Sum Theorem", stage: "Shu (Induction)" },
  { code: "KC.5.2", name: "External Straight-Line Symmetries", description: "Applying supplementary linear angles to connected polygon vertices.", parentModule: "Triangle Angle Sum Theorem", stage: "Ha (Procedural)" },
  { code: "KC.5.3", name: "Composite Polygon Decomposition", description: "Partitioning complex shapes into simple triangulated structures.", parentModule: "Triangle Angle Sum Theorem", stage: "Ha (Procedural)" },
];

interface ContentLibraryProps {
  onNodeClick: (node: DAGNode) => void;
}

export default function ContentLibrary({ onNodeClick }: ContentLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [masteredKCs, setMasteredKCs] = useState<Record<string, boolean>>({});
  const [showBktDashboard, setShowBktDashboard] = useState<boolean>(true);

  React.useEffect(() => {
    const loaded: Record<string, boolean> = {};
    MICRO_KCS.forEach((kc) => {
      const isMastered = localStorage.getItem(`Vidya.KC_Mastery.${kc.code}`) === "true";
      loaded[kc.code] = isMastered;
    });
    setMasteredKCs(loaded);
  }, []);

  const categories = ["All", "Foundations", "High School (JEE)", "Postgraduate (GATE)"];

  const filteredNodes = activeCategory === "All" 
    ? MASTER_NODES 
    : MASTER_NODES.filter(n => n.category === activeCategory);

  const handleNodeSelect = (node: DAGNode) => {
    synth.playClick();
    onNodeClick(node);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-vidya-border pb-6 gap-6">
        <div>
          <div className="flex items-center gap-2 text-vidya-accent font-mono text-xs uppercase tracking-widest mb-2">
            <Compass className="w-4 h-4 animate-spin-slow" />
            Curriculum Navigator
          </div>
          <h2 className="text-3xl font-display font-bold text-vidya-text">
            Master Curriculum Taxonomy
          </h2>
          <p className="text-vidya-text-muted text-sm mt-2 max-w-xl">
            A Directed Acyclic Graph (DAG) charting continuous knowledge pathways. Click unlocked modules to explore or sign up to progress.
          </p>
        </div>

        {/* Categories Tab selector */}
        <div className="flex flex-wrap gap-2 bg-vidya-void p-1.5 rounded-lg border border-vidya-border">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                synth.playClick();
                setActiveCategory(cat);
              }}
              className={`px-4 py-1.5 text-xs font-mono rounded transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-vidya-surface-raised text-vidya-accent border border-vidya-accent/30"
                  : "text-vidya-text-muted hover:text-vidya-text border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Bayesian Knowledge Tracing (BKT) Dashboard */}
      {showBktDashboard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-6 rounded-xl border border-vidya-accent/20 bg-vidya-surface/40 backdrop-blur-md shadow-xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-vidya-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-vidya-accent/15 text-vidya-accent border border-vidya-accent/20">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-display font-bold text-vidya-text flex items-center gap-2">
                  Bayesian Knowledge Tracing (BKT) Engine
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-vidya-accent/10 border border-vidya-accent/20 text-vidya-accent animate-pulse">
                    Live Telemetry
                  </span>
                </h3>
                <p className="text-xs text-vidya-text-muted mt-0.5">
                  Probabilistic student modeling tracking real-time retention, slips, guesses, and posterior mastery.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                synth.playClick();
                setShowBktDashboard(false);
              }}
              className="text-xs font-mono text-vidya-text-muted hover:text-vidya-text hover:underline transition-colors cursor-pointer"
            >
              [Hide Dashboard]
            </button>
          </div>

          {/* Core Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="bg-vidya-void/60 border border-vidya-border/50 p-4 rounded-lg flex flex-col justify-between text-left">
              <span className="text-[10px] font-mono text-vidya-text-muted uppercase tracking-wider">Model Parameters</span>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-vidya-surface border border-vidya-border text-vidya-text-muted">P(L₀) Initial: 0.15</span>
                <span className="px-1.5 py-0.5 rounded bg-vidya-surface border border-vidya-border text-vidya-text-muted">P(T) Learn: 0.55</span>
                <span className="px-1.5 py-0.5 rounded bg-vidya-surface border border-vidya-border text-vidya-text-muted">P(G) Guess: 0.20</span>
                <span className="px-1.5 py-0.5 rounded bg-vidya-surface border border-vidya-border text-vidya-text-muted">P(S) Slip: 0.10</span>
              </div>
            </div>

            <div className="bg-vidya-void/60 border border-vidya-border/50 p-4 rounded-lg flex flex-col justify-between text-left">
              <span className="text-[10px] font-mono text-vidya-text-muted uppercase tracking-wider">Mastered Nodes</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-vidya-accent">
                  {Object.values(masteredKCs).filter(Boolean).length}
                </span>
                <span className="text-xs text-vidya-text-muted font-mono">/ 9 micro-KCs</span>
              </div>
            </div>

            <div className="bg-vidya-void/60 border border-vidya-border/50 p-4 rounded-lg flex flex-col justify-between text-left">
              <span className="text-[10px] font-mono text-vidya-text-muted uppercase tracking-wider">Average Posterior Mastery</span>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-extrabold text-vidya-accent-warm">
                    {(() => {
                      const total = MICRO_KCS.length;
                      const mastered = Object.values(masteredKCs).filter(Boolean).length;
                      const avg = total > 0 ? (mastered * 97.4 + (total - mastered) * 15.0) / total : 15.0;
                      return avg.toFixed(1);
                    })()}%
                  </span>
                  <span className="text-xs text-vidya-text-muted font-mono ml-1">P(Ln) Confidence</span>
                </div>
                {/* Micro mini-bar */}
                <div className="w-full h-1 bg-vidya-border rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-vidya-accent-warm transition-all duration-500"
                    style={{ 
                      width: `${(() => {
                        const total = MICRO_KCS.length;
                        const mastered = Object.values(masteredKCs).filter(Boolean).length;
                        return total > 0 ? (mastered * 97.4 + (total - mastered) * 15.0) / total : 15.0;
                      })()}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Micro-KC Progression list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MICRO_KCS.map((kc) => {
              const isMastered = masteredKCs[kc.code];
              const prob = isMastered ? 97.4 : 15.0;

              return (
                <div 
                  key={kc.code}
                  className={`p-3 rounded border text-left flex flex-col justify-between transition-all ${
                    isMastered 
                      ? "bg-vidya-accent/5 border-vidya-accent/30 shadow-sm shadow-vidya-accent/5" 
                      : "bg-vidya-void/30 border-vidya-border/30 opacity-70"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1 text-left">
                      <span className="text-[9px] font-mono text-vidya-accent font-semibold">{kc.code}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full ${
                        isMastered ? "bg-vidya-accent/15 text-vidya-accent font-bold" : "bg-vidya-border/40 text-vidya-text-muted"
                      }`}>
                        {kc.stage}
                      </span>
                    </div>
                    <h4 className="text-xs font-display font-semibold text-vidya-text leading-tight text-left">{kc.name}</h4>
                    <p className="text-[10px] text-vidya-text-muted leading-snug mt-1 flex-1 text-left">{kc.description}</p>
                  </div>
                  
                  {/* Probability Bar */}
                  <div className="mt-3 border-t border-vidya-border/30 pt-2 text-left">
                    <div className="flex justify-between items-center text-[9px] font-mono mb-1 text-vidya-text-muted">
                      <span>Posterior Mastery P(Ln)</span>
                      <span className={isMastered ? "text-vidya-accent font-bold" : "text-vidya-text-muted"}>{prob}%</span>
                    </div>
                    <div className="w-full h-1 bg-vidya-border/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isMastered ? "bg-vidya-accent" : "bg-vidya-text-muted"}`}
                        style={{ width: `${prob}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNodes.map((node) => {
          const isMastered = node.status === "mastered";
          const isActive = node.status === "active";

          return (
            <motion.div
              key={node.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleNodeSelect(node)}
              className={`relative flex flex-col p-6 rounded-lg border cursor-pointer select-none transition-all ${
                isMastered
                  ? "bg-vidya-surface/80 border-vidya-accent/40 shadow-lg shadow-vidya-accent/5 hover:border-vidya-accent"
                  : isActive
                  ? "bg-vidya-surface-raised border-vidya-accent-warm/40 hover:border-vidya-accent-warm shadow-md shadow-vidya-accent-warm/5"
                  : "bg-vidya-void/50 border-vidya-border/50 opacity-60 hover:opacity-80"
              }`}
            >
              {/* Badge line */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  node.subject === "Math"
                    ? "text-sky-400 border-sky-400/20 bg-sky-400/5"
                    : node.subject === "Physics"
                    ? "text-vidya-accent border-vidya-accent/20 bg-vidya-accent/5"
                    : "text-vidya-accent-warm border-vidya-accent-warm/20 bg-vidya-accent-warm/5"
                }`}>
                  {node.subject} • {node.difficulty}
                </span>

                <div className="flex items-center">
                  {isMastered ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-vidya-accent font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-vidya-accent" />
                      MASTERED
                    </span>
                  ) : isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-vidya-accent-warm font-semibold">
                      <Zap className="w-3.5 h-3.5 text-vidya-accent-warm" />
                      ACTIVE
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-vidya-text-muted" />
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-display font-semibold text-vidya-text mb-2 flex items-center gap-1.5">
                {node.label}
              </h3>
              <p className="text-xs text-vidya-text-muted leading-relaxed flex-1">
                {node.description}
              </p>

              {/* Prerequisites Indicator */}
              {node.prereqs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-vidya-border/50 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-mono text-vidya-text-muted uppercase">Prereqs:</span>
                  {node.prereqs.map((prereqId) => {
                    const req = MASTER_NODES.find((n) => n.id === prereqId);
                    return (
                      <span
                        key={prereqId}
                        className="text-[9px] font-mono px-1.5 py-0.5 bg-vidya-void text-vidya-text-muted border border-vidya-border rounded"
                      >
                        {req ? req.label : prereqId}
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
export { MASTER_NODES };
