/** 将 Supabase/PostgREST 错误转为用户可读的提示 */
export function formatDbError(e: unknown): string {
  const row =
    e && typeof e === "object"
      ? (e as { code?: string; message?: string; hint?: string })
      : null;
  const code = row?.code;
  const message = row?.message ?? (e instanceof Error ? e.message : String(e));

  if (
    (code === "PGRST204" || code === "42703") &&
    /display_label/i.test(message) &&
    /does not exist|Could not find|schema cache/i.test(message)
  ) {
    return "数据库缺少列 site_skill_packs.display_label。请在 Supabase SQL Editor 执行 supabase/migrations/20260519140000_site_skill_packs_display_label.sql，或运行 supabase db push。";
  }

  if (code === "PGRST205" || /Could not find the table/i.test(message)) {
    const tableMatch = message.match(/'public\.([^']+)'/);
    const table = tableMatch?.[1] ?? "相关";
    return `数据库缺少表 public.${table}。请在项目根目录执行 supabase db push，或在 Supabase Dashboard → SQL Editor 运行 migrations 目录中的 SQL。`;
  }

  return message || "数据库操作失败";
}
