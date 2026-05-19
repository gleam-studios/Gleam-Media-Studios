"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApiSettings } from "@/components/ApiSettingsProvider";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatSessionRail } from "@/components/chat/ChatSessionRail";
import { ChatSkillRail } from "@/components/chat/ChatSkillRail";
import { CHAT_MAX_ATTACHMENT_BYTES } from "@/lib/chat/completion";
import type {
  ChatAttachment,
  ChatAttachmentKind,
  ChatConversation,
  ChatConversationSummary,
  ChatMessage,
  SkillPackRecord,
} from "@/lib/chat/types";
import {
  createChatConversation,
  deleteChatConversationApi,
  fetchChatConversation,
  fetchChatConversations,
  saveChatConversation,
  sendChatAgentTurn,
} from "@/lib/chat-api-client";
import { fetchSiteSkillPacks } from "@/lib/skill-packs-api-client";
import type { ImageModelId } from "@/lib/image-workspace";
import shellStyles from "@/app/shared/shell.module.css";
import styles from "./chat-workspace.module.css";

function attachmentKindFromFile(file: File): ChatAttachmentKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

function ToolResultBody({ text }: { text: string }) {
  try {
    const j = JSON.parse(text) as {
      success?: boolean;
      media_url?: string;
      kind?: string;
      error?: string;
    };
    if (j.success && j.media_url && typeof j.media_url === "string") {
      const u = j.media_url;
      const isVid =
        j.kind === "video" || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u) || u.startsWith("data:video");
      return (
        <div className={styles.toolResult}>
          <pre className={styles.toolJson}>{text.length > 1200 ? `${text.slice(0, 1200)}…` : text}</pre>
          {isVid ? (
            <video src={u} controls className={styles.toolMedia} />
          ) : (
            <img src={u} alt="" className={styles.toolMedia} />
          )}
        </div>
      );
    }
  } catch {
    /* not json */
  }
  return <pre className={styles.toolJson}>{text}</pre>;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className={[shellStyles.bubbleRow, shellStyles.bubbleRowUser].join(" ")}>
        <div className={shellStyles.bubbleUser}>
          {msg.parts.map((p, i) =>
            p.type === "text" ? (
              <p key={i} className={styles.msgText}>
                {p.text}
              </p>
            ) : (
              <p key={i} className={styles.attachMeta}>
                📎 {p.attachment.name}
              </p>
            ),
          )}
        </div>
      </div>
    );
  }

  if (msg.role === "assistant") {
    const text = msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    return (
      <div className={[shellStyles.bubbleRow, shellStyles.bubbleRowAssistant].join(" ")}>
        <div className={shellStyles.bubbleAssistant}>
          {text ? <ChatMarkdown markdown={text} /> : null}
          {msg.toolCalls?.map((tc) => (
            <details key={tc.id} className={styles.toolCall}>
              <summary>工具 · {tc.name}</summary>
              <pre className={styles.toolArgs}>{tc.arguments}</pre>
            </details>
          ))}
        </div>
      </div>
    );
  }

  if (msg.role === "tool") {
    const text = msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    return (
      <div className={[shellStyles.bubbleRow, shellStyles.bubbleRowAssistant].join(" ")}>
        <div className={[shellStyles.bubbleAssistant, styles.toolBubble].join(" ")}>
          <ToolResultBody text={text} />
        </div>
      </div>
    );
  }

  return null;
}

