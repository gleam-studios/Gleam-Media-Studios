# Core Continuity Pass

Use this pass after a batch of script material, after major project changes, or before a downstream handoff.

## Inputs

- Recent script drafts or installment outlines.
- Series bible constraints and milestones.
- Approved stage artifacts that define premise, characters, structure, events, and assets.
- Current asset registry.

## Checks

1. **World and premise**: no approved rule is contradicted without an explicit in-story explanation.
2. **Character function**: goals, fears, choices, and relationship shifts remain consistent with approved character material.
3. **Timeline**: day, night, location jumps, injuries, objects, and visible continuity do not contradict adjacent material.
4. **Causality**: each major event has a clear trigger and consequence.
5. **Foreshadowing**: planted information is either paid off, still active, or intentionally deferred.
6. **Asset references**: every `@` reference matches the registered asset string.
7. **Stage alignment**: the draft does not rely on unapproved future-stage assumptions.

## Output Format

```markdown
## 连续性问题列表

| 位置 | 类型 | 问题 | 建议修法 |
| --- | --- | --- | --- |

## 通过声明

仅当没有严重问题时，写一句通过声明。
```

## Completion Standard

- No severe continuity break remains.
- Medium issues have a concrete fix or creator-approved exemption.
- Asset references are either registered or explicitly routed back to the registry.
