# Core Project Context Rules

Project context is the highest-priority project-specific state injected by the application. It prevents the agent from drifting away from creator-approved material.

## Priority

When context sources conflict, follow this order:

1. Engineering injection for current project state.
2. Series bible and confirmed project brief.
3. Approved stage artifacts.
4. Current conversation.
5. General writing instincts.

## Series Bible

- Treat the series bible as the project-level source of truth.
- Use it for world rules, core character constraints, main conflict, milestone structure, and non-negotiable continuity.
- Do not replace the series bible with a newer chat idea unless the creator explicitly revises it through the project workflow.

## Stage Artifacts

- Stage artifacts are durable project memory.
- Stage 1-4 define premise, character base, structure, and event chain.
- Stage 5 registers assets that later outputs must reference consistently.
- Stage 6 defines the installment-level outline for script drafting.
- Stage 7 should follow the confirmed outline and registered assets.

## Gate Behavior

- Respect the maximum approved stage in project state.
- If the current inferred stage is ahead of approval, repair the missing stage work before proceeding.
- If the gate checklist reports missing items, address those items directly.
- Manual override may permit progress, but the output should still state and preserve the risk.

## Asset Registry

- Registered assets use `∆人物`, `∆物品`, and `∆场景`.
- Every referenced asset should match the registered `@主称谓（中文名）` string.
- Do not introduce a new asset spelling downstream without updating the registry first.
- Summaries, outlines, and scripts should use the same asset names to keep extraction and validation stable.
