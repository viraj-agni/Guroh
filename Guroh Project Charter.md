# **Guroh Project Charter: Interactive Learning Platform**

**Brand Name:** Guroh (Domain: `guroh.ai` / `guroh.com`)  
**Codename:** Project Vidyā (Knowledge / Clarity)  
**Parent Org:** Agni Labs  

---

## **Executive Summary & Mission**

**Guroh** is a next-generation, interactive learning platform engineered to forge deep, lasting cognitive understanding in mathematics, physics, and computer science. 

The core thesis of Guroh is that **true learning requires productive friction**. 
* Passive video consumption (YouTube, Khan Academy, Coursera) creates a dangerous **"illusion of competence"**—learners feel they understand a concept while watching an elegant video, but struggle when faced with a blank canvas.
* Conversely, pure problem banks (WeBWorK, PrairieLearn, DeltaMath) enforce procedural drill work but lack the visual, geometric, and tactile intuition necessary for deep conceptual mastery.

Guroh bridges this gap by unifying **Intuition, Experimentation, and Mastery** into a seamless, 3-step pedagogical loop:
1. **Intuition:** Short, bite-sized visual explanations that introduce concepts in the simplest, most intuitive form.
2. **Experimentation (The Lab):** Interactive, tactile simulations (Brilliant-style R3F/p5.js sandboxes) where the student physically recreates and manipulates the underlying mechanics.
3. **Mastery (The Training Ground):** Algorithmic, parametrically generated problem sets with spaced repetition and Bayesian Knowledge Tracing (PrairieLearn-style) to lock in long-term memory.

---

## **1. Product Philosophy & Strategic Pivot**

### **1.1 Strategic Pivot: The Bottom-Up Organic DAG**
While Guroh’s ultimate long-term vision is to democratize university-level Physical AI, vector calculus, and multiphysics engineering, the initial go-to-market strategy executes an **organic, bottom-up DAG expansion**:

