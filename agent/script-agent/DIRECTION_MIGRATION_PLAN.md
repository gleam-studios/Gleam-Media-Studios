# 剧本 Agent 创作方向拆分迁移蓝图

本文是 `agent/script-agent/` 后续拆分 `core/` 与 `directions/` 的唯一规划文档。第二阶段只做规则边界盘点，不移动文件、不修改现有 prompt 正文、不改变 `loadSystemPrompt()` 顺序。

## 0. 当前结论

- 当前生产方向仍是 `bl-short-drama`，现有 legacy 资源整体仍偏向“海外女性向 BL 商业短剧”。
- 第一阶段已建立 `creativeDirectionId` 与 `directions/bl-short-drama/`，但这只是方向系统入口；大部分 BL 规则仍散落在 legacy `prompts/`、`templates/`、`knowledge/`、`skills/` 中。
- 第二阶段的交付物是迁移蓝图。第三阶段已建立 `core/` 影子目录，第四阶段已建立 core 预览加载；第五阶段已建立 BL direction shadow 副本；第六阶段已建立 direction shadow 预览加载；第七阶段已生成 prompt migration readiness 收口报告。它们均不改变默认生产加载。
- 本盘点覆盖新增本文前的 51 个 Markdown 资源文件；第三阶段新增 6 个 core Markdown、第五阶段新增 4 个 BL direction shadow Markdown、第七阶段新增 `PROMPT_MIGRATION_READINESS.md` 后，`find agent/script-agent -name '*.md'` 应为 63。

## 1. 分类体系

| 分类 | 含义 | 未来归属 |
| --- | --- | --- |
| `CORE` | 通用编剧底座：阶段推进、产物格式、确认纪律、改编流程、结构化输出 | `core/` |
| `SHORT_DRAMA_SHARED` | 可被多个短剧方向复用的集数、节奏、钩子、卡点、短剧商业方法 | `core/short-drama/` 或 shared direction utility |
| `BL_DIRECTION` | 女频 BL 专属：双男主、女性向情绪、海外 BL 市场、人设默认 | `directions/bl-short-drama/` |
| `ENGLISH_LOCALE` | 英语对白、本地化、Chinglish、Locale 简报 | shared locale module or direction opt-in |
| `PROJECT_CONTEXT` | 系列圣经、Artifact、Gate、资产注册、工程注入协作 | `core/project-context/` |
| `REFERENCE_ONLY` | 人类维护说明或按需参考，不自动注入主 prompt | keep as docs/reference |
| `DO_NOT_MOVE_YET` | 风险高，短期保持 legacy 原位 | legacy until behavior is locked |

## 2. 文件级盘点

### 2.1 根与方向入口

| 文件 | 当前职责 | 分类 | 未来归属 | 优先级 | 风险 |
| --- | --- | --- | --- | --- | --- |
| `README.md` | 说明当前 resource layout 与迁移方向 | `PROJECT_CONTEXT` | keep root docs | P0 | 低 |
| `directions/bl-short-drama/prompts/profile.md` | 第一阶段新增的 BL 方向 profile | `BL_DIRECTION` | keep direction | P0 | 低 |

### 2.2 prompts

