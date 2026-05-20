import fs from "node:fs";
import { createHash } from "node:crypto";
import { loadSystemPrompt } from "../lib/prompt-loader";

const DIRECTION_ID = "bl-short-drama";
const CORE_MANIFEST_PATH = "agent/script-agent/core/core-manifest.json";
const CORE_MARKER_PREFIX = "<!-- core-shadow:";
const DIRECTION_MARKER =
  "<!-- direction: bl-short-drama; file: agent/script-agent/directions/bl-short-drama/prompts/profile.md -->";
const LEGACY_MARKER = "<!-- file: agent/script-agent/prompts/main_prompt.md -->";
const KNOWLEDGE_MARKER = "<!-- file: agent/script-agent/knowledge/01_EPISODE_SPECS.md -->";
const SKILL_MARKER = "<!-- file: agent/script-agent/skills/00_INDEX.md -->";
const TEMPLATE_MARKER_PREFIX = "<!-- template: agent/script-agent/templates/";

interface CoreManifestModule {
  id?: string;
  path?: string;
}

interface CoreManifest {
  modules?: CoreManifestModule[];
}

function fail(message: string): never {
  throw new Error(`script-agent prompt parity failed: ${message}`);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function markerIndex(prompt: string, marker: string): number {
  const index = prompt.indexOf(marker);
  if (index < 0) fail(`missing marker: ${marker}`);
  return index;
}

const manifest = JSON.parse(fs.readFileSync(CORE_MANIFEST_PATH, "utf8")) as CoreManifest;
const modules = manifest.modules ?? [];
if (modules.length === 0) fail("core manifest has no modules");

const defaultPrompt = loadSystemPrompt(DIRECTION_ID);
const explicitOffPrompt = loadSystemPrompt(DIRECTION_ID, { coreMode: "off" });
const previewPrompt = loadSystemPrompt(DIRECTION_ID, { coreMode: "shadow-preview" });

if (defaultPrompt !== explicitOffPrompt) {
  fail("default prompt differs from explicit coreMode=off prompt");
}

if (!defaultPrompt.includes(DIRECTION_MARKER)) {
  fail("default prompt does not include BL direction marker");
}

if (defaultPrompt.includes(CORE_MARKER_PREFIX)) {
  fail("default prompt unexpectedly includes core-shadow marker");
}

if (!previewPrompt.includes(DIRECTION_MARKER)) {
  fail("shadow-preview prompt does not include BL direction marker");
}

for (const mod of modules) {
  if (!mod.id || !mod.path) fail("core manifest module missing id or path");
  const marker = `<!-- core-shadow: ${mod.id}; file: agent/script-agent/${mod.path} -->`;
  if (!previewPrompt.includes(marker)) {
    fail(`shadow-preview prompt missing core module marker: ${marker}`);
  }
}

const legacyIndex = markerIndex(previewPrompt, LEGACY_MARKER);
const firstCoreIndex = markerIndex(previewPrompt, CORE_MARKER_PREFIX);
const directionIndex = markerIndex(previewPrompt, DIRECTION_MARKER);
const knowledgeIndex = markerIndex(previewPrompt, KNOWLEDGE_MARKER);
const skillIndex = markerIndex(previewPrompt, SKILL_MARKER);
const templateIndex = markerIndex(previewPrompt, TEMPLATE_MARKER_PREFIX);

if (!(legacyIndex < firstCoreIndex)) {
  fail("legacy prompts must load before core shadow modules");
}
if (!(firstCoreIndex < directionIndex)) {
  fail("core shadow modules must load before direction package");
}
if (!(directionIndex < knowledgeIndex && knowledgeIndex < skillIndex && skillIndex < templateIndex)) {
  fail("expected direction -> knowledge -> skills -> templates order after core shadow modules");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      defaultHash: sha256(defaultPrompt),
      defaultLength: defaultPrompt.length,
      previewHash: sha256(previewPrompt),
      previewLength: previewPrompt.length,
      coreModules: modules.map((mod) => mod.id),
    },
    null,
    2
  )
);
