import type { ChatApiConfig } from "@/lib/chat/types";
import type { Settings } from "@/lib/types";

/** 对话模式与编剧室等共用全站 LLM API（site_settings.llm）。 */
export function llmToChatApiConfig(llm: Settings): ChatApiConfig {
  return {
    presetId: "site-llm",
    modelName: llm.model,
    endpointUrl: llm.apiUrl,
    apiKey: llm.apiKey,
  };
}
