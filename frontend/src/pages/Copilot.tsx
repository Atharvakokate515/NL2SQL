// frontend/src/pages/Copilot.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import Sidebar from "@/components/common/Sidebar";
import ChatMessage from "@/components/common/ChatMessage";
import ChatInput from "@/components/common/ChatInput";
import ThinkingIndicator from "@/components/common/ThinkingIndicator";
import DocUploadModal from "@/components/copilot/DocUploadModal";
import {
  createChat,
  agentChat,
  getCopilotSessions,
  getCopilotHistory,
  deleteCopilotSession,
  renameCopilotSession,
} from "@/api/client";
import type { Message, CopilotSession } from "@/types";

const Copilot: React.FC = () => {
  const [showModal, setShowModal] = useState(true);
  const [chatId, setChatId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<CopilotSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await getCopilotSessions();
      setSessions(data);
    } catch { /* ignore */ }
    setSessionsLoading(false);
  }, []);

  useEffect(() => { if (!showModal) fetchSessions(); }, [showModal, fetchSessions]);
  useEffect(scrollToBottom, [messages, thinking]);

  const handleNewChat = async () => {
    try {
      const res = await createChat("New Copilot Chat");
      setChatId(res.chat_id);
      setMessages([]);
      fetchSessions();
    } catch {
      toast.error("Failed to create chat");
    }
  };

  const handleSelectSession = async (id: string | number) => {
    try {
      const data = await getCopilotHistory(id as number);
      setChatId(id as number);
      const restored: Message[] = data.messages.map((m: any, i: number) => ({
        id: `restored-${i}`,
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));
      setMessages(restored);
    } catch {
      toast.error("Failed to load session");
    }
  };

  const handleDeleteSession = async (id: string | number) => {
    setSessions((prev) => prev.filter((s) => s.chat_id !== id));
    try { await deleteCopilotSession(id as number); } catch { fetchSessions(); }
    if (chatId === id) {
      setChatId(null);
      setMessages([]);
    }
  };

  const handleRenameSession = async (id: string | number, title: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.chat_id === id ? { ...s, title } : s))
    );
    try {
      await renameCopilotSession(id as number, title);
    } catch {
      fetchSessions();
    }
  };

  const handleSend = async (text: string) => {
    let currentChatId = chatId;
    if (!currentChatId) {
      try {
        const res = await createChat("New Copilot Chat");
        currentChatId = res.chat_id;
        setChatId(currentChatId);
      } catch {
        toast.error("Failed to create chat");
        return;
      }
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const res = await agentChat("", text, currentChatId!);
      if (res.success) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.response.answer,
          metadata: {
            tool: res.response.tool,
            sqlUsed: res.response.sql_used,
            ragUsed: res.response.rag_used,
            citations: res.response.citations,
            answerGrounded: res.response.answer_grounded,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        fetchSessions();
      } else {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "error",
          content: res.error || "An error occurred",
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    }
    setThinking(false);
  };

  if (showModal) {
    return <DocUploadModal onReady={() => setShowModal(false)} showBack />;
  }

  const sidebarSessions = sessions.map((s) => ({
    id: s.chat_id,
    title: s.title,
    updated_at: s.updated_at,
  }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        sessions={sidebarSessions}
        activeId={chatId}
        onSelect={handleSelectSession}
        onDelete={handleDeleteSession}
        onRename={handleRenameSession}
        onNewChat={handleNewChat}
        loading={sessionsLoading}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50">
          <h2 className="text-sm font-medium text-foreground truncate">
            {sessions.find((s) => s.chat_id === chatId)?.title || "New Chat"}
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground hover:bg-muted/80 transition-colors"
          >
            Manage Docs
          </button>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Ask a question about your documents to get started
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {thinking && <ThinkingIndicator />}
          <div ref={chatEndRef} />
        </div>

        <ChatInput
          onSend={handleSend}
          placeholder="Ask a question about your documents..."
          disabled={thinking}
        />
      </div>
    </div>
  );
};

export default Copilot;