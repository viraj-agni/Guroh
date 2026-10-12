# Project Vidyā (Guroh) — Repository Architecture & Symbol Map

> **For AI Agents (Shuri, Tony, Reed, Jarvis):**
> This file is the single source of truth for repository structure, file paths, and exported symbols.
> **ALWAYS check this map before running `search_files` to find exact file paths immediately.**

---

## 📁 Key File Locations & Fast Lookup

| Architecture Zone | Exact File Path | Exports / Symbols |
| :--- | :--- | :--- |
| **Feature Components & Shell** | `src/components/PWAAppShell.tsx` | `PWAAppShell` |
| **Libraries & Storage (IndexedDB/State)** | `src/lib/indexedDB.ts` | `openDB, saveLessonProgress, getAllLessonProgress, LessonProgressRecord, GuestProfileRecord` |
| **App Router Pages & Layouts** | `src/app/page.tsx` | `Home` |
| **App Router Pages & Layouts** | `src/app/layout.tsx` | `metadata, viewport, RootLayout` |
| **Feature Components & Shell** | `src/components/InteractiveLabCanvas.tsx` | `InteractiveLabCanvas, DraggableItem, DropZone` |
| **App Router Pages & Layouts** | `src/app/play/[node_id]/page.tsx` | `generateStaticParams, async` |
| **App Router Pages & Layouts** | `src/app/intuition-demo/page.tsx` | `MicroSprintDemoPage` |
| **Static Assets & PWA Workers** | `public/sw.js` | `Default Export` |

---

## 🗺️ Detailed Module Index by Category

### 🔹 Feature Components & Shell
- **`src/components/AdaptiveVidyaContainer.tsx`** (107 lines)  
  ↳ fn: `AdaptiveVidyaContainer` | types: `BreakpointTier`, `AdaptiveVidyaContainerProps`
- **`src/components/AudioEngine.ts`** (95 lines)  
  ↳ fn: `synth`
- **`src/components/AuthModal.tsx`** (406 lines)  
  ↳ default: `AuthModal`
- **`src/components/ContentLibrary.tsx`** (453 lines)  
  ↳ default: `ContentLibrary` | types: `DAGNode`
- **`src/components/CurriculumExplorer.tsx`** (695 lines)  
  ↳ default: `CurriculumExplorer` | types: `VerifiedDAGNode`, `VerifiedDAGEdge`, `PedagogicalStage`, `NodeStatus`
- **`src/components/DeferredConversionBanner.tsx`** (129 lines)  
  ↳ default: `DeferredConversionBanner`
- **`src/components/DualModeIntuitionPlayer.tsx`** (306 lines)  
  ↳ fn: `DualModeIntuitionPlayer` | types: `SVGStrokeItem`, `DrawingConceptPayload`, `DualModeIntuitionPlayerProps`, `DualModeIntuitionPlayerRef`
- **`src/components/GuestOnboardingFlow.tsx`** (711 lines)  
  ↳ default: `GuestOnboardingFlow` | types: `OnboardingStep`
- **`src/components/InteractiveLabCanvas.tsx`** (351 lines)  
  ↳ fn: `InteractiveLabCanvas` | types: `DraggableItem`, `DropZone`, `InteractiveLabPayload`, `InteractiveLabCanvasProps`
- **`src/components/PWAAppShell.tsx`** (320 lines)  
  ↳ default: `PWAAppShell`
- **`src/components/ParallelTransversalsSandbox.tsx`** (1088 lines)  
  ↳ default: `ParallelTransversalsSandbox`
- **`src/components/ParametricDrillEngine.tsx`** (269 lines)  
  ↳ fn: `ParametricDrillEngine` | types: `DrillOption`, `DrillQuestion`, `ParametricDrillPayload`, `ParametricDrillEngineProps`
- **`src/components/ParentPortal.tsx`** (838 lines)  
  ↳ default: `ParentPortal`
- **`src/components/ServiceWorkerRegister.tsx`** (22 lines)  
  ↳ default: `ServiceWorkerRegister`
