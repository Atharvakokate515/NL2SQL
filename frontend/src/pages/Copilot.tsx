import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { AppSidebar } from "@/components/common/Sidebar";
import { ChatMessage } from "@/components/common/ChatMessage";
import { ChatInput } from "@/components/common/ChatInput";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";
import { DocUploadModal } from "@/components/copilot/DocUploadModal";
import { Message, CopilotSession } from "@/types";
import { getCopilotSessions, getCopilotHistory, deleteCopilotSession, agentChat, createChat } from "@/api/client";
import { ArrowLeft, FileText } from "lucide-react";

const Copilot = () => {
  const navigate = useNavigate();
  const { docsReady, dbUrl } = useApp();
  const [showModal, setShowModal] = useState(!docsReady);
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
      if (hist.history) {
        for (const h of hist.history) {
          if (h.role === "user") msgs.push({ id: crypto.randomUUID(), role: "user", content: h.content });
          else {
            const r = h.content?.response || h.content || {};
            msgs.push({
              id: crypto.randomUUID(), role: "assistant",
              content: r.answer || r.summary || (typeof h.content === "string" ? h.content : ""),
              metadata: {
                tool: r.tool, sqlUsed: r.sql_used, ragUsed: r.rag_used,
                citations: r.citations, answerGrounded: r.answer_grounded,
              }
            });
          }
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

  const handleSend = async (text: string) => {
    let cid = chatId;
    if (!cid) {
      try {
        const res = await createChat();
        cid = res.chat_id;
        setChatId(cid);
      } catch { return; }
    }

    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setThinking(true);
    try {
      const res = await agentChat({ db_url: dbUrl || "", user_input: text, chat_id: cid! });
      const r = res.response || res;
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "assistant",
        content: r.answer || r.summary || "",
        metadata: {
          tool: r.tool, sqlUsed: r.sql_used, ragUsed: r.rag_used,
          citations: r.citations, answerGrounded: r.answer_grounded,
        }
      }]);
      loadSessions();
    } catch (e: any) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "error", content: e.message }]);
    } finally { setThinking(false); }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="animated-bg" />
      <DocUploadModal open={showModal} onClose={() => setShowModal(false)} />

      <AppSidebar
        label="Chats"
        sessions={sessions.map(s => ({ id: s.chat_id, title: s.title, updated_at: s.updated_at }))}
        activeId={chatId}
        onSelect={selectSession}
        onDelete={handleDelete}
        onNew={handleNew}
        loading={sessionsLoading}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 flex items-center justify-between px-4 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Home
            </button>
            <span className="text-sm text-foreground truncate">{chatId ? sessions.find(s => s.chat_id === chatId)?.title || "Chat" : "New Chat"}</span>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-primary-light text-xs hover:text-foreground transition-colors">
            <FileText className="w-3.5 h-3.5" /> Manage Docs
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(m => <ChatMessage key={m.id} message={m} />)}
          {thinking && <ThinkingIndicator />}
          <div ref={chatEndRef} />
        </div>

        <ChatInput onSend={handleSend} disabled={thinking} placeholder="Ask a question about your documents..." />
      </div>
    </div>
  );
};

export default Copilot;
