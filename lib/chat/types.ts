import type { ImageModelId } from "@/lib/image-workspace";

export type ChatAttachmentKind = "image" | "video" | "file";

export interface ChatAttachment {
  kind: ChatAttachmentKind;
  mime: string;
  name: string;
  dataUrl: string;
  registryId?: string;
}

export type ChatMessagePart =
  | { type: "text"; text: string }
  | { type: "attachment"; attachment: ChatAttachment };

export interface ChatToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  createdAt: number;
  parts: ChatMessagePart[];
  toolCallId?: string;
  toolCalls?: ChatToolCall[];
}

export interface SkillDocument {
  name: string;
  markdown: string;
}

export interface SkillPackRecord {
  id: string;
  /** ZIP 文件名（管理用，不可在设置页修改） */
  title: string;
  /** 对话页左侧 Skill 条显示名；导入时由 ZIP 内目录名决定，不可在设置里改 */
  displayLabel: string;
  importedAt: number;
  skills: SkillDocument[];
}

export interface ConversationAttachmentEntry {
  id: string;
  messageId: string;
  name: string;
  mime: string;
  kind: ChatAttachmentKind;
  createdAt: number;
  dataUrl: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
  enabledSkillPackIds?: string[];
  attachments?: ConversationAttachmentEntry[];
  /** 对话 Agent 调用 generate_image 时的默认作图模型 */
  preferredImageModelId?: ImageModelId;
}

export interface ChatApiConfig {
  presetId: string;
  modelName: string;
  endpointUrl: string;
  apiKey: string;
}

export interface ChatConversationSummary {
  id: string;
  title: string;
  updatedAt: number;
}
