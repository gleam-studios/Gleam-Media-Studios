import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { llmToChatApiConfig } from "@/lib/chat-settings";
import { parseAssistantChoice, sendChatCompletionRaw } from "@/lib/chat/completion";
import type { ChatApiConfig, ChatMessage, SkillFormRunResult, SkillPackRecord } from "@/lib/chat/types";
import { generateImage } from "@/lib/image-generate";
import { effectiveAgentImageModelId, resolveImageModelSettings } from "@/lib/chat/image-model-catalog";
import { persistGeneratedImageToStorage } from "@/lib/db/persist-generated-image";
import { getWorkspaceSnapshot } from "@/lib/db/workspace-settings-store";
import type { ImageAspectRatio, ImageModelId } from "@/lib/image-workspace";
import { validateSkillPayload, type StoryboardFormPayload } from "@/lib/skills/validate-skill-payload";

function mapAspectRatio(raw?: string): ImageAspectRatio {
  const map: Record<string, ImageAspectRatio> = {
    "16:9": "16:9",
    "9:16": "9:16",
    "1:1": "1:1",
    "4:3": "4:3",
    "2.35:1": "21:9",
  };
  return map[raw ?? ""] ?? "16:9";
}

async function generateMasterPrompt(
  chatApiConfig: ChatApiConfig,
  systemPrompt: string,
  payload: StoryboardFormPayload,
): Promise<string> {
  const systemMsg: ChatMessage = {
    id: "sys-form",
    role: "system",
    createdAt: Date.now(),
    parts: [{ type: "text", text: systemPrompt }],
  };
  const userMsg: ChatMessage = {
    id: "user-form",
    role: "user",
    createdAt: Date.now(),
    parts: [
      {
        type: "text",
        text: `以下是用户提交的表单 JSON。请严格按系统指令只输出 Master Prompt 全文，不要寒暄、不要 JSON 包裹、不要 markdown 代码块：\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  };

  const raw = await sendChatCompletionRaw(chatApiConfig, [systemMsg, userMsg]);
  const { contentText } = parseAssistantChoice(raw);
  const master = contentText?.trim() ?? "";
  if (!master) {
    throw new Error("模型未返回 Master Prompt");
  }
  if (/^生成失败/.test(master)) {
    throw new Error(master);
  }
  return master;
}

export async function runSkillForm(params: {
  supabase: SupabaseClient;
  userId: string;
  pack: SkillPackRecord;
  payload: unknown;
  preferredImageModelId?: ImageModelId;
}): Promise<SkillFormRunResult> {
  const { supabase, userId, pack, payload, preferredImageModelId } = params;

  if (!pack.inputSchema) {
    throw new Error("该 Skill 未配置表单 interface");
  }
  if (!pack.optimizedSystemPrompt?.trim()) {
    throw new Error("该 Skill 缺少 optimized_system_prompt，无法执行表单模式");
  }

  const validated = validateSkillPayload(pack.inputSchema, payload);
  if (!validated.ok) {
    throw new Error(validated.error);
  }
  const formPayload = validated.data;

  const snapshot = await getWorkspaceSnapshot(supabase);
  const chatApiConfig = llmToChatApiConfig(snapshot.llm);
  const modelId = effectiveAgentImageModelId(preferredImageModelId, "gpt-image-2");
  const model = resolveImageModelSettings(snapshot.imageWorkspace, modelId);
  if (!model) {
    throw new Error(`生图模型未配置完整: ${modelId}`);
  }
  const aspectRatio = mapAspectRatio(formPayload.optional_parameters?.aspect_ratio);
  const refImages = formPayload.provided_assets.map((a) => a.asset_url).filter(Boolean);

  const masterPrompt = await generateMasterPrompt(
    chatApiConfig,
    pack.optimizedSystemPrompt,
    formPayload,
  );

  const imageResult = await generateImage({
    model,
    prompt: masterPrompt,
    aspectRatio,
    refImages,
  });

  const generatedImageUrl = await persistGeneratedImageToStorage(
    supabase,
    userId,
    imageResult.imageUrl,
    randomUUID(),
  );

  return {
    master_prompt: masterPrompt,
    generated_image_url: generatedImageUrl,
  };
}
