import fs from "node:fs";
import { createHash } from "node:crypto";
import { loadSystemPrompt, type LoadSystemPromptOptions } from "../lib/prompt-loader";

const DIRECTION_ID = "bl-short-drama";
const EXPECTED_DEFAULT_HASH = "a5768b615ed993685c5351fa3f22af0a1aff17d98815a93fe677c290be135dca";
const EXPECTED_DEFAULT_LENGTH = 88902;
const REPORT_PATH = "agent/script-agent/PROMPT_MIGRATION_READINESS.md";
const CORE_MANIFEST_PATH = "agent/script-agent/core/core-manifest.json";
const DIRECTION_CONFIG_PATH = "agent/script-agent/directions/bl-short-drama/direction.json";

const MARKERS = {
  legacy: "<!-- file: agent/script-agent/prompts/main_prompt.md -->",
  core: "<!-- core-shadow:",
  stableDirection:
    "<!-- direction: bl-short-drama; file: agent/script-agent/directions/bl-short-drama/prompts/profile.md -->",
  directionShadow: "<!-- direction-shadow:",
  knowledge: "<!-- file: agent/script-agent/knowledge/01_EPISODE_SPECS.md -->",
  skills: "<!-- file: agent/script-agent/skills/00_INDEX.md -->",
  templates: "<!-- template: agent/script-agent/templates/",
};

interface CoreManifestModule {
  id?: string;
  path?: string;
  category?: string;
  sourceLegacyFiles?: string[];
}

interface CoreManifest {
  modules?: CoreManifestModule[];
}

interface DirectionConfig {
  promptFiles?: string[];
  migrationShadowPromptFiles?: string[];
}

interface PromptVariant {
  id: string;
  label: string;
  options: LoadSystemPromptOptions;
  expectedOrder: string;
  prompt: string;
  hash: string;
  length: number;
}

const directionShadowMappings = [
  {
    file: "directions/bl-short-drama/prompts/role.md",
    ruleArea: "BL 身份定位 / 总编剧角色",
    legacySources: ["prompts/main-agent-role.md"],
    nextAction: "可作为 direction role 正本候选；删 legacy 前需确认 main_prompt 的总控调度未依赖原段落。",
  },
  {
    file: "directions/bl-short-drama/prompts/market-and-relationship.md",
    ruleArea: "海外市场 / 女性向情绪 / 双男主关系 / 人设默认",
    legacySources: ["prompts/main-agent-role.md", "prompts/rule.md", "prompts/flowchart.md"],
    nextAction: "重复度高但风险中高；需要先把 short-drama shared 与 BL_DIRECTION 边界再拆细。",
  },
  {
    file: "directions/bl-short-drama/prompts/dialogue.md",
    ruleArea: "BL 对白医生 / 去 AI 味 / 关系攻防",
    legacySources: ["prompts/lines-agent-role.md", "prompts/main-agent-role.md"],
    nextAction: "可先做 direction dialogue addendum；暂不删 lines-agent-role。",
  },
  {
    file: "directions/bl-short-drama/prompts/english-locale.md",
    ruleArea: "英语对白 / Locale 简报 / Chinglish 排雷",
    legacySources: ["prompts/english-lines-agent-role.md", "skills/skill-english-dialogue-localization.md"],
    nextAction: "应等待 shared locale module 设计后再决定是否从 direction 抽出。",
  },
];