| 文件 | 当前职责 | 分类 | 未来归属 | 优先级 | 风险 |
| --- | --- | --- | --- | --- | --- |
| `prompts/main_prompt.md` | 总控协议、七阶段入口、加载说明 | `CORE` + `BL_DIRECTION` + `ENGLISH_LOCALE` | split after core shadow exists | P1 | 高 |
| `prompts/main-agent-role.md` | 总编剧身份与市场定位 | `BL_DIRECTION` | `directions/bl-short-drama/prompts/role.md` | P1 | 高 |
| `prompts/rule.md` | 最高法则、市场、短剧节奏、资产规则 | `CORE` + `SHORT_DRAMA_SHARED` + `BL_DIRECTION` | split into core rules + BL rules | P1 | 高 |
| `prompts/deliverable-markdown.md` | Markdown 交付与可解析格式 | `CORE` | `core/prompts/deliverable-markdown.md` | P0 | 低 |
| `prompts/skill.md` | 技能字典与 SOP，大量混合规则 | `CORE` + `SHORT_DRAMA_SHARED` + `BL_DIRECTION` + `ENGLISH_LOCALE` | split after rule.md | P2 | 高 |
| `prompts/flowchart.md` | STAGE 1-7 流程、回退、确认、资产规则 | `CORE` + `SHORT_DRAMA_SHARED` + `BL_DIRECTION` | split gradually | P1 | 高 |
| `prompts/script-planning-agent-role.md` | 阶段前规划、集数与规模约束 | `CORE` + `SHORT_DRAMA_SHARED` | `core/prompts/script-planning-agent-role.md` | P1 | 中 |
| `prompts/lines-agent-role.md` | 真人对白医生，当前写死女性向 BL | `BL_DIRECTION` + `CORE` | split dialogue core + BL dialogue | P2 | 高 |
| `prompts/english-lines-agent-role.md` | 英语对白本地化与 Chinglish 排雷 | `ENGLISH_LOCALE` | shared locale module | P1 | 中 |
| `prompts/planning-session-prompt.md` | 原创立项策划轻量 prompt | `CORE` + `BL_DIRECTION` | split once general direction exists | P2 | 中 |
| `prompts/adaptation-analyze.md` | 改编原文分析 | `CORE` + `SHORT_DRAMA_SHARED` | `core/prompts/adaptation-analyze.md` with direction addendum | P1 | 中 |
| `prompts/adaptation-discuss.md` | 改编策略讨论 | `CORE` + `SHORT_DRAMA_SHARED` + `BL_DIRECTION` | split after analyze | P2 | 中 |
| `prompts/adaptation-planner.md` | 改编规划师确认书 | `CORE` + `BL_DIRECTION` | split after planning field schema is stable | P2 | 中 |
| `prompts/generate-series-bible.md` | 由确认书生成系列圣经 | `PROJECT_CONTEXT` + `CORE` | `core/prompts/generate-series-bible.md` | P1 | 中 |
| `prompts/generate-settings.md` | 设定集生成 | `PROJECT_CONTEXT` + `CORE` | `core/prompts/generate-settings.md` | P1 | 中 |
| `prompts/prefill-meta.md` | 立项元数据 JSON 抽取 | `CORE` | `core/prompts/prefill-meta.md` | P0 | 低 |

### 2.3 knowledge

| 文件 | 当前职责 | 分类 | 未来归属 | 优先级 | 风险 |
| --- | --- | --- | --- | --- | --- |
| `knowledge/00_README.md` | knowledge 目录维护说明，不注入模型 | `REFERENCE_ONLY` | keep docs | P0 | 低 |
| `knowledge/01_EPISODE_SPECS.md` | 短剧集数、STAGE 7 结构、英语台词默认 | `SHORT_DRAMA_SHARED` + `ENGLISH_LOCALE` | shared short-drama + locale opt-in | P1 | 中 |
| `knowledge/02_SHORTFORM_PACING.md` | 短剧秒级节奏与信息密度 | `SHORT_DRAMA_SHARED` | shared short-drama | P1 | 低 |
| `knowledge/03_SERIES_BIBLE.md` | 系列圣经结构与里程碑 | `PROJECT_CONTEXT` + `SHORT_DRAMA_SHARED` | core project-context + short-drama sections | P1 | 中 |
| `knowledge/04_HOOK_LEXICON.md` | 钩子词表和轮换 | `SHORT_DRAMA_SHARED` | shared short-drama | P1 | 低 |
| `knowledge/05_CLIFFHANGER_RULES.md` | 集尾与接戏规则 | `SHORT_DRAMA_SHARED` | shared short-drama | P1 | 低 |
| `knowledge/06_CAST_VOICE.md` | 短剧声线与辨识度原则 | `SHORT_DRAMA_SHARED` + `BL_DIRECTION` | split voice core + BL relation notes | P2 | 中 |
| `knowledge/07_PLATFORM_SAFE.md` | 平台与合规护栏 | `CORE` + `SHORT_DRAMA_SHARED` | core safety with direction overrides | P2 | 低 |

