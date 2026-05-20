import manifestRaw from "@/agent/script-agent/manifest.json";
import blDirectionRaw from "@/agent/script-agent/directions/bl-short-drama/direction.json";
import type { Project, ProjectMeta } from "./types";

export const DEFAULT_CREATIVE_DIRECTION_ID = "bl-short-drama";

export type CreativeDirectionStatus = "stable" | "beta" | "disabled";

export interface CreativeDirectionDefaults {
  episodeCount: string;
  episodeDurationMinutes: number;
  targetMarket: string;
  dialogueLanguage: string;
}

export interface CreativeDirection {
  id: string;
  label: string;
  shortLabel: string;
  status: CreativeDirectionStatus;
  description: string;
  defaults: CreativeDirectionDefaults;
  requiresEnglishLocaleBrief: boolean;
  contextSummary: string;
  promptFiles: string[];
  migrationShadowPromptFiles?: string[];
}

type AgentManifest = {
  defaultCreativeDirectionId?: string;
  directions?: Array<{ id?: string; configPath?: string }>;
};

const manifest = manifestRaw as AgentManifest;
const rawDirections = [blDirectionRaw as CreativeDirection];
const manifestDirectionIds = new Set((manifest.directions ?? []).map((d) => d.id).filter(Boolean));

const CREATIVE_DIRECTIONS = rawDirections
  .filter((d) => !manifestDirectionIds.size || manifestDirectionIds.has(d.id))
  .map((d) => ({
    ...d,
    promptFiles: Array.isArray(d.promptFiles) ? d.promptFiles : [],
    migrationShadowPromptFiles: Array.isArray(d.migrationShadowPromptFiles)
      ? d.migrationShadowPromptFiles
      : [],
  }));

const DIRECTION_BY_ID = new Map(CREATIVE_DIRECTIONS.map((d) => [d.id, d]));

function manifestDefaultId(): string {
  const raw = manifest.defaultCreativeDirectionId?.trim();
  return raw && DIRECTION_BY_ID.has(raw) ? raw : DEFAULT_CREATIVE_DIRECTION_ID;
}

export function listCreativeDirections(): CreativeDirection[] {
  return CREATIVE_DIRECTIONS.filter((d) => d.status !== "disabled");
}

export function normalizeCreativeDirectionId(id?: string | null): string {
  const raw = id?.trim();
  if (raw && DIRECTION_BY_ID.has(raw)) return raw;
  return manifestDefaultId();
}

export function getCreativeDirection(id?: string | null): CreativeDirection {
  const normalized = normalizeCreativeDirectionId(id);
  return DIRECTION_BY_ID.get(normalized) ?? DIRECTION_BY_ID.get(DEFAULT_CREATIVE_DIRECTION_ID)!;
}

export function ensureProjectCreativeDirection(project: { creativeDirectionId?: string }): boolean {
  const normalized = normalizeCreativeDirectionId(project.creativeDirectionId);
  if (project.creativeDirectionId === normalized) return false;
  project.creativeDirectionId = normalized;
  return true;
}

export function applyCreativeDirectionDefaultsToMeta(
  meta: ProjectMeta,
  creativeDirectionId?: string | null,
): ProjectMeta {
  const defaults = getCreativeDirection(creativeDirectionId).defaults;
  return {
    ...meta,
    episodeCount: meta.episodeCount || defaults.episodeCount,
    episodeDurationMinutes: meta.episodeDurationMinutes ?? defaults.episodeDurationMinutes,
    targetMarket: meta.targetMarket || defaults.targetMarket,
    dialogueLanguage: meta.dialogueLanguage || defaults.dialogueLanguage,
  };
}

export function isCreativeDirectionLocked(
  project: Pick<
    Project,
    "onboardingStatus" | "creativeBrief" | "seriesBible" | "messages" | "artifacts"
  >,
): boolean {
  return Boolean(
    project.onboardingStatus == null ||
      project.onboardingStatus === "ready" ||
      (project.creativeBrief ?? "").trim() ||
      (project.seriesBible ?? "").trim() ||
      (project.messages?.length ?? 0) > 0 ||
      (project.artifacts?.length ?? 0) > 0,
  );
}

export function buildCreativeDirectionContext(creativeDirectionId?: string | null): string {
  const direction = getCreativeDirection(creativeDirectionId);
  const defaults = direction.defaults;
  return [
    `创作方向 ID：${direction.id}`,
    `创作方向名称：${direction.label}`,
    `方向状态：${direction.status}`,
    `方向定位：${direction.description}`,
    `默认目标市场：${defaults.targetMarket}`,
    `默认体量：${defaults.episodeCount}；单集约 ${defaults.episodeDurationMinutes} 分钟`,
    `默认台词语言：${defaults.dialogueLanguage}`,
    `英语 Locale 简报：${direction.requiresEnglishLocaleBrief ? "需要，并在 STAGE 7 服从项目级简报" : "不强制"}`,
    `方向约束：${direction.contextSummary}`,
  ].join("\n");
}
