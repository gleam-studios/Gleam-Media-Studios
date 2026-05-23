"use client";

import { useCallback, useRef, useState } from "react";
import type { WidgetProps } from "@rjsf/utils";
import shellStyles from "@/app/shared/shell.module.css";
import styles from "../skill-form.module.css";

const ROLE_OPTIONS = [
  { value: "Character", label: "角色 (Character)" },
  { value: "Scene", label: "场景 (Scene)" },
  { value: "Prop", label: "道具 (Prop)" },
  { value: "Costume", label: "服装 (Costume)" },
  { value: "Style", label: "风格 (Style)" },
];

type AssetRow = {
  role_tag: string;
  asset_url: string;
  description?: string;
};

export function AssetUploaderWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, onChange, schema } = props;
  const rows = (Array.isArray(value) ? value : []) as AssetRow[];
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setRows = useCallback(
    (next: AssetRow[]) => {
      onChange(next.length ? next : undefined);
    },
    [onChange],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || disabled || readonly) return;
    setUploadError(null);
    setUploading(true);
    const next = [...rows];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`「${file.name}」不是图片文件`);
        }
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/skill-assets/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || "上传失败");
        }
        const data = (await res.json()) as { url: string };
        next.push({
          role_tag: "Character",
          asset_url: data.url,
          description: file.name.replace(/\.[^.]+$/, ""),
        });
      }
      setRows(next);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const updateRow = (index: number, patch: Partial<AssetRow>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    setRows(next);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.assetUploader} id={id}>
      {schema.description ? <p className={shellStyles.helpText}>{schema.description}</p> : null}

      {rows.length > 0 ? (
        <div className={styles.assetList}>
          {rows.map((row, index) => (
            <div key={`${row.asset_url}-${index}`} className={styles.assetRow}>
              <img src={row.asset_url} alt="" className={styles.assetThumb} />
              <div className={styles.assetFields}>
                <label className={shellStyles.field}>
                  <span className={shellStyles.fieldLabel}>资产角色</span>
                  <select
                    className={shellStyles.select}
                    value={row.role_tag}
                    disabled={disabled || readonly}
                    onChange={(e) => updateRow(index, { role_tag: e.target.value })}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={shellStyles.field}>
                  <span className={shellStyles.fieldLabel}>资产描述</span>
                  <input
                    className={shellStyles.input}
                    type="text"
                    value={row.description ?? ""}
                    disabled={disabled || readonly}
                    placeholder="可选"
                    onChange={(e) => updateRow(index, { description: e.target.value })}
                  />
                </label>
              </div>
              {!readonly && !disabled ? (
                <button type="button" className={[shellStyles.button, shellStyles.buttonDanger, styles.assetRemove].join(" ")} onClick={() => removeRow(index)}>
                  移除
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.assetDropHint}>尚未添加参考图</div>
      )}

      {!readonly && !disabled ? (
        <div className={styles.assetActions}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className={styles.hiddenFile}
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <button
            type="button"
            className={shellStyles.button}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "上传中…" : "添加参考图"}
          </button>
        </div>
      ) : null}

      {uploadError ? <p className={shellStyles.bannerError}>{uploadError}</p> : null}
    </div>
  );
}
