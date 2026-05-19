-- 对话页 Skill 显示名与 ZIP 文件名解耦；导入时写入，不在设置页修改。

alter table public.site_skill_packs
  add column if not exists display_label text;

update public.site_skill_packs
set display_label = coalesce(
  display_label,
  nullif(trim(skills -> 0 ->> 'name'), ''),
  title
)
where display_label is null or trim(display_label) = '';

alter table public.site_skill_packs
  alter column display_label set not null;
