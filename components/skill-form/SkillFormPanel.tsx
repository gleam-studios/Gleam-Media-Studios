"use client";

import type { SkillFormRunResult, SkillPackRecord } from "@/lib/chat/types";
import { skillPackDisplayLabel } from "@/lib/chat/skill-pack";
import shellStyles from "@/app/shared/shell.module.css";
import { DynamicSkillForm } from "@/components/skill-form/DynamicSkillForm";
import { DynamicSkillOutput } from "@/components/skill-form/DynamicSkillOutput";
import styles from "./skill-form.module.css";

export function SkillFormPanel({
  pack,
  result,
  loading,
  error,
  onSubmit,
}: {
  pack: SkillPackRecord;
  result: SkillFormRunResult | null;
  loading: boolean;
  error: string | null;
  onSubmit: (payload: unknown) => void;
}) {
  if (!pack.inputSchema) return null;

  const label = skillPackDisplayLabel(pack);
  const emptyHint =
    pack.chatUsageHint?.trim() ||
    `## ${label}\n\n填写上方表单并点击「生成分镜」，系统将生成 6 区域提示词与分镜图。`;

  return (
    <div className={styles.panel}>
      <header className={styles.panelHeader}>
        <p className={styles.panelEyebrow}>Skill 表单</p>
        <h2 className={styles.panelTitle}>{label}</h2>
        <p className={styles.panelMeta}>一步提交 · 自动生成提示词与分镜图</p>
      </header>

      <div className={styles.panelGrid}>
        <section className={[shellStyles.card, styles.sectionCard].join(" ")}>
          <div className={shellStyles.cardHead}>
            <div>
              <h3 className={shellStyles.cardTitle}>填写需求</h3>
              <p className={shellStyles.cardSubtitle}>故事、场景与参考资产</p>
            </div>
          </div>
          <DynamicSkillForm inputSchema={pack.inputSchema} disabled={loading} onSubmit={onSubmit} />
        </section>

        <section className={[shellStyles.card, styles.sectionCard].join(" ")}>
          <div className={shellStyles.cardHead}>
            <div>
              <h3 className={shellStyles.cardTitle}>生成结果</h3>
              <p className={shellStyles.cardSubtitle}>
                {loading ? "正在调用模型与生图 API…" : result ? "可预览 Markdown 并复制" : "提交后展示于此"}
              </p>
            </div>
            {loading ? <span className={shellStyles.spinner} aria-hidden /> : null}
          </div>

          {error ? <p className={shellStyles.bannerError}>{error}</p> : null}

          <DynamicSkillOutput outputSchema={pack.outputSchema} result={result} emptyHint={emptyHint} />
        </section>
      </div>
    </div>
  );
}
