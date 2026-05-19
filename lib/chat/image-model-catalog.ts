import {
  IMAGE_MODEL_ORDER,
  type ImageModelId,
  type ImageModelSettings,
  type ImageWorkspaceSettings,
} from "@/lib/image-workspace";
export interface ImageModelCatalogEntry {
  preset_id: ImageModelId;
  display_name: string;
  kind: "image";
  model_name: string;
  endpoint_hint: string;
  provider: string;
}

function truncateHint(url: string, max = 48): string {
  const u = url.trim();
  if (u.length <= max) return u;
  return `${u.slice(0, max)}…`;
}

export function effectiveAgentImageModelId(requested?: string, fallback?: string): ImageModelId {
  const req = requested?.trim() as ImageModelId | undefined;
  if (req && IMAGE_MODEL_ORDER.includes(req)) return req;
  const fb = fallback?.trim() as ImageModelId | undefined;
  if (fb && IMAGE_MODEL_ORDER.includes(fb)) return fb;
  return "gpt-image-2";
}

export function buildImageModelCatalog(imageWorkspace: ImageWorkspaceSettings): ImageModelCatalogEntry[] {
  const ids: ImageModelId[] = [...IMAGE_MODEL_ORDER];

  return ids.map((id) => {
    const m: ImageModelSettings = imageWorkspace.models[id];
    return {
      preset_id: id,
      display_name: m.label || id,
      kind: "image" as const,
      model_name: m.modelName,
      endpoint_hint: truncateHint(m.endpointUrl),
      provider: m.provider,
    };
  });
}

export function resolveImageModelSettings(
  imageWorkspace: ImageWorkspaceSettings,
  presetId: ImageModelId,
): ImageModelSettings | null {
  const m = imageWorkspace.models[presetId];
  if (!m?.endpointUrl?.trim() || !m.modelName?.trim() || !m.apiKey?.trim()) return null;
  return m;
}