### 2.4 templates

| 文件 | 当前职责 | 分类 | 未来归属 | 优先级 | 风险 |
| --- | --- | --- | --- | --- | --- |
| `templates/Synopsis Template.md` | STAGE 1 梗概与项目定位 | `CORE` + `BL_DIRECTION` | split only after core shadow validates | P2 | 高 |
| `templates/Characters Template.md` | STAGE 2 人物矩阵、双男主与海外默认 | `BL_DIRECTION` + `CORE` | direction override template | P2 | 高 |
| `templates/Three-Act Structure Template.md` | STAGE 3 三幕结构 | `CORE` + `SHORT_DRAMA_SHARED` | core template with short-drama addendum | P1 | 中 |
| `templates/Key Events Template.md` | STAGE 4 核心事件与集数范围 | `CORE` + `SHORT_DRAMA_SHARED` | core template | P1 | 中 |
| `templates/Settings Template.md` | STAGE 5 资产注册 | `PROJECT_CONTEXT` + `CORE` | core project-context template | P1 | 中 |
| `templates/Episode Outline Template.md` | STAGE 6 分集大纲与钩子 | `CORE` + `SHORT_DRAMA_SHARED` + `PROJECT_CONTEXT` | core + short-drama addendum | P2 | 高 |
| `templates/Episode Development Script Template.md` | STAGE 7 开发版，英语对白与短剧结构 | `CORE` + `SHORT_DRAMA_SHARED` + `ENGLISH_LOCALE` | split after locale opt-in | P2 | 高 |
| `templates/Episode Final Script Template.md` | STAGE 7 交付版 | `CORE` + `ENGLISH_LOCALE` | split with development template | P2 | 高 |

### 2.5 skills

| 文件 | 当前职责 | 分类 | 未来归属 | 优先级 | 风险 |
| --- | --- | --- | --- | --- | --- |
| `skills/00_INDEX.md` | skills 索引与 short-drama references 调度表 | `PROJECT_CONTEXT` + `SHORT_DRAMA_SHARED` | split index per core/direction | P2 | 中 |
| `skills/skill-series-architecture.md` | 系列架构、集数伸缩、里程碑 | `SHORT_DRAMA_SHARED` + `CORE` | shared short-drama skill | P1 | 低 |
| `skills/skill-episode-1min-beat.md` | 1-2 分钟单集节拍 | `SHORT_DRAMA_SHARED` | shared short-drama skill | P1 | 中 |
| `skills/skill-batch-outline.md` | 5-10 集粗纲批量 | `SHORT_DRAMA_SHARED` + `PROJECT_CONTEXT` | shared short-drama skill | P1 | 低 |
| `skills/skill-rewrite-for-punch.md` | 强化 punch 与短剧钩子 | `SHORT_DRAMA_SHARED` | shared short-drama skill | P1 | 低 |
| `skills/skill-continuity-pass.md` | 连续性检查 | `CORE` + `SHORT_DRAMA_SHARED` | core skill with short-drama hook check | P1 | 低 |
| `skills/skill-english-dialogue-localization.md` | Locale 简报与英语对白 | `ENGLISH_LOCALE` | shared locale module | P1 | 中 |
| `skills/short-drama/README.md` | short-drama references 使用说明 | `REFERENCE_ONLY` | keep with references | P0 | 低 |

### 2.6 short-drama references

