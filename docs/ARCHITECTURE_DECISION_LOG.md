# Software Architecture Decision Log (ADR)
# Project Vidyā / Guroh

This document tracks all key software and infrastructure architectural decisions, the context in which they were made, trade-offs evaluated, and the chosen path forward.

---

## ADR-001: Next.js Static Export for Cloudflare Pages Deployment (guroh.app)

* **Date:** 2026-10-12
* **Status:** Accepted
* **Decider:** Viraj Agnihotri (Approved), Tony (CTO)
* **Ticket Reference:** `3f654e06-d6dd-81e8-bb39-ecfce1a5969e` ("Deploy PWA to Cloudflare Pages for Review (guroh.app)")

### Context & Problem Statement
During initial continuous deployment on Cloudflare Pages (Option A via GitHub integration), the deployment failed at the publishing step (`504 Gateway Timeout`). Cloudflare detected Next.js dynamic routing (`/play/[node_id]`) without an explicit export configuration and automatically attempted to deploy an OpenNext Edge Worker bundle (`.open-next/worker.js`, 5.4MB) to execute server-side rendering on demand. The Cloudflare Workers upload API timed out while receiving the server container.

### Decision Drivers
1. **PWA Offline-First Integrity:** Guroh is architected as an offline-capable, interactive cognitive learning application. User progress is saved locally via IndexedDB, audio synthesis runs in the client browser (`Web Audio API`), and geometry sandboxes run client-side.
2. **Deterministic & Fast Edge Distribution:** The review site (`guroh.app`) and student devices require instant loading without cold starts or server container orchestration.
3. **Resilience & Simplicity:** Avoiding unnecessary server worker compilation avoids heavy CI timeouts and deployment failures.

### Options Considered

#### Option 1: Static Export (`output: 'export'`) — *The "Pre-Printed Book" Approach* (CHOSEN)
* **Description:** Pre-render all pages and interactive components during `npm run build` into a static bundle in the `out/` directory. Cloudflare Pages serves these directly via edge storage/CDN.
* **Pros:**
  * Zero server cold starts; instant global edge caching.
  * 100% compatible with offline PWA service workers.
  * Fast, reliable CI builds (~10-15 seconds) with zero Cloudflare Worker timeout risk.
  * Near-zero operational cost and minimal attack surface.
* **Cons:**
  * Cannot run Node.js/Edge server-side dynamic route handlers or cookies within Next.js (mock `/api/sync/guest-to-user` cannot execute as an in-process server route; external Supabase/backend API is used for cloud persistence).
  * Dynamic routes require `generateStaticParams()` to pre-enumerate routes at build time.

#### Option 2: Cloudflare Worker / OpenNext Server Runtime — *The "Live Server Robot" Approach*
* **Description:** Bundle Next.js into a Cloudflare Worker edge function using `@opennextjs/cloudflare` to execute server-side rendering and API routes on every request.
* **Pros:**
  * Supports arbitrary dynamic URLs without build-time enumeration.
  * Allows Next.js server-side route handlers (`/api/...`) to execute on Cloudflare.
* **Cons:**
  * Complex build pipeline requiring OpenNext polyfills; prone to edge bundle upload timeouts (root cause of current 504 error).
  * Worker cold starts and added architectural overhead unnecessary for an offline-first client PWA.

### Consequences & Implementation Details
* Configured `output: "export"` and `images: { unoptimized: true }` in `next.config.ts`.
* Refactored `/play/[node_id]` route into a Server Component shell declaring `generateStaticParams()` for all taxonomy modules (`parallel_transversals`, `triangle_sum`, `lines_angles_transversal`, `MATH.GEOMETRY.LinesAngles`, `MATH.GEOMETRY.TriangleSum`) with an isolated client component `PlayClient.tsx`.
* Cloudflare Pages build settings:
  * **Build command:** `npm run build`
  * **Build output directory:** `out`