* **Target Pilot Cohort:** Early Childhood & Primary Education (starting with 5-year-olds / Early Prep, including the founder's daughter and peer groups).
* **Rationale for the Pivot:**
  1. **Direct User Access & Fast Feedback Loops:** Solves the distribution challenge of accessing undergrads by leveraging an immediate, highly accessible dogfooding group.
  2. **Product Mechanics Validation:** Allows the team to build, test, and harden the core mechanics—the WebGL 3D/2D rendering engine, Web Audio API soundscapes, parametric state machines, and Bayesian Knowledge Tracing—on fundamental math concepts before deploying to complex physics.
  3. **Retention as the Highest Benchmark:** Attention retention for a 5-year-old is the ultimate UX litmus test. If Guroh can hold the attention of early primary learners through tactile micro-interactions and audio-visual delight, the engagement model is proven for all older cohorts.
  4. **Immutable Root Nodes:** Knowledge Components (KCs) authored at the foundational level (`kc_subitizing`, `kc_number_line_traversal`, `kc_visual_addition`) serve as permanent, immutable root nodes for the curriculum Directed Acyclic Graph (DAG) as it expands up to Prealgebra, Calculus, and Physical AI.

---

## **2. The 3-Step Pedagogical Loop (Shu-Ha-Ri Engine)**

Every node on the Guroh skill tree executes a strict 3-step micro-cycle designed around cognitive science and the Japanese martial arts progression of *Shu-Ha-Ri*:

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: INTUITION (Shu - Conceptual Model)                                                │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ • 30–60 second micro-visual/video explanation, animated story, or visual metaphor.      │
│ • Focuses purely on building a clean mental model without overwhelming notation.           │
│ • Predictive Micro-Prompts: Includes 1-click zero-risk prediction prompts ("What will     │
│   happen if...?") before animations play to activate working memory and curiosity.        │
└──────────────────────────┬────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: EXPERIMENTATION (Ha - Tactile Lab Sandbox)                                        │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ • Interactive R3F / p5.js canvas where the student physically rebuilds the concept.       │
│ • Goal-Directed Micro-Missions: Framed with clear inquiry targets ("Match the pitch",    │
│   "Balance the scale") to guide tactile discovery without cognitive overload.            │
│ • Faded Scaffolding: Sliders, drag-and-drop objects, and visual feedback loops.           │
│ • Audio-tactile Web Audio API cues (snaps, pitch shifts, harmonic chords).                │
│ • Spatial Contiguity: On-canvas contextual cues to prevent split-attention effect.        │
└──────────────────────────┬────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: MASTERY (Ri - Parametric Training Ground)                                         │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ • Un-scaffolded, parametrically generated problem sets (randomized seeds & values).        │
│ • Graded deterministically via symbolic engines (SymPy, AST, numeric tolerances).        │
│ • Tracked via Bayesian Knowledge Tracing (BKT) with age-adjusted Slip Probability         │
│   attuning for early primary motor misclicks.                                            │
│ • Scheduled spaced repetition decay to lock in long-term memory.                          │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## **3. The Technology Stack**

Agents and developers must strictly adhere to this stack. Do not introduce alternative frameworks or database architectures without explicit architectural permission.

### **Frontend (Experiential Architecture)**
* **Framework:** Next.js (React) App Router for server-side rendering, edge routing, and aggressive code splitting.
* **Styling:** Tailwind CSS with custom laboratory design tokens ("Dark Mode Default" aesthetic with slate grays, neon accents, and spatial depth).
* **UI Animation:** Framer Motion for layout shifts, modal transitions, and dynamic "equation morphing" (animating algebraic variables collapsing into factored terms).
* **Interactive Canvases:**
  * *3D:* React Three Fiber (R3F) and Three.js for continuous physical and geometric simulations.
  * *2D:* react-p5 / D3.js for visual number lines, coordinate grids, and topographical heatmaps.
* **Audio-Tactile UI (Web Audio API):**
  * *Tactile SFX:* Resonant mechanical snaps for correct alignments, soft thuds for errors.
  * *Data Sonification:* Pitch-shifting synths linked to user sliders (e.g., hearing pitch increase as quantity grows).
  * *Dynamic BGM:* Ambient RPG-style stem-mixing that mutes melody stems during problem-solving to induce Flow State.

### **Backend & State Machine**
* **Database & Auth:** Supabase (PostgreSQL). Relational structure is mandatory to query the interwoven Q-Matrix and perform Recursive Common Table Expression (CTE) graph traversals.
* **Server Logic:** Next.js Server Actions & API Routes in a unified monorepo.
* **Deployment Target:** Vercel (Edge delivery) mapping to `guroh.ai` / `guroh.com`.

### **Data Extraction & Neurosymbolic Engine**
* **Symbolic Math Arbiter:** SymPy (Python) for proving algebraic/symbolic equivalence and computing limits for parametric generation.
* **Code Structural Evaluation:** Python `ast` / `tree-sitter` for evaluating student-submitted code structurally without agreeableness bias.
* **Graph Validation:** NetworkX for algorithmic cycle detection, guaranteeing that the curriculum DAG flows strictly acyclically.
* **The Neurosymbolic Mandate:** LLMs are used *only* offline for translating textbook text into strict Pydantic schemas. **Under no circumstances are LLMs used for live student grading in production.** All live evaluations are 100% deterministic.

---

## **4. Core Architectural Systems**

### **System A: The Macro Curriculum (The DAG)**
The curriculum is non-linear, rendered as an expansive, pan-and-zoom visual skill tree (similar to a tech tree in strategy games):
* **Nodes:** Represent Knowledge Components or Topics. Node States: *Locked, Active, Mastered, Decaying*.
* **Edges:** Hard prerequisite dependencies enforced via NetworkX graph validation.
* **Curriculum Horizon:**
  * *Horizon 1 (Foundation / Ages 5–8):* Subitizing, Number Line Traversal, Visual Addition/Subtraction, Visual Equations.
  * *Horizon 2 (Prealgebra / Ages 10–14):* OpenStax Prealgebra 2e (Fractions, Decimals, Negative Numbers, Linear Equations).
  * *Horizon 3 (Advanced STEM / Undergrad):* Vector Calculus, Linear Algebra, Multiphysics, Neural Operators, Physical AI.

### **System B: The Cognitive Engine (BKT & Spaced Repetition)**
Guroh models student mastery at the microscopic level using Educational Data Mining:
* **Knowledge Components (KCs):** Atomic cognitive units categorised as *Declarative, Conceptual, Procedural, Conditional,* or *Metacognitive*.
* **Bayesian Knowledge Tracing (BKT):** Updates mastery probability $P(L_n)$ after every interaction, accounting for Prior Knowledge $P(L_0)$, Learn Rate $P(T)$, Guess Probability $P(G)$, and Slip Probability $P(S)$.
* **Age-Adjusted BKT Dynamics & Motor Slip Attenuation:** Includes a dynamic modifier on $P(S)$ for early primary cohorts (Ages 5–7) to account for motor misclicks and rapid UI mis-drags, preventing false-negative mastery downgrades.
* **Cognitive Load & Spatial Contiguity:** UI interactions strictly adhere to Mayer's Spatial Contiguity Principle, keeping instructions embedded directly in the canvas space to eliminate split-attention cognitive load.
* **The Training Ground:** Daily sessions begin with reviewing decaying KCs. If a student fails an Anchor Problem, the system uses the Q-Matrix to downgrade them into a targeted, parameterized diagnostic scaffolding sequence before re-attempting the Capstone.

---

## **5. Phase 1 Deliverables (The Starting Zone)**

Phase 1 establishes the end-to-end technical pipeline while delivering the foundational root nodes for early primary learners:

1. **Infrastructure Completion:**
   * Next.js + Supabase monorepo scaffolding.
   * PostgreSQL Q-Matrix schema & BKT server-side calculation engine.
   * NetworkX DAG validation suite.

2. **Horizon 1 Foundation Modules (Age 5–7 Target):**
   * **Module 1.1: Subitizing & Tactile Number Line** (p5.js/R3F playground where children drag visual block clusters onto a dynamic number line with audio snaps).
   * **Module 1.2: Visual Addition & Balance Scale** (An interactive fulcrum scale where children balance weights to solve $x + 2 = 5$ visually before seeing formal notation).
   * **Module 1.3: Continuous Fraction Slicing** (An interactive geometry lab slicing virtual shapes to build visual proportion intuition).

---

## **6. Development Principles for AI Agents**

All AI coding assistants (Cursor, Copilot, Hermes) and human developers must strictly adhere to these rules:

1. **Visual Excellence & Laboratory Aesthetics:** Always use Tailwind CSS and Framer Motion with the dark-mode HUD tokens. Never output raw, unstyled HTML.
2. **100% Deterministic Live Evaluation:** Never call LLMs to grade student answers in production. Use SymPy, AST checkers, and numeric tolerance assertions (`Math.abs(user - actual) < 0.001`).
3. **Decoupled Architecture:** Keep WebGL/R3F visual components strictly decoupled from BKT database mutation logic using Zustand or React Context.
4. **Rendering Budgets:** Pause 3D animation loops when canvas modals are hidden. Use `useMemo` and `useCallback` aggressively to prevent frame drops during WebGL interactions.
