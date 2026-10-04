# Design System — Guroh (formerly Project Vidya)

## Tech Stack & Approved UI Rules (Updated 2026-09-28)

1. **Component Library:** `shadcn/ui` as primary component library, configured with Tailwind CSS v4 tokens.
2. **Typography Architecture:**
   - **Brand, Display & Headings:** `Plus Jakarta Sans` (Weights: 500, 600, 700, 800) — Exact 1:1 corner radius match with Guroh Staircase G mark.
   - **Early Learner Body, Phonics & Reading:** `Lexend` (Weights: 400, 500, 600) — Scientifically optimized tracking for 5yo pre-readers.
   - **Numeric Data & Code:** `IBM Plex Mono` / `JetBrains Mono` with `font-variant-numeric: tabular-nums`.
3. **Corner Radius Tokens:**
   - Cards & Containers: `rounded-2xl` (16px)
   - Buttons & Inputs: `rounded-xl` (12px)
   - Badges, Chips & Avatars: `rounded-full` (9999px)
4. **Border Tokens:**
   - Dark Mode: `1px` structural glass borders (`border-white/10` / `border-[#8D1516]/20`)
   - Light Mode: `1px` structural glass borders (`border-black/10` / `border-[#E6D8CC]`)
5. **Iconography & Stroke Weights:**
   - Standard HUD & Secondary Chrome: Lucide React icons set to `strokeWidth={1.75}`.
   - Early Learner UI (Ages 5–8 / Horizon 1): Lucide React icons set to `strokeWidth={2.0}` or filled variants for instant visual recognition.
6. **Touch Target Size Rule (Fitts's Law):**
   - Minimum Touch Target Height: `min-h-[48px]` for standard desktop controls, `min-h-[52px]` (or 56px) for Horizon 1 / early primary components (Ages 5–7) to satisfy Fitts's Law on touch/tablet devices.
7. **Motion & Laboratory HUD:** Magic UI / Framer Motion for Stage 2/3 laboratory HUD glows, transition morphing, and interactive equation feedback.

## Product Context

- **What this is:** A visually premium interactive academy for rigorous math, physics, and CS toward physical AI (see `Project Vidya Charter_v2.md`).
- **Who it's for:** Serious learners and early pre-readers (5yo cohort) who want tactile simulations and deterministic feedback, not passive video.
- **Space / industry:** Interactive STEM and “learn by doing” platforms; positioning emphasizes deterministic grading and lab-grade visuals over passive video.
- **Project type:** Dark-default web app (Next.js 16 + Tailwind CSS v4 per charter).

## Official Brand Emblem & Story

The official Guroh / Project Vidya mark is a geometric dual-meaning emblem:
1. **The 3-Step Staircase:** Directly encodes our core 3-stage pedagogical flywheel (**Stage 1: Intuition → Stage 2: Experimentation → Stage 3: Mastery**).
2. **The Stylized 'G' Structural Curve:** A subtle, modern structural nod to our lineage (**Guroh / Agni Labs**) while avoiding generic corporate lettermarks.

```
         ┌───┐
      ┌──┘   └──┐
   ┌──┘         │
   │  ┌──────┐  │   <-- 3-Step Learning Flywheel forming 'G'
   └──┴──────┴──┘
```

---

## Official Color Tokens & Material UI Matrix

### Core Brand Tokens

| Role | Token Name | Dark Mode Hex | Light Mode Hex | Usage & Purpose |
| :--- | :--- | :---: | :---: | :--- |
| **Primary (Brand)** | `primary.main` | `#8D1516` | `#8D1516` | Deep Oxblood Crimson — Primary brand container, details triggers |
| **Primary Light** | `primary.light` | `#D1001C` | `#B81D1F` | Active hover & highlight states |
| **Secondary (Prestige)** | `secondary.main` | `#D9A066` | `#B57C38` | Academic Gold — Progress chips, resume lesson primary action |
| **Secondary Dark** | `secondary.dark` | `#A37134` | `#8C581F` | High-contrast WCAG AA gold for buttons with white text |
| **Secondary Light** | `secondary.light` | `#E8C199` | `#F9EEDC` | Badge fills, light gold chip grounds |
| **Tertiary (Mastery)** | `tertiary.main` | `#2D6A4F` | `#2D6A4F` | Sage Emerald — BKT mastery progress bars, test step triggers |
| **Info / Logic** | `info.main` | `#2A52BE` | `#1D4ED8` | Oxford Sapphire — Live code execution, sandbox triggers |
| **Canvas / Background** | `bg.default` | `#080203` | `#FAF6F0` | Dark Crimson-tinted void / Light Parchment Ivory |
| **Text Primary** | `text.primary` | `#F9F1EC` | `#1E2225` | Soft Cream Off-White on dark / Dark Charcoal on light |

### Contrast Rules & WCAG 2.1 AA/AAA Requirements

1. **Dark Mode:** `#F9F1EC` (Soft Cream) text on `#8D1516` (Primary Main) yields **8.36:1 (Passes AAA)**.
2. **Light Mode Gold Button Rule:**
   - **White text (`#FFFFFF`) on `#B57C38` yields 3.56:1 (FAILS AA for normal text size).**
   - **Enforced Fix:** Always use **Dark Charcoal text (`#1E2225`)** on `#B57C38` gold buttons (**4.51:1 — Passes AA**), OR use `secondary.dark` (`#8C581F`) background with White text (**5.95:1 — Passes AA**).

---

## Typography Specification

| Role | Font Family | Weights | Rationale & Guidance |
| :--- | :--- | :--- | :--- |
| **Display / Headings** | **Plus Jakarta Sans** | 600, 700, 800 | Geometric, rounded terminals that mirror our 3-step staircase 'G' logo mark. |
| **Learner Body & Reading** | **Lexend** | 400, 500, 600 | Scientifically engineered for early visual tracking and 5yo pre-readers. |
| **Data, BKT & Tables** | **IBM Plex Mono** | 400, 600 | Tabular numbers (`font-variant-numeric: tabular-nums`) for mastery tracking. |
| **Code Editor** | **JetBrains Mono** | 400, 500 | Clean character separation in Stage 2/3 code sandboxes. |

---

## Layout & Spacing

- **Base unit:** 8px.
- **Scale:** 2xs (2px), xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px), 3xl (64px).
- **Corner Radius:**
  - Cards & Containers: `rounded-2xl` (16px)
  - Buttons & Inputs: `rounded-xl` (12px)
  - Chips & Badges: `rounded-full` (9999px)
- **Borders:** `1px` structural glass (`border-white/10` in dark mode, `border-black/10` in light mode).

---

## Decisions Log

| Date | Decision | Rationale |
| :--- | :--- | :--- |
| **2026-09-28** | Official Brand Emblem & Color Matrix Updated | Adopted 3-Step Staircase 'G' mark, Deep Crimson (`#8D1516`), Academic Gold (`#D9A066`/`#B57C38`), Sage Emerald (`#2D6A4F`), and Oxford Sapphire (`#2A52BE`). |
| **2026-09-28** | Typography Architecture Finalized | Selected `Plus Jakarta Sans` for brand/display and `Lexend` for early learner body reading. |
| **2026-09-28** | WCAG 2.1 Compliance Audit Recorded | Dark mode AAA verified; Light mode gold buttons patched with dark text requirement (`#1E2225`). |