function fail(message: string): never {
  throw new Error(`script-agent migration readiness failed: ${message}`);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function markerIndex(prompt: string, marker: string): number | null {
  const index = prompt.indexOf(marker);
  return index >= 0 ? index : null;
}

function requiredIndex(prompt: string, marker: string, label: string): number {
  const index = markerIndex(prompt, marker);
  if (index == null) fail(`missing ${label} marker`);
  return index;
}

function assertBefore(a: number, b: number, message: string): void {
  if (!(a < b)) fail(message);
}

function loadVariant(id: string, label: string, options: LoadSystemPromptOptions, expectedOrder: string): PromptVariant {
  const prompt = loadSystemPrompt(DIRECTION_ID, options);
  return {
    id,
    label,
    options,
    expectedOrder,
    prompt,
    hash: sha256(prompt),
    length: prompt.length,
  };
}

function validateVariantOrder(variant: PromptVariant): Record<string, number | null> {
  const indexes = {
    legacy: markerIndex(variant.prompt, MARKERS.legacy),
    core: markerIndex(variant.prompt, MARKERS.core),
    stableDirection: markerIndex(variant.prompt, MARKERS.stableDirection),
    directionShadow: markerIndex(variant.prompt, MARKERS.directionShadow),
    knowledge: markerIndex(variant.prompt, MARKERS.knowledge),
    skills: markerIndex(variant.prompt, MARKERS.skills),
    templates: markerIndex(variant.prompt, MARKERS.templates),
  };

  const legacy = requiredIndex(variant.prompt, MARKERS.legacy, `${variant.id} legacy`);
  const stableDirection = requiredIndex(variant.prompt, MARKERS.stableDirection, `${variant.id} stable direction`);
  const knowledge = requiredIndex(variant.prompt, MARKERS.knowledge, `${variant.id} knowledge`);
  const skills = requiredIndex(variant.prompt, MARKERS.skills, `${variant.id} skills`);
  const templates = requiredIndex(variant.prompt, MARKERS.templates, `${variant.id} templates`);

  assertBefore(legacy, stableDirection, `${variant.id}: legacy must load before stable direction`);
  assertBefore(stableDirection, knowledge, `${variant.id}: stable direction must load before knowledge`);
  assertBefore(knowledge, skills, `${variant.id}: knowledge must load before skills`);
  assertBefore(skills, templates, `${variant.id}: skills must load before templates`);

  if (variant.options.coreMode === "shadow-preview") {
    const core = requiredIndex(variant.prompt, MARKERS.core, `${variant.id} core shadow`);
    assertBefore(legacy, core, `${variant.id}: legacy must load before core shadow`);
    assertBefore(core, stableDirection, `${variant.id}: core shadow must load before stable direction`);
  } else if (indexes.core != null) {
    fail(`${variant.id}: core shadow marker present without coreMode shadow-preview`);
  }

  if (variant.options.directionMode === "shadow-preview") {
    const directionShadow = requiredIndex(variant.prompt, MARKERS.directionShadow, `${variant.id} direction shadow`);
    assertBefore(stableDirection, directionShadow, `${variant.id}: stable direction must load before direction shadow`);
    assertBefore(directionShadow, knowledge, `${variant.id}: direction shadow must load before knowledge`);
  } else if (indexes.directionShadow != null) {
    fail(`${variant.id}: direction shadow marker present without directionMode shadow-preview`);
  }

  return indexes;
}

function tableRow(cells: Array<string | number>): string {
  return `| ${cells.map((cell) => String(cell).replace(/\n/g, "<br>")).join(" | ")} |`;
}

function markerValue(index: number | null): string {
  return index == null ? "not loaded" : String(index);
}

function jsonList(values: string[] | undefined): string {
  return values && values.length > 0 ? values.map((v) => `\`${v}\``).join("<br>") : "";
}

const coreManifest = JSON.parse(fs.readFileSync(CORE_MANIFEST_PATH, "utf8")) as CoreManifest;
const directionConfig = JSON.parse(fs.readFileSync(DIRECTION_CONFIG_PATH, "utf8")) as DirectionConfig;
const coreModules = coreManifest.modules ?? [];
const directionShadowFiles = directionConfig.migrationShadowPromptFiles ?? [];

if (coreModules.length === 0) fail("core manifest has no modules");
if (directionShadowFiles.length === 0) fail("direction has no migrationShadowPromptFiles");

const variants = [
  loadVariant("default", "Default production", {}, "legacy -> stable direction -> knowledge -> skills -> templates"),
  loadVariant(
    "core-only",
    "Core shadow preview",
    { coreMode: "shadow-preview" },
    "legacy -> core shadow -> stable direction -> knowledge -> skills -> templates"
  ),
  loadVariant(
    "direction-only",
    "Direction shadow preview",
    { directionMode: "shadow-preview" },
    "legacy -> stable direction -> direction shadow -> knowledge -> skills -> templates"
  ),
  loadVariant(
    "combined",
    "Combined preview",
    { coreMode: "shadow-preview", directionMode: "shadow-preview" },
    "legacy -> core shadow -> stable direction -> direction shadow -> knowledge -> skills -> templates"
  ),
];

const defaultVariant = variants[0];
if (defaultVariant.hash !== EXPECTED_DEFAULT_HASH) {
  fail(`default hash changed: ${defaultVariant.hash}`);
}
if (defaultVariant.length !== EXPECTED_DEFAULT_LENGTH) {
  fail(`default length changed: ${defaultVariant.length}`);
}

const markerIndexes = new Map<string, Record<string, number | null>>();
for (const variant of variants) {
  markerIndexes.set(variant.id, validateVariantOrder(variant));
}

const report = `# Prompt Migration Readiness

Generated by \`npm run report:script-agent-migration\`. This report is deterministic and intentionally has no timestamp.

## Conclusion

- The default production prompt is unchanged.
- Core shadow and BL direction shadow can be previewed explicitly, but neither is loaded by default.
- This infrastructure is ready for the next migration planning round.
- Do not delete or trim legacy prompt rules in this round. Any legacy deletion must be a separate phase with an explainable default prompt hash change.

## Production Baseline

| Field | Value |
| --- | --- |
| Creative direction | \`${DIRECTION_ID}\` |
| Expected default hash | \`${EXPECTED_DEFAULT_HASH}\` |
| Actual default hash | \`${defaultVariant.hash}\` |
| Expected default length | \`${EXPECTED_DEFAULT_LENGTH}\` |
| Actual default length | \`${defaultVariant.length}\` |
| Default load order | ${variants[0].expectedOrder} |

## Prompt Variants

| Variant | Options | Hash | Length | Expected order |
| --- | --- | --- | --- | --- |
${variants
  .map((variant) =>
    tableRow([
      variant.label,
      `\`${JSON.stringify(variant.options)}\``,
      `\`${variant.hash}\``,
      variant.length,
      variant.expectedOrder,
    ])
  )
  .join("\n")}

