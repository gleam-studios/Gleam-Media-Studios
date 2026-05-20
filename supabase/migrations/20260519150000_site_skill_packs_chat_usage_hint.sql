-- 对话页空状态说明（管理员在设置里填写，Markdown）

alter table public.site_skill_packs
  add column if not exists chat_usage_hint text null;