| 文件 | 当前职责 | 分类 | 未来归属 | 优先级 | 风险 |
| --- | --- | --- | --- | --- | --- |
| `skills/short-drama/references/genre-guide.md` | 微短剧题材清单，非 BL 特批参考 | `REFERENCE_ONLY` + `SHORT_DRAMA_SHARED` | keep reference-only | P3 | 中 |
| `skills/short-drama/references/hook-design.md` | 钩子设计手册 | `REFERENCE_ONLY` + `SHORT_DRAMA_SHARED` | keep reference-only | P3 | 低 |
| `skills/short-drama/references/opening-rules.md` | 开场规则 | `REFERENCE_ONLY` + `SHORT_DRAMA_SHARED` | keep reference-only | P3 | 中 |
| `skills/short-drama/references/rhythm-curve.md` | 节奏曲线 | `REFERENCE_ONLY` + `SHORT_DRAMA_SHARED` | keep reference-only | P3 | 低 |
| `skills/short-drama/references/satisfaction-matrix.md` | 爽点矩阵 | `REFERENCE_ONLY` + `SHORT_DRAMA_SHARED` | keep reference-only | P3 | 低 |
| `skills/short-drama/references/compliance-checklist.md` | 合规检查清单 | `REFERENCE_ONLY` + `CORE` | keep reference-only | P3 | 中 |
| `skills/short-drama/references/villain-design.md` | 反派设计 | `REFERENCE_ONLY` + `SHORT_DRAMA_SHARED` | keep reference-only | P3 | 低 |
| `skills/short-drama/references/paywall-design.md` | 付费卡点 | `REFERENCE_ONLY` + `SHORT_DRAMA_SHARED` | keep reference-only | P3 | 低 |

### 2.7 context assets

| 文件 | 当前职责 | 分类 | 未来归属 | 优先级 | 风险 |
| --- | --- | --- | --- | --- | --- |
| `context_assets/character_reference.md` | 角色关系锚点、声线、禁忌、资产格式参考 | `PROJECT_CONTEXT` + `BL_DIRECTION` | split example-neutral core schema + BL examples | P2 | 高 |

## 3. BL 硬编码高风险点

这些文件不能直接搬或删。它们是当前 BL 能力的主要来源，第三阶段只能先复制/标注，第四阶段才能拆分。

| 文件 | 高风险原因 | 迁移策略 |
| --- | --- | --- |
| `prompts/main-agent-role.md` | 标题与身份直接定义为海外女性向 BL 短剧总编剧 | 复制为 BL direction role，再做 core role |
| `prompts/rule.md` | 最高法则混合 BL 市场、短剧逻辑、资产/Gate 纪律 | 先抽 core 条款，再保留 BL 条款到 direction |
| `prompts/skill.md` | 双男主关系、短剧压缩、对白、STAGE 技能混在一起 | 先按章节拆标签，不一次性拆文件 |
| `prompts/flowchart.md` | 阶段流程是 core，但含双男主、海外默认、英语 STAGE 7 | 第三阶段只复制通用流程，暂不删 legacy |
| `templates/Characters Template.md` | 写死海外女性向 BL、双男主、海外本地化 | 未来做 direction override，不先通用化 |
| `templates/Synopsis Template.md` | 项目定位可能含默认市场和短剧体量 | 等 general-screenplay 需求明确后拆 |
| `prompts/lines-agent-role.md` | 明确女性向 BL 短剧对白医生 | split into dialogue-core + BL-dialogue |

## 4. 可优先抽 core 的低风险内容

第三阶段可以先建立 `core/` 影子目录，只复制这些内容，不接管生产加载：

- 七阶段状态机骨架：STAGE 1-7 名称、前置确认、回退原则。
- Markdown 交付规范：标题层级、不要输出多余解释、结构化可解析。
- Artifact / 资产注册规则：`∆分类`、`@名称`、STAGE 5 注册、STAGE 6/7 引用一致。
- 改编流程骨架：原文分析、策略讨论、确认书、系列圣经。
- 系列圣经作为项目级 SSOT 的原则。
- 连续性检查：人物、时间线、因果、事件链、资产引用。
- 工程协作规则：项目上下文注入、已验收阶段、Gate 未过不越级。

## 5. 暂不迁移内容

- 当前 `loadSystemPrompt()` 的 legacy 加载顺序。
- 现有 `templates/*.md` 文件本体。
- `skills/short-drama/references/` 的按需、不递归、不自动注入规则。
- `context_assets/character_reference.md` 的具体结构，直到有替代 core schema。
- STAGE 7 英语对白默认，直到 general direction 明确是否 opt-in。
- 任何会改变现有 `bl-short-drama` 输出风格的删减。

