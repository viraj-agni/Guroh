# Error Taxonomy v1

Status: Contract

## Core Error Codes

### `VALIDATION_INPUT_INVALID`
- Meaning: submission payload fails deterministic validation constraints.
- HTTP: `400`
- Learner message: "Your input format is not valid yet. Check components and try again."
- Recoverable: `true`
- Action: `fix_input`

### `VALIDATION_TIMEOUT`
- Meaning: deterministic grader exceeded timeout budget.
- HTTP: `408`
- Learner message: "We could not grade this in time. Retry now."
- Recoverable: `true`
- Action: `retry`

### `MASTERY_UPDATE_CONFLICT`
- Meaning: concurrent or stale update attempted on mastery transaction.
- HTTP: `409`
- Learner message: "Your progress changed in another action. Refresh and continue."
- Recoverable: `true`
- Action: `refresh`

### `DAG_STATE_INCONSISTENT`
- Meaning: unlock/progression graph result conflicts with persisted state.
- HTTP: `500`
- Learner message: "We hit a progression sync issue. Your work is saved; please retry."
- Recoverable: `true`
- Action: `retry_or_report`

## Supplementary Codes

- `DAG_NODE_LOCKED` (`403`)
- `MODULE_NOT_FOUND` (`404`)
- `ATTEMPT_ALREADY_ACTIVE` (`409`)
- `ATTEMPT_STAGE_MISMATCH` (`409`)
- `UNAUTHENTICATED` (`401`)

## UX Tone Rule

All learner-facing messages remain calm, specific, and instructional.  
No blame language, no vague "something went wrong."

