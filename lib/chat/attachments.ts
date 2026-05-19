import type { ChatMessage, ChatMessagePart, ConversationAttachmentEntry } from "@/lib/chat/types";

export function buildAttachmentsById(
  entries: ConversationAttachmentEntry[] | undefined,
): Record<string, ConversationAttachmentEntry> {
  const m: Record<string, ConversationAttachmentEntry> = {};
  if (!entries?.length) return m;
  for (const e of entries) m[e.id] = e;
  return m;
}

export function compactMessagesForAgentApi(messages: ChatMessage[]): ChatMessage[] {
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUserIdx = i;
      break;
    }
  }

  return messages.map((m, idx) => {
    if (m.role !== "user" && m.role !== "assistant") return m;
    if (idx === lastUserIdx) return m;

    const newParts: ChatMessagePart[] = [];
    for (const part of m.parts) {
      if (part.type === "attachment" && part.attachment.registryId) {
        const a = part.attachment;
        const safeName = a.name.replace(/"/g, "'");
        newParts.push({
          type: "text",
          text:
            `[会话附件 attachment_id="${a.registryId}" name="${safeName}" kind=${a.kind} mime=${a.mime}] ` +
            `二进制未重复附带。请 list_conversation_attachments 查看列表；get_attachment({"attachment_id":"${a.registryId}"}) 查看说明；` +
            `generate_image 的 ref_image_urls 可直接传 "${a.registryId}"（无需粘贴 base64）。`,
        });
      } else {
        newParts.push(part);
      }
    }
    return { ...m, parts: newParts };
  });
}
