"use client";

import { useCallback, useEffect, useState } from "react";
import shellStyles from "@/app/shared/shell.module.css";
import { SkillZipUploader } from "@/components/skill/SkillZipUploader";
import { skillPackDisplayLabel } from "@/lib/chat/skill-pack";
import type { SkillPackRecord } from "@/lib/chat/types";
import { MAX_SKILL_ZIP_BYTES } from "@/lib/chat/skill-pack";
import {
  deleteSiteSkillPackApi,
  fetchSiteSkillPacks,
  importSiteSkillPack,
  updateSiteSkillPackDisplayLabelApi,
} from "@/lib/skill-packs-api-client";
import styles from "./skill-packs-panel.module.css";

function formatImportedAt(ts: number): string {
  try {
    return new Date(ts).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return "";
  }
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SkillPacksPanel() {
  const [skillPacks, setSkillPacks] = useState<SkillPackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const reload = useCallback(async () => {
    const data = await fetchSiteSkillPacks();
    setSkillPacks(data.skillPacks);
  }, []);

  useEffect(() => {
    void reload()
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [reload]);

  const flashStatus = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2000);
  };

  const handleImport = async (file: File) => {
    setError(null);
    try {
      const pack = await importSiteSkillPack(file);
      setSkillPacks((prev) => [pack, ...prev.filter((p) => p.id !== pack.id)]);
      flashStatus(`已导入「${skillPackDisplayLabel(pack)}」`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    }
  };

  const startEdit = (pack: SkillPackRecord) => {
    setEditingId(pack.id);
    setEditDraft(skillPackDisplayLabel(pack));
  };

  const commitEdit = async () => {
    if (!editingId) return;
    const label = editDraft.trim();
    if (!label) {
      setError("显示名不能为空");
      return;
    }
    setError(null);
    try {
      const updated = await updateSiteSkillPackDisplayLabelApi(editingId, label);
      setSkillPacks((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingId(null);
      flashStatus("已更新对话页显示名");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteSiteSkillPackApi(id);
      setSkillPacks((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) setEditingId(null);
      flashStatus("已删除");
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <section className={styles.panel}>
      <p className={styles.lead}>
        全站 Skill 包：所有登录用户在「对话」页勾选后注入 Agent。ZIP 须含 <code>SKILL.md</code>，上传后立即写入云端，无需点击顶部「保存」。
        点击铅笔可修改<strong>对话页左侧显示名</strong>（不影响 ZIP 文件名与 Skill 文档内容）。
      </p>

      <SkillZipUploader maxZipBytes={MAX_SKILL_ZIP_BYTES} onImportZip={handleImport} />

      {status ? <p className={styles.statusOk}>{status}</p> : null}
      {error ? <p className={shellStyles.bannerError}>{error}</p> : null}

      <div className={styles.listSection}>
        <div className={styles.listHead}>
          <span>已上传</span>
          <span>{skillPacks.length} 个</span>
        </div>
        {loading ? (
          <p className={styles.empty}>加载中…</p>
        ) : skillPacks.length === 0 ? (
          <p className={styles.empty}>尚未上传 Skill 包。</p>
        ) : (
          <ul className={styles.list}>
            {skillPacks.map((p) => {
              const editing = editingId === p.id;
              return (
                <li key={p.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    {editing ? (
                      <input
                        className={[shellStyles.inputCompact, styles.renameInput].join(" ")}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onBlur={() => void commitEdit()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        aria-label="对话页显示名"
                      />
                    ) : (
                      <span className={styles.rowTitle}>{skillPackDisplayLabel(p)}</span>
                    )}
                    <span className={styles.rowMeta}>
                      ZIP：{p.title} · {p.skills.length} 个 skill · {formatImportedAt(p.importedAt)}
                    </span>
                  </div>
                  <div className={styles.rowActions}>
                    {!editing ? (
                      <button
                        type="button"
                        className={styles.editBtn}
                        aria-label="编辑显示名"
                        onClick={() => startEdit(p)}
                      >
                        <PencilIcon />
                      </button>
                    ) : null}
                    <button type="button" className={styles.deleteBtn} onClick={() => void handleDelete(p.id)}>
                      删除
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
