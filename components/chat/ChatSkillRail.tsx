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
  activeConversationId,
  isPackEnabled,
  onTogglePack,
}: {
  skillPacks: SkillPackRecord[];
  activeConversationId: string | null;
  isPackEnabled: (packId: string) => boolean;
  onTogglePack: (packId: string, enabled: boolean) => void;
}) {
  const items =
    skillPacks.length === 0
      ? [{ kind: "link" as const, id: "__settings__", label: "添加 Skill", href: "/settings?tab=skillPacks" }]
      : skillPacks.map((p) => ({ kind: "skill" as const, pack: p }));

  const faded = items.length > 7;

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
                  {items.map((item) => {
                    if (item.kind === "link") {
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={[imageStyles.modeButton, railStyles.railCard].join(" ")}
                        >
                          <span className={imageStyles.modeName}>{item.label}</span>
                        </Link>
                      );
                    }
                    const p = item.pack;
                    const active = isPackEnabled(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!activeConversationId}
                        title={skillPackDisplayLabel(p)}
                        onClick={() => onTogglePack(p.id, !active)}
                        className={[imageStyles.modeButton, railStyles.railCard, active ? imageStyles.modeButtonActive : ""]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span className={imageStyles.modeName}>{displayTitle(skillPackDisplayLabel(p))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
