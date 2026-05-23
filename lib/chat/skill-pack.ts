import JSZip from "jszip";
import type { SkillDocument, SkillJsonSchema, SkillPackRecord } from "@/lib/chat/types";

export const MAX_SKILL_ZIP_BYTES = 15 * 1024 * 1024;
export const MAX_SKILL_BODY_CHARS = 48 * 1024;
const MAX_REFERENCE_CHARS = 8000;

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

function isSkillMdPath(fileName: string): boolean {
  return /(^|\/)skill\.md$/i.test(normalizePath(fileName));
}

function parentDir(path: string): string {
  const n = normalizePath(path);
  const i = n.lastIndexOf("/");
  return i <= 0 ? "" : n.slice(0, i);
}

function findZipPath(paths: string[], matcher: (norm: string) => boolean): string | null {
  for (const p of paths) {
    const norm = normalizePath(p).toLowerCase();
    if (matcher(norm)) return p;
  }
  return null;
}

async function readZipJson(zip: JSZip, path: string | null): Promise<SkillJsonSchema | null> {
  if (!path) return null;
  const entry = zip.file(path);
  if (!entry) return null;
  try {
    const text = await entry.async("string");
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as SkillJsonSchema;
  } catch {
    return null;
  }
}

async function readZipText(zip: JSZip, path: string | null): Promise<string | null> {
  if (!path) return null;
  const entry = zip.file(path);
  if (!entry) return null;
  const text = (await entry.async("string")).trim();
  return text || null;
}

function extractInterfaceFiles(paths: string[]) {
  const inputPath = findZipPath(
    paths,
    (norm) => norm === "interface/input.json" || norm.endsWith("/interface/input.json"),
  );
  const outputPath = findZipPath(
    paths,
    (norm) => norm === "interface/output.json" || norm.endsWith("/interface/output.json"),
  );
  const optimizedPath = findZipPath(paths, (norm) => {
    if (norm === "optimized_system_prompt.md") return true;
    if (norm.endsWith("/optimized_system_prompt.md")) return true;
    return norm === "agent_core/optimized_system_prompt.md";
  });
  return { inputPath, outputPath, optimizedPath };
}

async function parseSkillZipBuffer(buffer: ArrayBuffer, fileName: string): Promise<SkillPackRecord> {
  if (buffer.byteLength > MAX_SKILL_ZIP_BYTES) {
    throw new Error(`ZIP 超过 ${Math.round(MAX_SKILL_ZIP_BYTES / 1024 / 1024)}MB`);
  }

  const zip = await JSZip.loadAsync(buffer);
  const paths: string[] = [];
  zip.forEach((relPath) => {
    if (!relPath.endsWith("/")) paths.push(normalizePath(relPath));
  });

  const skillMdPaths = paths.filter(isSkillMdPath);
  if (skillMdPaths.length === 0) {
    throw new Error("ZIP 内未找到 SKILL.md（任意目录下均可）");
  }

  const skills: SkillDocument[] = [];
  const seenFolders = new Set<string>();

  for (const skillPath of skillMdPaths.sort()) {
    const folder = parentDir(skillPath);
    const folderKey = folder || "__root__";
    if (seenFolders.has(folderKey)) continue;
    seenFolders.add(folderKey);

    const entry = zip.file(skillPath);
    if (!entry) continue;

    let body = await entry.async("string");
    if (body.length > MAX_SKILL_BODY_CHARS) {
      body = `${body.slice(0, MAX_SKILL_BODY_CHARS)}\n\n…(已截断，单 skill 上限 ${MAX_SKILL_BODY_CHARS} 字符)`;
    }

    const refPrefix = folder ? `${folder}/references/` : "references/";
    const refPaths = paths
      .filter((p) => {
        const norm = normalizePath(p);
        return norm.toLowerCase().startsWith(refPrefix.toLowerCase()) && /\.md$/i.test(norm);
      })
      .sort();

    let extra = "";
    for (const rp of refPaths) {
      const f = zip.file(rp);
      if (!f) continue;
      let txt = await f.async("string");
      if (txt.length > MAX_REFERENCE_CHARS) {
        txt = `${txt.slice(0, MAX_REFERENCE_CHARS)}\n…(截断)`;
      }
      const base = rp.split("/").pop() || rp;
      extra += `\n\n--- reference: ${base} ---\n\n${txt}`;
    }

    const displayName = folder ? folder.split("/").pop() || folder : fileName.replace(/\.zip$/i, "") || "root";

    skills.push({
      name: displayName,
      markdown: body + extra,
    });
  }

  if (skills.length === 0) {
    throw new Error("未能解析出有效 SKILL.md 内容");
  }

  const { inputPath, outputPath, optimizedPath } = extractInterfaceFiles(paths);
  const [inputSchema, outputSchema, optimizedSystemPrompt] = await Promise.all([
    readZipJson(zip, inputPath),
    readZipJson(zip, outputPath),
    readZipText(zip, optimizedPath),
  ]);

  const id = `pack-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const zipTitle = fileName.replace(/\.zip$/i, "") || "skill-pack";
  const displayLabel =
    skills.length === 1 ? skills[0]!.name : skills.map((s) => s.name).join(" · ") || zipTitle;

  return {
    id,
    title: zipTitle,
    displayLabel,
    importedAt: Date.now(),
    skills,
    inputSchema,
    outputSchema,
    optimizedSystemPrompt,
  };
}

/** 对话页 / 设置列表展示用（历史数据无 displayLabel 时回退） */
export function skillPackDisplayLabel(pack: SkillPackRecord): string {
  const label = pack.displayLabel?.trim();
  if (label) return label;
  if (pack.skills.length === 1) return pack.skills[0]!.name;
  return pack.title;
}

export function skillPackHasFormInterface(pack: SkillPackRecord): boolean {
  return Boolean(pack.inputSchema && typeof pack.inputSchema === "object");
}

export async function parseSkillZipFile(file: File): Promise<SkillPackRecord> {
  return parseSkillZipBuffer(await file.arrayBuffer(), file.name);
}

export async function parseSkillZipBlob(blob: Blob, fileName: string): Promise<SkillPackRecord> {
  return parseSkillZipBuffer(await blob.arrayBuffer(), fileName);
}