## 6. 第三阶段实际产物

第三阶段只新增 shadow core 文档和 manifest，不修改 `loadSystemPrompt()`，不移动 legacy 文件，不改变当前生产行为。

| 文件 | 职责 | 来源 |
| --- | --- | --- |
| `core/README.md` | 说明 shadow core 边界、禁区和后续迁移顺序 | 本文第 4 节 |
| `core/core-manifest.json` | 声明 core 模块、来源文件、`runtimeLoaded: false` 与 loader 禁止自动读取策略 | 本文第 4 节 |
| `core/prompts/deliverable-markdown.md` | 通用 Markdown 交付与资产引用格式 | `prompts/deliverable-markdown.md`、`templates/Settings Template.md` |
| `core/prompts/stage-protocol.md` | 通用 STAGE 1-7 状态机、Gate、回退和输出纪律 | `prompts/flowchart.md`、`prompts/main_prompt.md`、`prompts/script-planning-agent-role.md` |
| `core/prompts/project-context.md` | 系列圣经、工程注入、Artifact、Gate、资产注册优先级 | `prompts/generate-series-bible.md`、`prompts/generate-settings.md`、`lib/project-context.ts`、`lib/stage-gate.ts` |
| `core/prompts/adaptation-workflow.md` | 改编分析、讨论、规划确认书、系列圣经交接骨架 | `prompts/adaptation-analyze.md`、`prompts/adaptation-discuss.md`、`prompts/adaptation-planner.md` |
| `core/skills/continuity-pass.md` | 通用连续性检查：设定、人物、时间线、因果、伏笔、资产引用 | `skills/skill-continuity-pass.md`、`knowledge/03_SERIES_BIBLE.md`、`context_assets/character_reference.md` |

## 7. 第四阶段实际产物

第四阶段只让 `core/` 具备显式预览能力，不改变应用 API 的默认生产加载。

| 项目 | 状态 |
| --- | --- |
| `loadSystemPrompt(creativeDirectionId, options)` | 新增 `coreMode?: "off" \| "shadow-preview"`；默认 `"off"` |
| 默认生产 prompt | 仍为 legacy ordered prompts → direction → knowledge → skills → templates |
| shadow-preview prompt | legacy ordered prompts → core shadow modules → direction → knowledge → skills → templates |
| core 模块来源 | 只读取 `core/core-manifest.json` 的 `modules` 列表，不扫描目录 |
| preview marker | 每个模块以 `<!-- core-shadow: ... -->` 标记，便于 parity 检查 |
| parity smoke | `npm run smoke:prompt-parity` |

## 8. 第五阶段实际产物

第五阶段只把 BL 专属规则复制成 direction shadow 文件，不加入 `promptFiles`，不修改 loader，不改变生产 prompt。

| 文件 / 字段 | 职责 | 来源 |
| --- | --- | --- |
| `directions/bl-short-drama/prompts/role.md` | BL 总编剧身份、海外女性向定位、工作气质 | `prompts/main-agent-role.md` |
| `directions/bl-short-drama/prompts/market-and-relationship.md` | 海外市场、女性向情绪结构、双男主关系、人设默认、改编偏好 | `prompts/main-agent-role.md`、`prompts/rule.md`、`prompts/flowchart.md` |
| `directions/bl-short-drama/prompts/dialogue.md` | BL 对白医生、去 AI 味、关系攻防与潜台词 | `prompts/lines-agent-role.md`、`prompts/main-agent-role.md` |
| `directions/bl-short-drama/prompts/english-locale.md` | 英语对白、Locale 简报、Chinglish 排雷 | `prompts/english-lines-agent-role.md`、`skills/skill-english-dialogue-localization.md` |
| `direction.json.migrationShadowPromptFiles` | 迁移用只读清单；当前运行时代码忽略 | 本阶段新增 |
| `npm run smoke:direction-shadow` | 确认 shadow 文件存在、未进入 `promptFiles`、未进入默认或 core-preview prompt | 本阶段新增 |

