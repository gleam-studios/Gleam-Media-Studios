"use client";

import shellStyles from "@/app/shared/shell.module.css";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { MarkdownOutputViewer } from "@/components/skill-form/widgets/MarkdownOutputViewer";
import type { SkillFormRunResult, SkillJsonSchema } from "@/lib/chat/types";
import styles from "./skill-form.module.css";

type OutputProperty = {
  title?: string;
  ui_component?: string;
};

function ImageViewer({ url, title }: { url: string; title?: string }) {
  return (
    <section className={styles.outputBlock}>
      {title ? <h4 className={styles.outputBlockTitle}>{title}</h4> : null}
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.imageLink}>
        <img src={url} alt={title || "生成结果"} className={styles.outputImage} />
      </a>
      <a href={url} download className={[shellStyles.dockTextLink, styles.downloadLink].join(" ")}>
        下载图片
      </a>
    </section>
  );
}

export function DynamicSkillOutput({
  outputSchema,
  result,
  emptyHint,
}: {
  outputSchema?: SkillJsonSchema | null;
  result: SkillFormRunResult | null;
  emptyHint?: string;
}) {
  if (!result) {
    return (
      <div className={styles.outputEmpty}>
        {emptyHint ? <ChatMarkdown markdown={emptyHint} variant="guide" /> : <p>填写表单并提交后，结果将显示在这里。</p>}
      </div>
    );
  }

  const properties = (outputSchema?.properties ?? {}) as Record<string, OutputProperty>;

  return (
    <div className={styles.outputWrap}>
      {Object.entries(properties).map(([key, prop]) => {
        const value = result[key as keyof SkillFormRunResult];
        if (typeof value !== "string" || !value.trim()) return null;
        const title = prop.title || key;

        if (prop.ui_component === "markdown_viewer") {
          return <MarkdownOutputViewer key={key} title={title} value={value} />;
        }

        if (prop.ui_component === "image_viewer") {
          return <ImageViewer key={key} url={value} title={title} />;
        }

        return (
          <section key={key} className={styles.outputBlock}>
            <h4 className={styles.outputBlockTitle}>{title}</h4>
            <pre className={styles.rawOutput}>{value}</pre>
          </section>
        );
      })}
    </div>
  );
}
