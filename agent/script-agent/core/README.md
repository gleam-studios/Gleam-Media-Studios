# Script Agent Core Shadow Layer

`agent/script-agent/core/` is a shadow copy of the reusable screenplay workflow rules. It is intentionally not loaded by production prompt assembly yet.

## Status

- `runtimeLoaded: false`
- This directory is for review, comparison, and staged migration only.
- Production behavior still comes from the legacy prompt surface plus the selected `directions/*` package.

## Boundary

Core may contain:

- stage sequencing and confirmation discipline;
- structured Markdown delivery rules;
- project-context, artifact, gate, and source-of-truth rules;
- adaptation workflow skeletons;
- continuity checks that apply across story forms.

Core must not contain:

- direction-specific audience, market, relationship, or language defaults;
- platform-specific episode rhythm rules unless they are clearly marked as shared add-ons;
- runtime loader instructions that would make this directory active automatically.

## Migration Order

1. Keep these files as reviewable shadow documents.
2. Compare each core rule against the legacy production prompt.
3. Add an explicit loader option only after parity checks are available.
4. Move direction-specific rules into `directions/*` only after the current production direction is protected by tests and fixtures.
