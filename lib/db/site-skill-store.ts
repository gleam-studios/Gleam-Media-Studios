import type { SupabaseClient } from "@supabase/supabase-js";
import { skillPackDisplayLabel } from "@/lib/chat/skill-pack";
import type { SkillPackRecord } from "@/lib/chat/types";

type SiteSkillPackRow = {
  id: string;
  title: string;
  skills: unknown;
  imported_at: string;
  display_label?: string | null;
};

function rowToSkillPack(row: SiteSkillPackRow): SkillPackRecord {
  const skills = (Array.isArray(row.skills) ? row.skills : []) as SkillPackRecord["skills"];
  const pack: SkillPackRecord = {
    id: row.id,
    title: row.title,
    displayLabel: row.display_label?.trim() ?? "",
    importedAt: new Date(row.imported_at).getTime(),
    skills,
  };
  if (!pack.displayLabel) {
    pack.displayLabel = skillPackDisplayLabel(pack);
  }
  return pack;
}

function isMissingDisplayLabelColumn(e: unknown): boolean {
  const message =
    e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
      ? (e as { message: string }).message
      : e instanceof Error
        ? e.message
        : String(e);
  return /display_label/i.test(message) && /does not exist|Could not find|schema cache/i.test(message);
}

export async function listSiteSkillPacks(supabase: SupabaseClient): Promise<SkillPackRecord[]> {
  const withLabel = await supabase
    .from("site_skill_packs")
    .select("id, title, display_label, skills, imported_at")
    .order("imported_at", { ascending: false });

  if (!withLabel.error) {
    return (withLabel.data ?? []).map((row) => rowToSkillPack(row as SiteSkillPackRow));
  }

  if (!isMissingDisplayLabelColumn(withLabel.error)) {
    throw withLabel.error;
  }

  const legacy = await supabase
    .from("site_skill_packs")
    .select("id, title, skills, imported_at")
    .order("imported_at", { ascending: false });

  if (legacy.error) throw legacy.error;
  return (legacy.data ?? []).map((row) => rowToSkillPack(row as SiteSkillPackRow));
}

export async function insertSiteSkillPack(supabase: SupabaseClient, pack: SkillPackRecord): Promise<void> {
  const importedAt = new Date(pack.importedAt).toISOString();
  const withLabel = await supabase.from("site_skill_packs").insert({
    id: pack.id,
    title: pack.title,
    display_label: pack.displayLabel,
    skills: pack.skills,
    imported_at: importedAt,
  });

  if (!withLabel.error) return;

  if (!isMissingDisplayLabelColumn(withLabel.error)) {
    throw withLabel.error;
  }

  const legacy = await supabase.from("site_skill_packs").insert({
    id: pack.id,
    title: pack.title,
    skills: pack.skills,
    imported_at: importedAt,
  });
  if (legacy.error) throw legacy.error;
}

export async function updateSiteSkillPackDisplayLabel(
  supabase: SupabaseClient,
  id: string,
  displayLabel: string,
): Promise<SkillPackRecord> {
  const label = displayLabel.trim();
  if (!label) {
    throw new Error("显示名不能为空");
  }

  const { data, error } = await supabase
    .from("site_skill_packs")
    .update({ display_label: label })
    .eq("id", id)
    .select("id, title, display_label, skills, imported_at")
    .single();

  if (error) {
    if (isMissingDisplayLabelColumn(error)) {
      throw new Error("数据库缺少 display_label 列，无法保存显示名。请执行迁移 SQL。");
    }
    throw error;
  }
  if (!data) {
    throw new Error("Skill 包不存在");
  }
  return rowToSkillPack(data as SiteSkillPackRow);
}

export async function deleteSiteSkillPack(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("site_skill_packs").delete().eq("id", id);
  if (error) throw error;
}
