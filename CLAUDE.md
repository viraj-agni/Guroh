# Project Vidya — agent notes

## Fast Navigation & Architecture Map
Before running broad `search_files` or regex scans, ALWAYS consult **`REPO_MAP.md`** in this directory (`C:/Users/viraj/Code/Project_Vidya/REPO_MAP.md`). It contains the exact file paths, exports, component signatures, and storage schemas for the entire project.

## Design System

Always read **`DESIGN.md`** before making any visual or UI decisions. Font roles, color tokens, spacing, motion, and layout are defined there. Do not deviate without explicit user approval. In QA mode, flag any learner-facing UI that contradicts `DESIGN.md`.

Canonical tokens also live in **`config/vidya-tailwind-preset.js`** (Tailwind) and **`demo/app.py`** embedded demo `:root` (until the Next.js app exists).