## 9. 第六阶段实际产物

第六阶段让 BL direction shadow 具备显式预览加载能力，但默认生产 prompt 仍不加载它们。

| 项目 | 状态 |
| --- | --- |
| `loadSystemPrompt(creativeDirectionId, options)` | 新增 `directionMode?: "stable" \| "shadow-preview"`；默认 `"stable"` |
| 默认生产 prompt | legacy ordered prompts → stable direction `promptFiles` → knowledge → skills → templates |
| core-only preview | legacy ordered prompts → core shadow modules → stable direction `promptFiles` → knowledge → skills → templates |
| direction-only preview | legacy ordered prompts → stable direction `promptFiles` → direction shadow files → knowledge → skills → templates |
| combined preview | legacy ordered prompts → core shadow modules → stable direction `promptFiles` → direction shadow files → knowledge → skills → templates |
| direction shadow 来源 | 只读取 `direction.json.migrationShadowPromptFiles`，不扫描目录 |
| direction shadow marker | 每个模块以 `<!-- direction-shadow: ... -->` 标记，便于 parity 检查 |
| direction shadow smoke | `npm run smoke:direction-shadow` |

## 10. 第七阶段实际产物

第七阶段是本轮方向系统基础设施的收口阶段。它生成可复跑的迁移就绪报告，不删除 legacy，不改变生产加载，不把 core shadow 或 direction shadow 接入生产。

| 项目 | 状态 |
| --- | --- |
| `scripts/report-script-agent-migration-readiness.ts` | 读取 default、core-only、direction-only、combined preview 四种 prompt，校验默认 hash/长度，并写入 readiness 报告 |
| `npm run report:script-agent-migration` | 可复跑报告命令 |
| `PROMPT_MIGRATION_READINESS.md` | 固化四种 prompt hash、长度、marker 顺序、core 模块清单、BL direction shadow 映射、不可删区域 |
| 默认生产 prompt | hash 保持 `a5768b615ed993685c5351fa3f22af0a1aff17d98815a93fe677c290be135dca`，长度保持 `88902` |

## 11. 下一轮建议

1. 先做只读 duplicate-rule diff 报告，对比 legacy 段落与 direction/core shadow 段落的重复、缺口和冲突。
2. 第一轮真实删减只选一个窄区域，例如 BL 身份定位或英语 Locale，不同时动 main prompt、template 和 skill。
3. 删减前建立 prompt 快照和关键链路 fixtures，接受默认 prompt hash 会发生可解释变化。
4. `main_prompt` 总控、templates、knowledge、skills references、`context_assets` 继续列为不可直接删除区域，直到有替代加载与解析契约。

## 12. 验收清单

- 本文覆盖新增本文前所有 51 个 Markdown 资源文件。
- 第二阶段没有修改 legacy prompt 正文，没有移动文件，没有改变 prompt-loader。
- 第三阶段新增 `core/` 影子目录，但不接入 loader，不改变生产 prompt。
- 第四阶段新增 `coreMode: "shadow-preview"` 预览加载，但默认 `loadSystemPrompt("bl-short-drama")` 仍不加载 core。
- 第五阶段新增 BL direction shadow 文件和 `migrationShadowPromptFiles`，但不加入 `promptFiles`，不改变默认生产 prompt。
- 第六阶段新增 `directionMode: "shadow-preview"` 预览加载，但默认 `loadSystemPrompt("bl-short-drama")` 仍不加载 direction shadow。
- 第七阶段新增 `PROMPT_MIGRATION_READINESS.md` 和 `npm run report:script-agent-migration`，并确认默认 prompt hash/长度仍不变。
- 后续实现者能根据本文判断一个规则应该进入 `core/`、`directions/bl-short-drama/`、shared short-drama、locale，还是暂缓。
- 现有业务判断保持不变：`bl-short-drama` 是当前唯一稳定生产方向。
