"use client";

import Link from "next/link";
import { skillPackDisplayLabel } from "@/lib/chat/skill-pack";
import type { SkillPackRecord } from "@/lib/chat/types";
import imageStyles from "@/app/image/image-page.module.css";
import railStyles from "./chat-side-rail.module.css";

function displayTitle(title: string): string {
  const t = title.trim();
  if (t.length <= 16) return t;
  return `${t.slice(0, 15)}…`;
}

/** 与 /image 左侧 mode 栏同结构、同样式（复用 image-page.module.css） */
export function ChatSkillRail({
  skillPacks,
  selectedPackId,
  onSelectPack,
  skillSwitchDisabled = false,
}: {
  skillPacks: SkillPackRecord[];
  /** null 表示「无」、不挂载 Skill */
  selectedPackId: string | null;
  onSelectPack: (packId: string | null) => void;
  /** 保存 Skill 选择进行中时禁用，避免连点 */
  skillSwitchDisabled?: boolean;
}) {
  const noneActive = selectedPackId === null;
  const faded = skillPacks.length + 1 > 7;

  return (
    <aside className={imageStyles.modePanel} aria-label="Skill">
      <div className={[imageStyles.modeColumn, railStyles.railColumn].join(" ")}>
        <div className={imageStyles.modeRail}>
          <div className={imageStyles.modeRailFrame}>
            <div
              className={[imageStyles.modeScrollWrap, faded ? imageStyles.modeScrollWrapFaded : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={imageStyles.modeScroll}>
                <div className={imageStyles.modeList}>
                  <button
                    type="button"
                    disabled={skillSwitchDisabled}
                    title="不使用 Skill"
                    onClick={() => onSelectPack(null)}
                    className={[
                      imageStyles.modeButton,
                      railStyles.railCard,
                      noneActive ? imageStyles.modeButtonActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className={imageStyles.modeName}>无</span>
                  </button>

                  {skillPacks.map((p) => {
                    const active = selectedPackId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={skillSwitchDisabled}
                        title={skillPackDisplayLabel(p)}
                        onClick={() => onSelectPack(p.id)}
                        className={[
                          imageStyles.modeButton,
                          railStyles.railCard,
                          active ? imageStyles.modeButtonActive : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span className={imageStyles.modeName}>{displayTitle(skillPackDisplayLabel(p))}</span>
                      </button>
                    );
                  })}

                  {skillPacks.length === 0 ? (
                    <Link
                      href="/settings?tab=skillPacks"
                      className={[imageStyles.modeButton, railStyles.railCard].join(" ")}
                    >
                      <span className={imageStyles.modeName}>添加 Skill</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
