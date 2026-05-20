<!-- migration-shadow: bl-short-drama english-locale; source=agent/script-agent/prompts/english-lines-agent-role.md + agent/script-agent/skills/skill-english-dialogue-localization.md; runtime-loaded=false -->
# BL Direction Shadow: English Locale

This file is a migration shadow for the current BL direction's English dialogue and locale rules. It is not loaded by `loadSystemPrompt()` yet.

## Stage 7 Locale Premise

For the current BL short-drama direction, Stage 7 script dialogue defaults to localized English with Chinese translation in the same line, and should obey the project-level English Locale brief generated in Studio.

If the Locale brief is missing, the agent must not invent local habits. It should ask the creator to generate the brief before writing final episode dialogue.

## Dialogue Format

- Put performance or emotional state before the line.
- Write localized English dialogue.
- Add the Chinese translation at the end of the same line in Chinese parentheses.
- Mark the speaking character with the registered `@` asset name.
- Keep all scene, character, and prop references aligned with the Stage 5 asset registry.

## Chinglish Checks

Before finalizing dialogue, check:

- whether the sentence order is a word-for-word Chinese translation;
- whether connectors such as "and then", "moreover", or "furthermore" make speech sound written;
- whether politeness is stacked unnaturally for the selected locale;
- whether idioms, slang, or register mismatch the brief;
- whether address forms match the current relationship distance;
- whether each character's education, class, and emotional state stay consistent;
- whether contractions and colloquial forms follow the chosen locale instead of being forced everywhere.

## Direction Boundary

English locale is not a universal screenplay requirement. It belongs to this BL short-drama direction until a future shared locale module is designed and explicitly enabled.