- **`src/components/TriangleSumSandbox.tsx`** (1007 lines)  
  ↳ default: `TriangleSumSandbox`
- **`src/components/VectorSandbox.tsx`** (763 lines)  
  ↳ default: `VectorSandbox`

### 🔹 App Router Pages & Layouts
- **`src/app/layout.tsx`** (43 lines)  
  ↳ default: `RootLayout` | fn: `metadata`, `viewport`
- **`src/app/page.tsx`** (415 lines)  
  ↳ default: `Home`
- **`src/app/api/sync/guest-to-user/route.ts`** (219 lines)  
  ↳ fn: `POST` | types: `GuestProfilePayload`, `ProgressItemPayload`, `SyncQueueActionPayload`, `GuestToUserSyncRequest`
- **`src/app/design-system/page.tsx`** (234 lines)  
  ↳ default: `DesignSystemPreviewPage`
- **`src/app/intuition-demo/page.tsx`** (305 lines)  
  ↳ default: `MicroSprintDemoPage`
- **`src/app/play/[node_id]/PlayClient.tsx`** (276 lines)  
  ↳ default: `PlayClient`
- **`src/app/play/[node_id]/page.tsx`** (20 lines)  
  ↳ default: `async` | fn: `generateStaticParams`

### 🔹 Libraries & Storage (IndexedDB/State)
- **`src/lib/indexedDB.ts`** (492 lines)  
  ↳ fn: `openDB`, `saveLessonProgress`, `getAllLessonProgress`, `getPendingSyncQueue`, `getOrCreateGuestId` | types: `LessonProgressRecord`, `GuestProfileRecord`, `PendingSyncAction`, `UserSession`
- **`src/lib/useOnlineStatus.ts`** (27 lines)  
  ↳ fn: `useOnlineStatus`
- **`src/lib/utils.ts`** (1 lines)  
  ↳ Asset/Static

### 🔹 UI Primitives (shadcn/Radix)
- **`src/components/ui/badge.tsx`** (53 lines)  
  ↳ Asset/Static
- **`src/components/ui/button.tsx`** (63 lines)  
  ↳ Asset/Static
- **`src/components/ui/card.tsx`** (102 lines)  
  ↳ Asset/Static
- **`src/components/ui/dialog.tsx`** (159 lines)  
  ↳ Asset/Static
- **`src/components/ui/dropdown-menu.tsx`** (267 lines)  
  ↳ Asset/Static
- **`src/components/ui/input.tsx`** (19 lines)  
  ↳ Asset/Static
- **`src/components/ui/progress.tsx`** (49 lines)  
  ↳ fn: `Progress`
- **`src/components/ui/tabs.tsx`** (81 lines)  
  ↳ Asset/Static
- **`src/components/ui/tooltip.tsx`** (65 lines)  
  ↳ Asset/Static

### 🔹 Static Assets & PWA Workers
- **`public/manifest.json`** (24 lines)  
  ↳ Asset/Static
- **`public/offline.html`** (346 lines)  
  ↳ Asset/Static
- **`public/sw.js`** (171 lines)  
  ↳ Asset/Static

---

## ⚙️ Core Storage & Routing Conventions

* **IndexedDB Stores (`src/lib/indexedDB.ts`):**
  - `user_profile`: Guest & signed-in user profiles.
  - `lesson_progress`: Micro-lesson and diagnostic progress records (`saveLessonProgress`).
  - `offline_queue`: Pending actions queued for deferred sync.
* **PWA App Shell Zones (`src/components/PWAAppShell.tsx`):**
  - `Zone 1`: Sticky HUD top-bar with offline indicator and status badges.
  - `Zone 2`: Interactive viewport (`#FDFBF7` parchment canvas) for lessons and diagnostics.
  - `Zone 3`: Mobile-first ergonomic thumb-nav bar.
* **Routing Layout (`src/app/`):**
  - `/`: Main App entry point (mounting `PWAAppShell`).
  - `/play/[node_id]`: Interactive DAG node lesson runner.
  - `/intuition-demo`: Tactile interactive sandbox demo.
