# Vidya API Contracts v1

Status: Draft for implementation  
Scope: Vertical slice (`Anatomy of a Vector`)

## Conventions

- All endpoints require authenticated user context.
- All responses are JSON.
- Error shape is consistent across endpoints:

```json
{
  "error_code": "VALIDATION_INPUT_INVALID",
  "message": "Instructional message for learner",
  "recoverable": true,
  "action": "retry"
}
```

## Progression and KC types (Charter v2)

- **Learner-visible state** uses neutral mission fields only: segment counts, cognitive focus (KC types from the five-type model), and interaction hints. Clients MUST NOT render Shu/Ha/Ri labels; those names are **internal attempt stages** for storage, routing, and authoring.
- **Internal stages** (implementation): `shu`, `ha`, `ri`, `remediation`, `complete`. See `docs/contracts/state-machine-shu-ha-ri-v1.md` for transitions.
- **KC type model** (observable evidence tags): `declarative`, `conceptual`, `procedural`, `conditional`, `metacognitive` (Project Vidya Charter v2, System C.1).
- **Mapping internal stage to emphasized KC types** (for mission copy and segment framing, not as a visible checklist):
  - `shu`: `declarative`, `conceptual`
  - `ha` and `remediation`: `procedural`, `conditional`
  - `ri`: `metacognitive`

Grading responses attach `kc_evidence[]` with `{ "kc_id", "observed", "kc_type" }` so downstream mastery and analytics align with the five-type taxonomy.

---

## `POST /api/module-attempt/start`

Create a learner attempt for a given module node.

### Request

```json
{
  "module_id": "vector-anatomy-v1",
  "node_id": "math.vector.anatomy",
  "entry_source": "dag"
}
```

### Success `200`

```json
{
  "attempt_id": "att_01JXYZ...",
  "module_id": "vector-anatomy-v1",
  "node_id": "math.vector.anatomy",
  "mission": {
    "objective": "Build and reason about a 2D vector",
    "completed_segments": 0,
    "total_segments": 3,
    "active_segment_index": 1,
    "kc_types_emphasized": ["declarative", "conceptual"]
  },
  "interaction": {
    "kind": "guided_read"
  }
}
```

`interaction.kind` is an opaque interaction classifier for the client (for example `guided_read`, `numeric_magnitude`, `numeric_capstone`, `module_complete`). It MUST be driven from server state, not inferred from labels shown to the learner.

### Errors

- `403`: `DAG_NODE_LOCKED`
- `404`: `MODULE_NOT_FOUND`
- `409`: `ATTEMPT_ALREADY_ACTIVE`

---

## `POST /api/module-attempt/progression`

Advance past non-graded segments (for example after guided foundation). Server validates the current internal stage and updates storage. Idempotent: if the learner is already past that segment, returns the current canonical `mission` plus `interaction` snapshot.

### Request

```json
{
  "attempt_id": "att_01JXYZ...",
  "action": "complete_guided_foundation"
}
```

### Success `200`

```json
{
  "attempt_id": "att_01JXYZ...",
  "mission": {
    "objective": "Build and reason about a 2D vector",
    "completed_segments": 1,
    "total_segments": 3,
    "active_segment_index": 2,
    "kc_types_emphasized": ["procedural", "conditional"]
  },
  "interaction": {
    "kind": "numeric_magnitude",
    "vector": { "x": 3, "y": 4 }
  }
}
```

---

## `POST /api/module-attempt/grade`

Run deterministic grading for the learner's **current** graded segment. The client sends only the submission payload; the server resolves the active internal stage from the attempt record (no `stage` field in the request body for learner clients).

### Request

```json
{
  "attempt_id": "att_01JXYZ...",
  "submission": {
    "vector_components": { "x": 3, "y": 4 },
    "magnitude": 5
  },
  "idempotency_key": "grade-att_01JXYZ-seg2-001"
}
```

### Success `200`

```json
{
  "attempt_id": "att_01JXYZ...",
  "correct": true,
  "feedback": {
    "tone": "instructional",
    "message": "Magnitude is consistent with vector components."
  },
  "mission": {
    "objective": "Build and reason about a 2D vector",
    "completed_segments": 2,
    "total_segments": 3,
    "active_segment_index": 3,
    "kc_types_emphasized": ["metacognitive"]
  },
  "interaction": {
    "kind": "numeric_capstone",
    "vector": { "x": 6, "y": 8 }
  },
  "kc_evidence": [
    {
      "kc_id": "kc_vector_components",
      "observed": true,
      "kc_type": "procedural"
    },
    {
      "kc_id": "kc_vector_magnitude",
      "observed": true,
      "kc_type": "conditional"
    }
  ]
}
```

On capstone (`ri` internally), evidence rows use `kc_type`: `metacognitive` for the same KC ids, reflecting independent verification and self-checking.

When the capstone grade is **incorrect**, the server transitions the attempt to internal `remediation` (see state machine). The next successful grade on the scaffolding vector returns the attempt to the capstone interaction.

### Errors

- `400`: `VALIDATION_INPUT_INVALID`
- `408`: `VALIDATION_TIMEOUT`
- `409`: `ATTEMPT_STAGE_MISMATCH`

---

## `POST /api/mastery/update`

Atomically persist evidence and update learner progression.

### Request

```json
{
  "attempt_id": "att_01JXYZ...",
  "grade_event_id": "grade_evt_01JXYZ...",
  "stage_result": {
    "correct": true,
    "kc_evidence": [
      { "kc_id": "kc_vector_components", "observed": true, "kc_type": "metacognitive" },
      { "kc_id": "kc_vector_magnitude", "observed": true, "kc_type": "metacognitive" }
    ]
  }
}
```

### Success `200`

```json
{
  "transaction_id": "tx_01JXYZ...",
  "mastery": {
    "updated_kc_ids": ["kc_vector_components", "kc_vector_magnitude"],
    "threshold_met": true
  },
  "dag": {
    "node_unlocked": true,
    "unlocked_node_ids": ["math.vector.operations"]
  },
  "mission": {
    "status": "complete",
    "completed_segments": 3,
    "total_segments": 3,
    "completion_card": {
      "mastery_outcome": "Mastered",
      "next_node": "math.vector.operations",
      "retry_hint": null
    }
  }
}
```

### Errors

- `409`: `MASTERY_UPDATE_CONFLICT`
- `500`: `DAG_STATE_INCONSISTENT`

---

## `GET /api/dag/state`

Fetch learner DAG + mission projection snapshot.

### Query Params

- `include_mission=true|false` (default `true`)
- `focus_node_id` optional

### Success `200`

```json
{
  "nodes": [
    { "node_id": "math.vector.anatomy", "status": "mastered" },
    { "node_id": "math.vector.operations", "status": "active" }
  ],
  "mission": {
    "active_objective": "Start vector operations",
    "completed_segments": 2,
    "total_segments": 3,
    "kc_types_emphasized": ["metacognitive"]
  },
  "training_ground": {
    "has_decayed_kc": true,
    "next_kc_id": "kc_vector_magnitude"
  }
}
```

### Errors

- `401`: `UNAUTHENTICATED`
- `500`: `DAG_STATE_INCONSISTENT`
