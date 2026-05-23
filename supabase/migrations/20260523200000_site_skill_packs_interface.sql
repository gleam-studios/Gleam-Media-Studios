-- Skill form interface schemas (interface/input.json, output.json, optimized_system_prompt.md)

alter table public.site_skill_packs
  add column if not exists input_schema jsonb null,
  add column if not exists output_schema jsonb null,
  add column if not exists optimized_system_prompt text null;
