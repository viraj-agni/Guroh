# Shu-Ha-Ri State Machine v1

Status: Contract  
Module: `vector-anatomy-v1`

## Learner surface vs internal storage

State names in this document are **internal attempt stages** for persistence, grading routes, and authoring. Learner clients MUST NOT show Shu/Ha/Ri as a step list. Expose neutral **mission** fields instead (`completed_segments`, `total_segments`, `active_segment_index`, `kc_types_emphasized`, `interaction.kind`). See `docs/contracts/api-contracts-v1.md`.

## KC types (Charter v2) bound to internal stages

Each internal stage maps to the five-type KC taxonomy used in grading evidence and mission emphasis (Project Vidya Charter v2, System C.1):

| Internal stage | Emphasized KC types | Role |
|----------------|---------------------|------|
| `shu` | `declarative`, `conceptual` | Facts and mental models before graded input |
| `ha` | `procedural`, `conditional` | Executing the method, choosing the right operation |
| `ri` | `metacognitive` | Self-checking and independent verification on a capstone |
| `remediation` | `procedural`, `conditional` | Same emphasis as `ha`; narrows to failed KC ids from evidence |

## States

- `shu`: guided conceptual interaction
- `ha`: constrained procedural challenge
- `ri`: capstone independent challenge
- `complete`: mastered outcome
- `remediation`: targeted fallback after `ri` failure

## Transition Rules

1. `shu -> ha`
   - Guard: learner completed all Shu required interactions.
2. `ha -> ri`
   - Guard: deterministic grade passes Ha threshold.
3. `ri -> complete`
   - Guard: deterministic grade passes Ri threshold.
4. `ri -> remediation`
   - Guard: deterministic grade fails Ri threshold.
5. `remediation -> ri`
   - Guard: remediation checklist completed.
6. `complete -> complete`
   - Terminal for module attempt.

## Failure Semantics

- Invalid payload: remain in current state, return instructional correction.
- Grader timeout: remain in current state, prompt retry.
- Attempt stage mismatch: reject mutation, return current canonical state.

## Idempotency Rule

`POST /api/module-attempt/grade` must accept an `idempotency_key`.  
Duplicate key for same attempt and stage returns prior grading result, not a new transition.

## Flow Diagram

```text
START
  |
  v
[SHU] --(guidance complete)--> [HA] --(pass)--> [RI] --(pass)--> [COMPLETE]
                                 |                |
                                 |                +--(fail)--> [REMEDIATION] --(done)--> [RI]
                                 |
                                 +--(fail)--> [HA]  (retry allowed, bounded by policy)
```

