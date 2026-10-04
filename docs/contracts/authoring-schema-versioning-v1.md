# Authoring Schema Versioning Policy

Current contract: `module.schema.v1.json` (`schema_version = 1.0.0`)

## Rules

1. `1.x` versions are backward compatible for existing modules.
2. Unknown fields are rejected in v1 for deterministic behavior.
3. Breaking changes require a new major schema (`2.0.0`) and dual-read migration plan.
4. Every module document must declare `schema_version`.
5. Loader behavior:
   - supported version -> parse and continue
   - unsupported version -> reject with instructional error

## v1 -> v2 migration approach (placeholder)

- Introduce `module.schema.v2.json`.
- Keep v1 loader active while v2 is rolled out.
- Add one migration script for converting v1 docs to v2 shape.
- Decommission v1 only after all active modules are migrated and validated.

