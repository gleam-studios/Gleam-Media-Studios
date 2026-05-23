import validator from "@rjsf/validator-ajv8";
import type { SkillJsonSchema } from "@/lib/chat/types";
import { sanitizeJsonSchema } from "@/components/skill-form/schema-to-ui-schema";

export type SkillAssetEntry = {
  role_tag: string;
  asset_url: string;
  description?: string;
};

export type StoryboardFormPayload = {
  story_framework: string;
  scene_description: string;
  provided_assets: SkillAssetEntry[];
  optional_parameters?: {
    board_type_hint?: string;
    aspect_ratio?: string;
    camera_movement_preference?: string;
  };
};

export function validateSkillPayload(
  inputSchema: SkillJsonSchema,
  payload: unknown,
): { ok: true; data: StoryboardFormPayload } | { ok: false; error: string } {
  const result = validator.validateFormData(payload, sanitizeJsonSchema(inputSchema));
  if (result.errors.length > 0) {
    const msg = result.errors
      .slice(0, 5)
      .map((e) => e.stack || e.message || "无效字段")
      .join("；");
    return { ok: false, error: msg };
  }

  const data = payload as StoryboardFormPayload;
  const assets = data.provided_assets ?? [];
  const hasCharacter = assets.some((a) => a.role_tag === "Character");
  const hasSceneText = Boolean(data.scene_description?.trim());
  const hasSceneAsset = assets.some((a) => a.role_tag === "Scene");

  if (!hasCharacter) {
    return { ok: false, error: "请至少上传一张角色 (Character) 参考图" };
  }
  if (!hasSceneText && !hasSceneAsset) {
    return { ok: false, error: "请填写场景设定，或上传场景 (Scene) 参考图" };
  }

  return { ok: true, data };
}
