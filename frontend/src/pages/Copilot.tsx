// frontend/src/pages/Copilot.tsx
// CHANGES FROM ORIGINAL:
//   + import HowToUseModal
//   + import BookOpen from lucide-react
//   + const [showHowTo, setShowHowTo] = useState(false);
//   + <HowToUseModal> rendered in JSX
//   + "How to Use" button in context bar

import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { AppSidebar } from "@/components/common/Sidebar";
import { ChatMessage } from "@/components/common/ChatMessage";
import { ChatInput } from "@/components/common/ChatInput";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";
import { DocUploadModal } from "@/components/copilot/DocUploadModal";
import { HowToUseModal } from "@/components/common/HowToUseModal";   // ← NEW
import { Message, CopilotSession } from "@/types";
import {
  getCopilotSessions, getCopilotHistory, deleteCopilotSession,
  agentChat, createChat, patchCopilotSession,
} from "@/api/client";
import { FileText, BookOpen } from "lucide-react";   // ← BookOpen NEW
import { useNavigate } from "react-router-dom";

const Copilot = () => {
  const navigate = useNavigate();
  const { docsReady, dbUrl } = useApp();
  const [showModal, setShowModal] = useState(!docsReady);
  const [showHowTo, setShowHowTo] = useState(false);   // ← NEW
  const [sessions, setSessions] = useState<CopilotSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const data = await getCopilotSessions();
      setSessions(data || []);
    } catch { /* ignore */ } finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  const selectSession = async (id: string | number) => {
    try {
      const hist = await getCopilotHistory(id as number);
      setChatId(id as number);
      const msgs: Message[] = [];
      const history = hist.messages || hist.history || [];
      for (const h of history) {
        if (h.role === "user") {
          msgs.push({ id: crypto.randomUUID(), role: "user", content: h.content });
        } else if (h.role === "assistant") {
          msgs.push({
            id:       crypto.randomUUID(),
            role:     "assistant",
            content:  typeof h.content === "string" ? h.content : (h.content?.answer || ""),
            metadata: { tool: h.tool_used },
          });
        }
      }
      setMessages(msgs);
    } catch { /* ignore */ }
  };

  const handleNew = async () => {
    try {
      const res = await createChat();
      setChatId(res.chat_id);
      setMessages([]);
      loadSessions();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string | number) => {
    setSessions(prev => prev.filter(s => s.chat_id !== id));
    if (chatId === id) { setChatId(null); setMessages([]); }
    try { await deleteCopilotSession(id as number); } catch { /* ignore */ }
  };

  const handleRename = async (id: string | number, title: string) => {
    setSessions(prev => prev.map(s => s.chat_id === id ? { ...s, title } : s));
    try { await patchCopilotSession(id as number, title); } catch { loadSessions(); }
  };

  const handleSend = async (text: string) => {
    let cid = chatId;
    if (!cid) {
      try { const res = await createChat(); cid = res.chat_id; setChatId(cid); }
      catch { return; }
    }

    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setThinking(true);

    try {
      const res = await agentChat({ db_url: dbUrl || "", user_input: text, chat_id: cid! });

      if (!res.success || res.error) {
        setMessages(prev => [...prev, {
          id:       crypto.randomUUID(),
          role:     "error",
          content:  res.error || "Something went wrong. Please try again.",
          metadata: { errorCode: res.error_code || "UNKNOWN_ERROR" },
        }]);
      } else {
        const r = res.response || res;
        setMessages(prev => [...prev, {
          id:      crypto.randomUUID(),
          role:    "assistant",
          content: r.answer || r.summary || "",
          metadata: {
            tool:           r.tool,
            sqlUsed:        r.sql_used,
            ragUsed:        r.rag_used,
            citations:      r.citations,
            answerGrounded: r.answer_grounded,
          },
        }]);
      }
      loadSessions();
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id:       crypto.randomUUID(),
        role:     "error",
        content:  e.message || "Network error. Please try again.",
        metadata: { errorCode: "NETWORK_ERROR" },
      }]);
    } finally { setThinking(false); }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden pt-12">
      <div className="animated-bg" />

      <div className="corner-accent tl" />
      <div className="corner-accent tr" />
      <div className="corner-accent bl" />
      <div className="corner-accent br" />

      <DocUploadModal open={showModal} onClose={() => setShowModal(false)} />

      {/* ── NEW: How to Use Modal ── */}
      <HowToUseModal
        open={showHowTo}
        onClose={() => setShowHowTo(false)}
        pipeline="copilot"
      />

      <AppSidebar
        label="Chats"
        sessions={sessions.map(s => ({ id: s.chat_id, title: s.title, updated_at: s.updated_at }))}
        activeId={chatId}
        onSelect={selectSession}
        onDelete={handleDelete}
        onRename={handleRename}
        onNew={handleNew}
        loading={sessionsLoading}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Slim context bar */}
        <div className="h-10 flex items-center justify-between px-4 border-b border-border bg-surface/80 backdrop-blur-sm shrink-0">
          <span className="text-sm text-foreground truncate font-medium">
            {chatId ? sessions.find(s => s.chat_id === chatId)?.title || "Chat" : "New Chat"}
          </span>

          {/* ── Right side: How to Use + Manage Docs ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* ── NEW: How to Use button ── */}
            <button
              onClick={() => setShowHowTo(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary-light transition-colors px-2 py-1 rounded-lg hover:bg-accent"
            >
              <BookOpen className="w-3.5 h-3.5" />
              How to Use
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-primary-light text-xs hover:text-foreground transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Manage Docs
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto py-4">
            <div className="max-w-3xl mx-auto px-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
                  <p className="text-muted-foreground text-sm">Ask a question about your documents</p>
                  <p className="text-muted-foreground/50 text-xs">Upload PDFs and ask anything — citations included</p>
                  {/* ── NEW: inline hint to open How to Use ── */}
                  <button
                    onClick={() => setShowHowTo(true)}
                    className="mt-2 flex items-center gap-1.5 text-xs text-primary-light/70 hover:text-primary-light transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    See sample queries for FinLend Capital
                  </button>
                </div>
              )}
              {messages.map(m => <ChatMessage key={m.id} message={m} />)}
              {thinking && (
                <div className="flex justify-start mb-3">
                  <div className="bg-surface border border-border rounded-xl px-4 py-3">
                    <ThinkingIndicator />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <ChatInput
            onSend={handleSend}
            disabled={thinking}
            placeholder="Ask a question about your documents…"
          />
        </div>
      </div>
    </div>
  );
};

export default Copilot;