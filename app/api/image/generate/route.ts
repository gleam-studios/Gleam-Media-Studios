import { NextRequest } from "next/server";
import { generateImage, parseGenerateRequest } from "@/lib/image-generate";
import { normalizeIncomingImageModel } from "@/lib/image-workspace";
import type { GptImageQuality } from "@/lib/image-workspace";

export async function POST(req: NextRequest) {
  const incoming = await parseGenerateRequest(req);
  if (!incoming.ok) return incoming.response;
  const body = incoming.body;

  const parsedModel = normalizeIncomingImageModel(body.model);
  if (!parsedModel.ok) {
    return Response.json({ error: parsedModel.message, code: "MODEL_CONFIG_INCOMPLETE" }, { status: 400 });
  }

  const rawQ = body.gptImageQuality;
  const gptImageQuality: GptImageQuality | undefined =
    rawQ === "auto" || rawQ === "low" || rawQ === "medium" || rawQ === "high" ? rawQ : undefined;

  try {
    const result = await generateImage({
      model: parsedModel.model,
      prompt: body.prompt ?? "",
      aspectRatio: body.aspectRatio,
      imageSize: body.imageSize,
      gptImageQuality,
      refImages: body.refImages,
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "生图失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
