/** 未选 Skill（「无」）时对话页空状态文案 */
export const CHAT_NO_SKILL_GUIDE = `## 对话

左侧选 **「无」** 为通用对话，不注入 Skill 文档。

选择某个 **Skill** 后，此处显示管理员在设置里填写的使用说明。`;

export function buildChatEmptyGuideMarkdown(
  pack: { displayLabel: string; chatUsageHint?: string } | null | undefined,
): string {
  if (!pack) return CHAT_NO_SKILL_GUIDE;
  const hint = pack.chatUsageHint?.trim();
  if (hint) return hint;
  const name = pack.displayLabel.trim() || "该 Skill";
  return `## ${name}

管理员尚未填写对话页说明。请前往 **设置 → Skill 包** 编辑「对话页说明」。`;
}
