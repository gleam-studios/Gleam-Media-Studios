import { NextResponse } from "next/server";
import { formatDbError } from "@/lib/db/format-db-error";
import {
  deleteSiteSkillPack,
  insertSiteSkillPack,
  listSiteSkillPacks,
  updateSiteSkillPackDisplayLabel,
} from "@/lib/db/site-skill-store";
import { parseSkillZipBlob } from "@/lib/chat/skill-pack";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const skillPacks = await listSiteSkillPacks(supabase);
    return NextResponse.json({ skillPacks, canManage: true });
  } catch (e) {
    console.error("[site-skill-packs GET]", e);
    return NextResponse.json({ error: formatDbError(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "请上传 ZIP 文件" }, { status: 400 });
    }
    const fileName = file instanceof File ? file.name : "skill-pack.zip";
    const pack = await parseSkillZipBlob(file, fileName);
    await insertSiteSkillPack(supabase, pack);
    return NextResponse.json({ skillPack: pack });
  } catch (e) {
    const message = e instanceof Error ? e.message : "import_failed";
    console.error("[site-skill-packs POST]", e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const body = (await req.json()) as { id?: string; displayLabel?: string };
    const id = body.id?.trim();
    const displayLabel = body.displayLabel?.trim();
    if (!id) return NextResponse.json({ error: "id 必填" }, { status: 400 });
    if (!displayLabel) return NextResponse.json({ error: "显示名不能为空" }, { status: 400 });

    const skillPack = await updateSiteSkillPackDisplayLabel(supabase, id, displayLabel);
    return NextResponse.json({ skillPack });
  } catch (e) {
    const message = e instanceof Error ? e.message : "update_failed";
    console.error("[site-skill-packs PATCH]", e);
    return NextResponse.json({ error: formatDbError(e) || message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id 必填" }, { status: 400 });

    await deleteSiteSkillPack(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[site-skill-packs DELETE]", e);
    return NextResponse.json({ error: formatDbError(e) }, { status: 500 });
  }
}