## Marker Indexes

| Variant | legacy | core shadow | stable direction | direction shadow | knowledge | skills | templates |
| --- | --- | --- | --- | --- | --- | --- | --- |
${variants
  .map((variant) => {
    const indexes = markerIndexes.get(variant.id)!;
    return tableRow([
      variant.id,
      markerValue(indexes.legacy),
      markerValue(indexes.core),
      markerValue(indexes.stableDirection),
      markerValue(indexes.directionShadow),
      markerValue(indexes.knowledge),
      markerValue(indexes.skills),
      markerValue(indexes.templates),
    ]);
  })
  .join("\n")}

## Core Shadow Modules

| Module | Category | Path | Legacy sources |
| --- | --- | --- | --- |
${coreModules
  .map((mod) =>
    tableRow([
      mod.id ?? "",
      mod.category ?? "",
      mod.path ?? "",
      jsonList(mod.sourceLegacyFiles),
    ])
  )
  .join("\n")}

## BL Direction Shadow Mapping

| Shadow file | Rule area | Legacy sources | Next action |
| --- | --- | --- | --- |
${directionShadowMappings
  .map((mapping) =>
    tableRow([
      mapping.file,
      mapping.ruleArea,
      jsonList(mapping.legacySources),
      mapping.nextAction,
    ])
  )
  .join("\n")}

## Do Not Delete In This Round

| Area | Reason |
| --- | --- |
| \`agent/script-agent/prompts/main_prompt.md\` | Still owns production loading contract, stage dispatch, mounted resource references, and hard template coordination. |
| \`agent/script-agent/templates/*.md\` | Still owns parser-facing artifact shapes and STAGE output structures. |
| \`agent/script-agent/knowledge/*.md\` | Still runtime-loaded production knowledge; short-drama and locale extraction needs a separate shared-module phase. |
| \`agent/script-agent/skills/short-drama/references/*.md\` | Still reference-only and not auto-injected; do not change their loading semantics during prompt migration. |
| \`agent/script-agent/context_assets/character_reference.md\` | Still mixed project-context and BL example material; needs a neutral replacement schema before trimming. |

## Stage Summary

| Stage | Result |
| --- | --- |
| 1 | Creative direction registry and default \`bl-short-drama\` project field established. |
| 2 | Boundary inventory and migration categories documented. |
| 3 | \`core/\` shadow layer created, not production-loaded. |
| 4 | \`coreMode: "shadow-preview"\` added for explicit core preview. |
| 5 | BL direction shadow files and \`migrationShadowPromptFiles\` metadata added. |
| 6 | \`directionMode: "shadow-preview"\` added for explicit direction shadow preview. |
| 7 | This readiness report captures prompt hashes, load order, duplicate-rule mapping, and deletion boundaries. |

## Next Round Recommendation

Start with a read-only duplicate-rule diff report. The first deletion-capable phase should target only one narrow area, carry prompt snapshots, and treat any default hash change as an intentional migration artifact requiring explicit review.
`;

fs.writeFileSync(REPORT_PATH, report, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      reportPath: REPORT_PATH,
      variants: variants.map((variant) => ({
        id: variant.id,
        hash: variant.hash,
        length: variant.length,
      })),
      coreModules: coreModules.map((mod) => mod.id),
      directionShadowFiles,
    },
    null,
    2
  )
);
