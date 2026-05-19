"use client";

import { useCallback, useRef, useState } from "react";
import styles from "./skill-zip-uploader.module.css";

export function SkillZipUploader({
  maxZipBytes,
  onImportZip,
}: {
  maxZipBytes: number;
  onImportZip: (file: File) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const maxMb = Math.round(maxZipBytes / 1024 / 1024);

  const pickZipFromList = useCallback(
    (files: FileList | File[]) => {
      for (const f of Array.from(files)) {
        const nameOk = f.name.toLowerCase().endsWith(".zip");
        const typeOk = f.type === "application/zip" || f.type === "application/x-zip-compressed";
        if (nameOk || typeOk) {
          void onImportZip(f);
          return;
        }
      }
    },
    [onImportZip],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={[styles.drop, dragOver ? styles.dropActive : ""].filter(Boolean).join(" ")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) pickZipFromList(e.dataTransfer.files);
      }}
    >
      <p className={styles.dropText}>点击或拖入 ZIP 导入</p>
      <p className={styles.dropHint}>须含 SKILL.md · ≤{maxMb}MB</p>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className={styles.hiddenInput}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onImportZip(f);
        }}
      />
    </div>
  );
}