export function ChatWorkspace() {
  const { workspaceReady, imageWorkspace } = useApiSettings();
  const [summaries, setSummaries] = useState<ChatConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [skillPacks, setSkillPacks] = useState<SkillPackRecord[]>([]);
  const [inputText, setInputText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [selectedImageModelId, setSelectedImageModelId] = useState<ImageModelId>("gpt-image-2");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSkillPacks = useCallback(async () => {
    const { skillPacks: packs } = await fetchSiteSkillPacks();
    setSkillPacks(packs);
  }, []);

  const loadLists = useCallback(async () => {
    const [convs, packsRes] = await Promise.all([fetchChatConversations(), fetchSiteSkillPacks()]);
    setSummaries(convs);
    setSkillPacks(packsRes.skillPacks);
    if (!activeId && convs[0]) setActiveId(convs[0].id);
  }, [activeId]);

  useEffect(() => {
    if (!workspaceReady) return;
    void loadLists().catch((e) => setError(e instanceof Error ? e.message : "加载失败"));
  }, [workspaceReady, loadLists]);

  useEffect(() => {
    if (!workspaceReady) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadSkillPacks().catch(() => {});
      }
    };
    const onFocus = () => {
      void loadSkillPacks().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [workspaceReady, loadSkillPacks]);

  useEffect(() => {
    if (!activeId) {
      setConversation(null);
      return;
    }
    void fetchChatConversation(activeId)
      .then(setConversation)
      .catch((e) => setError(e instanceof Error ? e.message : "加载会话失败"));
  }, [activeId]);

  useEffect(() => {
    if (conversation?.preferredImageModelId) {
      setSelectedImageModelId(conversation.preferredImageModelId);
    } else if (!activeId) {
      setSelectedImageModelId("gpt-image-2");
    }
  }, [conversation?.preferredImageModelId, activeId]);

  const handleImageModelChange = (id: ImageModelId) => {
    setSelectedImageModelId(id);
    if (!conversation) return;
    const updated = { ...conversation, preferredImageModelId: id, updatedAt: Date.now() };
    setConversation(updated);
    void saveChatConversation(updated).catch((e) =>
      setError(e instanceof Error ? e.message : "保存生图模型选择失败"),
    );
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation?.messages, isSending]);

  const isSkillEnabled = (packId: string) => {
    if (!conversation) return true;
    if (conversation.enabledSkillPackIds === undefined) return true;
    return conversation.enabledSkillPackIds.includes(packId);
  };

  const toggleSkillPack = async (packId: string, checked: boolean) => {
    if (!conversation) return;
    const allIds = skillPacks.map((p) => p.id);
    let nextIds: string[];
    const cur = conversation.enabledSkillPackIds;
    if (checked) {
      nextIds = cur === undefined ? allIds : [...new Set([...cur, packId])];
    } else {
      nextIds = cur === undefined ? allIds.filter((id) => id !== packId) : cur.filter((id) => id !== packId);
    }
    const allSelected =
      allIds.length > 0 && nextIds.length === allIds.length && allIds.every((id) => nextIds.includes(id));
    const updated = {
      ...conversation,
      enabledSkillPackIds: allSelected ? undefined : nextIds,
      updatedAt: Date.now(),
    };
    const saved = await saveChatConversation(updated);
    setConversation(saved);
  };

  const handleNewChat = async () => {
    const c = await createChatConversation();
    setSummaries((prev) => [{ id: c.id, title: c.title, updatedAt: c.updatedAt }, ...prev]);
    setActiveId(c.id);
    setConversation(c);
    setError(null);
  };

  const handleDeleteConv = async (id: string) => {
    await deleteChatConversationApi(id);
    const next = summaries.filter((s) => s.id !== id);
    setSummaries(next);
    if (activeId === id) {
      setActiveId(next[0]?.id ?? null);
    }
  };

  const commitRename = async () => {
    if (!renamingId || !conversation || renamingId !== conversation.id) return;
    const title = renameDraft.trim() || "新对话";
    const updated = { ...conversation, title, updatedAt: Date.now() };
    const saved = await saveChatConversation(updated);
    setConversation(saved);
    setSummaries((prev) => prev.map((s) => (s.id === saved.id ? { ...s, title: saved.title, updatedAt: saved.updatedAt } : s)));
    setRenamingId(null);
  };

  const addAttachments = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (file.size > CHAT_MAX_ATTACHMENT_BYTES) {
        setError(`「${file.name}」超过 12MB，未添加`);
        continue;
      }
      const dataUrl = await fileToDataUrl(file);
      setPendingAttachments((prev) => [
        ...prev,
        {
          kind: attachmentKindFromFile(file),
          mime: file.type || "application/octet-stream",
          name: file.name || `file-${Date.now()}`,
          dataUrl,
        },
      ]);
    }
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed && pendingAttachments.length === 0) return;
    setError(null);
    setIsSending(true);

    try {
      let convId = activeId;
      let conv = conversation;
      if (!convId || !conv) {
        const created = await createChatConversation();
        convId = created.id;
        conv = created;
        setActiveId(created.id);
        setSummaries((prev) => [{ id: created.id, title: created.title, updatedAt: created.updatedAt }, ...prev]);
      }

      const uid = `msg-${Date.now()}-u`;
      const userParts: ChatMessage["parts"] = [];
      if (trimmed) userParts.push({ type: "text", text: trimmed });
      for (const att of pendingAttachments) {
        const rid = `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        userParts.push({
          type: "attachment",
          attachment: { ...att, registryId: rid },
        });
      }

      const userMessage: ChatMessage = {
        id: uid,
        role: "user",
        createdAt: Date.now(),
        parts: userParts,
      };

      setInputText("");
      setPendingAttachments([]);

      const updated = await sendChatAgentTurn(convId, userMessage, selectedImageModelId);
      setConversation(updated);
      setSummaries((prev) => {
        const row = { id: updated.id, title: updated.title, updatedAt: updated.updatedAt };
        const rest = prev.filter((s) => s.id !== updated.id);
        return [row, ...rest].sort((a, b) => b.updatedAt - a.updatedAt);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.stage}>
      <ChatSkillRail
        skillPacks={skillPacks}
        activeConversationId={activeId}
        isPackEnabled={isSkillEnabled}
        onTogglePack={(id, on) => void toggleSkillPack(id, on).catch((e) => setError(String(e)))}
      />

      <div ref={scrollRef} className={styles.messages}>
        {!conversation?.messages.length ? (
          <p className={styles.emptyChat}>开始新对话，可挂载 Skill、上传附件，Agent 可调用作图 API。</p>
        ) : (
          conversation.messages.map((m) => <MessageBubble key={m.id} msg={m} />)
        )}
        {isSending ? <p className={styles.sending}>思考中…</p> : null}
      </div>

      <ChatComposer
        inputText={inputText}
        onInputTextChange={setInputText}
        pendingAttachments={pendingAttachments}
        onAddFiles={addAttachments}
        onRemoveAttachment={(i) => setPendingAttachments((p) => p.filter((_, j) => j !== i))}
        isSending={isSending}
        onSend={handleSend}
        error={error}
        imageWorkspace={imageWorkspace}
        selectedImageModelId={selectedImageModelId}
        onImageModelChange={handleImageModelChange}
      />

      <ChatSessionRail
        summaries={summaries}
        activeId={activeId}
        renamingId={renamingId}
        renameDraft={renameDraft}
        onRenameDraftChange={setRenameDraft}
        onSelect={setActiveId}
        onNew={() => void handleNewChat()}
        onStartRename={(id, title) => {
          setRenamingId(id);
          setRenameDraft(title);
        }}
        onCommitRename={() => void commitRename()}
        onDelete={(id) => void handleDeleteConv(id)}
      />
    </div>
  );
}
