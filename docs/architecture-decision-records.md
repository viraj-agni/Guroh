# Architecture Decision Records (ADRs)

| ADR ID | Title | Status | Date |
| :--- | :--- | :--- | :--- |
| **ADR-001** | [Database Architecture & Backend Stack (Supabase Postgres)](#adr-001-database-architecture--backend-stack-supabase-postgres) | Approved | 2026-10-04 |
| **ADR-002** | [Media Asset Management & Audio CDN Pipeline](#adr-002-media-asset-management--audio-cdn-pipeline) | Approved | 2026-10-04 |
| **ADR-003** | [Client Telemetry, Interaction Capture & Analytics Architecture](#adr-003-client-telemetry-interaction-capture--analytics-architecture) | Approved | 2026-10-04 |
| **ADR-004** | [Curriculum DAG Management: Authoring (Neo4j) vs. Runtime (Postgres)](#adr-004-curriculum-dag-management-authoring-neo4j-vs-runtime-postgres) | Approved | 2026-10-04 |

---

## ADR-001: Database Architecture & Backend Stack (Supabase Postgres)

### Context
Project Vidyā (Guroh) requires a database engine for user authentication, student mastery state management (Bayesian Knowledge Tracing - BKT), curriculum progress tracking, and parametric problem sessions. We needed to evaluate managed cloud platforms vs. self-hosted solutions while considering cost structure, developer speed, and scalability.

### Decision
We choose **Supabase (Managed PostgreSQL)** as the core transactional database and backend infrastructure.

1. **Transactional Engine:** PostgreSQL 15+ hosted via Supabase.
2. **Authentication:** Supabase Auth (JWT-based session management, Row Level Security).
3. **Storage Tiering:**
   * **Free Tier:** 500 MB DB storage, 1 GB file storage, 50,000 MAU.
   * **Growth Path:** $25/month Pro Tier when database exceeds 500 MB or auto-scaling is required.
   * **Self-Hosting Option:** Because Supabase is open-source (Docker/K8s), the entire stack can be self-hosted on AWS/DigitalOcean if commercial constraints demand custom infrastructure.

### Consequences
* **Positive:** Sub-10ms transactional speeds, native Row Level Security (RLS), auto-generated REST/GraphQL APIs, built-in Auth and Object Storage in a single vendor ecosystem.
* **Negative:** Need to monitor database connection pooling (pgBouncer) as active client connections scale up.

---

## ADR-002: Media Asset Management & Audio CDN Pipeline

### Context
The Vidyā interactive modules feature rich audio-tactile feedback, synthesized sound effects, narrator prompt audio files (`.mp3`/`.ogg`), and ambient audio. Storing media files directly as Binary Large Objects (BLOBs) inside relational SQL databases causes database bloat, inefficient memory usage, slow backups, and high IOPS costs.

### Decision
We adopt an **S3-Compatible Object Storage + Global CDN Architecture** for all media assets.

1. **Storage Subsystem:** **Supabase Storage** (backed by AWS S3 buckets).
2. **Delivery Pipeline:** Files are served publicly via global Edge Content Delivery Networks (CDNs) with aggressive client-side caching (`Cache-Control: public, max-age=31536000, immutable`).
3. **Database Representation:** Postgres database tables store only normalized metadata references and relative asset keys (e.g., `audio_key: "kcc1a/prompts/count_3_objects.mp3"`).
4. **Client Audio Engine:** Web Audio API loads pre-buffered audio buffers directly from CDN URLs.

```
+-------------------+      GET /audio/*.mp3      +--------------------+
|  Next.js Client   | -------------------------> |  Supabase Storage  |
|  (Web Audio API)  | <------------------------- |   (S3 + Edge CDN)  |
+-------------------+      Audio ArrayBuffer     +--------------------+
          |
          |  References audio_key (string)
          v
+-------------------+
| Supabase Postgres |
+-------------------+
```

### Consequences
* **Positive:** Zero database bloat; near-zero latency audio streaming via CDN edge nodes; minimal storage costs.
* **Negative:** Asset deletion/updates require invalidating CDN cache or using cache-busting asset hash suffixes.

---

## ADR-003: Client Telemetry, Interaction Capture & Analytics Architecture

### Context
During interactive STEM simulations, children generate continuous micro-interactions: accidental screen taps, repeated audio plays, close-button touches, drag trajectories, and pause durations. Writing these raw, high-frequency event streams directly into the primary transactional Postgres database would degrade BKT transaction throughput and cause massive table bloat.

### Decision
We decouple **High-Frequency UX Telemetry** from **Core BKT Mastery State** using a dual-path telemetry architecture.

```
                      +-----------------------------+
                      |     Client Interaction      |
                      |  (Taps, Drags, Pauses, UX)  |
                      +-----------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v (Validated Step Attempt)                  v (High-Frequency Event Stream)
+-------------------------------+             +-------------------------------+
|      Supabase Postgres        |             |  PostHog / ClickHouse Stream  |
|   (BKT State, Mastery, Log)   |             |  (UX Analytics, Heatmaps)     |
+-------------------------------+             +-------------------------------+
```

1. **Core BKT Transaction Path (Postgres):**
   * **Trigger:** Validated task submissions, problem step completions, and BKT probability updates ($p(L)$, $p(G)$, $p(S)$).
   * **Destination:** `student_mastery` and `step_attempts` tables in Supabase Postgres.
2. **Telemetry & Engagement Stream (PostHog / ClickHouse):**
   * **Trigger:** Asynchronous client-side batching of UI micro-interactions (accidental taps, audio clicks, drag paths, dwell times).
   * **Destination:** Dedicated analytics engine (PostHog / ClickHouse / Supabase Logflare).
3. **Privacy & Anonymization:** Student event logs omit Personally Identifiable Information (PII) and use salted hashed session tokens.

### Consequences
* **Positive:** Core database performance remains fast; UX teams get complete visibility into drop-offs, misclicks, and engagement heatmaps.
* **Negative:** Analytics require querying a secondary tool (PostHog/ClickHouse) for UX insights, separate from core BKT tables.

---

## ADR-004: Curriculum DAG Management: Authoring (Neo4j) vs. Runtime (Postgres)

### Context
The Vidyā Curriculum Graph (Directed Acyclic Graph - DAG) models knowledge dependencies across math, physics, and neural computation nodes. The canonical DAG was designed and validated in **Neo4j** using Cypher queries. We evaluated whether to host a dedicated Neo4j graph cluster in production vs. compiling the graph into Supabase Postgres.

### Decision
We adopt a **Dual-Environment Graph Architecture**: **Neo4j for Design & Audit** + **Postgres Relational Adjacency for Runtime Serving**.

```
[ Authoring / Design Phase ]
+-----------------------------------+
|             Neo4j                 |
|  - Graph visualization            |
|  - Cypher gap analysis            |
|  - Node topological sorting       |
+-----------------------------------+
                  |
                  | Export (JSON / Cypher Script)
                  v
[ Production Runtime Phase ]
+-----------------------------------+
|         Supabase Postgres         |
|  - `curriculum_nodes` table       |
|  - `curriculum_edges` table       |
|  - Recursive CTE Traversal        |
+-----------------------------------+
```

1. **Authoring Environment (Neo4j):** Used by curriculum architects to model node prerequisites, execute Cypher gap analysis queries, and visualize topological ordering.
2. **Production Runtime (Supabase Postgres):** Graph topology is exported into relational `curriculum_nodes` and `curriculum_edges` tables.
3. **Runtime Traversal:** Student mastery frontier queries execute directly inside Postgres using recursive SQL (`WITH RECURSIVE`) or Postgres `ltree` extensions.

```sql
-- Runtime Frontier Query Example in Postgres
WITH RECURSIVE prerequisite_tree AS (
    SELECT parent_node_id, child_node_id FROM curriculum_edges WHERE child_node_id = 'K.CC.1a'
    UNION ALL
    SELECT e.parent_node_id, e.child_node_id
    FROM curriculum_edges e
    INNER JOIN prerequisite_tree pt ON e.child_node_id = pt.parent_node_id
)
SELECT * FROM prerequisite_tree;
```

### Consequences
* **Positive:** Eliminates $100+/month production Neo4j cluster hosting costs; runtime frontier evaluation executes in sub-10ms directly alongside BKT student state in Postgres; single database operational overhead.
* **Negative:** Graph schema changes require running a build/export script from Neo4j into Postgres migration scripts.
