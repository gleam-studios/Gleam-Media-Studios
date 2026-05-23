import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { persistSkillAssetToStorage } from "@/lib/db/persist-skill-asset";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BYTES = 12 * 1024 * 1024;

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
      return NextResponse.json({ error: "请上传图片文件" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "仅支持图片格式" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `图片超过 ${Math.round(MAX_BYTES / 1024 / 1024)}MB` },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const url = await persistSkillAssetToStorage(
      supabase,
      user.id,
      bytes,
      file.type || "image/png",
      randomUUID(),
    );

    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "上传失败";
    console.error("[skill-assets/upload]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
