# Script Agent Resource Layout

`agent/script-agent/` is the single source of truth for the script-writing agent resources.

## Current Layout

- `prompts/`, `knowledge/`, `templates/`, `skills/`, and `context_assets/` are the legacy production prompt surface. In the current product state, this surface is still BL short-drama oriented.
- `directions/` contains explicit creative direction packages. The first package is `directions/bl-short-drama/`, which wraps the existing women-oriented BL short-drama specialization as the default product direction. Its `migrationShadowPromptFiles` are review-only BL rule copies; tests and migration scripts may opt into `directionMode: "shadow-preview"` for comparison.
- `core/` contains the shadow shared screenplay workflow layer. Production prompt assembly keeps it off by default; tests and migration scripts may opt into `coreMode: "shadow-preview"` for comparison.
- `manifest.json` declares the agent package and the default creative direction.
- `PROMPT_MIGRATION_READINESS.md` is the stage 7 closeout baseline. It records default/core-preview/direction-preview/combined-preview prompt hashes, marker order, duplicate-rule mapping, and deletion boundaries. Regenerate it with `npm run report:script-agent-migration`.

## Migration Direction

Do not move the existing legacy prompt files in the first direction-system pass. The intended path is:

1. Keep current BL behavior stable.
2. Load a selected `directions/<id>/` package on top of the existing prompt surface.
3. Use `coreMode: "shadow-preview"` only for parity checks and migration review; do not enable it from application APIs.
4. Use `directionMode: "shadow-preview"` only for parity checks and migration review; do not enable it from application APIs.
5. Add future directions, such as `general-screenplay`, only after their prompts, templates, defaults, and validation expectations are implemented.

## Verification

- `npm run report:script-agent-migration` regenerates `PROMPT_MIGRATION_READINESS.md` and verifies that the default `bl-short-drama` prompt hash and length remain unchanged.
- `npm run smoke:prompt-parity` verifies that the default `bl-short-drama` prompt does not load core shadow modules, while the preview prompt loads `core/` in the expected order.
- `npm run smoke:direction-shadow` verifies that BL migration shadow files exist, stay out of default and core-only prompts, and load only in explicit direction-preview prompts with the expected order.
