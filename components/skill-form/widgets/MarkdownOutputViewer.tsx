"use client";

import { useCallback, useState } from "react";
import shellStyles from "@/app/shared/shell.module.css";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import styles from "../skill-form.module.css";

type ViewMode = "preview" | "source";

export function MarkdownOutputViewer({ title, value }: { title: string; value: string }) {
  const [mode, setMode] = useState<ViewMode>("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <section className={styles.outputBlock}>
      <div className={styles.outputBlockHead}>
        <h4 className={styles.outputBlockTitle}>{title}</h4>
        <div className={styles.outputToolbar}>
          <div className={[shellStyles.segmented, shellStyles.segmentedComposer, styles.viewSegmented].join(" ")} role="tablist" aria-label="Markdown 视图">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "preview"}
              className={[shellStyles.segmentedItem, mode === "preview" ? shellStyles.segmentedItemActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setMode("preview")}
            >
              预览
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "source"}
              className={[shellStyles.segmentedItem, mode === "source" ? shellStyles.segmentedItemActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setMode("source")}
            >
              源码
            </button>
          </div>
          <button type="button" className={shellStyles.button} onClick={() => void handleCopy()}>
            {copied ? "已复制" : "复制 Markdown"}
          </button>
        </div>
      </div>

      {mode === "preview" ? (
        <div className={styles.markdownOutput}>
          <ChatMarkdown markdown={value} variant="guide" />
        </div>
      ) : (
        <pre className={styles.markdownSource}>{value}</pre>
      )}
    </section>
  );
}
