import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatConversation,
  ChatConversationSummary,
  ChatMessage,
  ConversationAttachmentEntry,
} from "@/lib/chat/types";

function normalizeEnabledSkillPackIds(ids: string[] | null): string[] | undefined {
  if (!ids?.length) return undefined;
  return [ids[0]!];
}

function rowToConversation(row: {
  id: string;
  title: string;
  messages: unknown;
  attachments: unknown;
  enabled_skill_pack_ids: string[] | null;
  updated_at: string;
}): ChatConversation {
  return {
    id: row.id,
    title: row.title,
    updatedAt: new Date(row.updated_at).getTime(),
    messages: (Array.isArray(row.messages) ? row.messages : []) as ChatMessage[],
    attachments: (Array.isArray(row.attachments) ? row.attachments : []) as ConversationAttachmentEntry[],
    enabledSkillPackIds: normalizeEnabledSkillPackIds(row.enabled_skill_pack_ids),
  };
}

export async function listChatConversations(
  supabase: SupabaseClient,
  userId: string,
): Promise<ChatConversationSummary[]> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

export async function getChatConversation(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<ChatConversation | null> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id, title, messages, attachments, enabled_skill_pack_ids, updated_at")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToConversation(data);
}

export async function createChatConversation(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  title = "新对话",
): Promise<ChatConversation> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("chat_conversations").insert({
    id,
    user_id: userId,
    title,
    messages: [],
    attachments: [],
    updated_at: now,
  });
  if (error) throw error;
  return {
    id,
    title,
    updatedAt: Date.now(),
    messages: [],
    attachments: [],
  };
}

export async function saveChatConversation(
  supabase: SupabaseClient,
  userId: string,
  conv: ChatConversation,
): Promise<void> {
  const { error } = await supabase
    .from("chat_conversations")
    .update({
      title: conv.title,
      messages: conv.messages,
      attachments: conv.attachments ?? [],
      enabled_skill_pack_ids: conv.enabledSkillPackIds ?? null,
      updated_at: new Date(conv.updatedAt).toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", conv.id);

  if (error) throw error;
}

export async function deleteChatConversation(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("chat_conversations").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}
