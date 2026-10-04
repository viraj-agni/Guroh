# Mastery Transaction Boundary v1

All mastery mutations execute in one atomic transaction.

## Sequence

1. Persist grade event for attempt/internal stage, including `kc_evidence[]` with `{ kc_id, observed, kc_type }` aligned to Charter v2 KC types.
2. Upsert `attempt_kc_map` evidence rows.
3. Recompute and upsert `bkt_state` per impacted KC.
4. Evaluate DAG unlock eligibility.
5. Upsert `node_progress` updates.
6. Commit transaction.

If any step fails, rollback everything.

## Invariants

- No partial KC/BKT writes without corresponding grade event.
- Unlock state cannot advance without mastery recompute.
- Duplicate grading with same idempotency key returns prior outcome, no extra mutation.

## Concurrency

- Use row-level locking on learner-scoped progression rows when updating mastery/unlock.
- Return `MASTERY_UPDATE_CONFLICT` on stale concurrent updates.

