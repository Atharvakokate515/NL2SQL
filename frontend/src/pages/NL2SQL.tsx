import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { AppSidebar } from "@/components/common/Sidebar";
import { ChatMessage } from "@/components/common/ChatMessage";
import { ChatInput } from "@/components/common/ChatInput";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";
import { DBConnectionModal } from "@/components/nl2sql/DBConnectionModal";
import { ResultsPanel } from "@/components/nl2sql/ResultsPanel";
import { Message, NL2SQLSession } from "@/types";
import { getNl2sqlSessions, getSessionHistory, deleteNl2sqlSession, chatDb, createNl2sqlSession } from "@/api/client";
import { ArrowLeft, Database } from "lucide-react";

const NL2SQL = () => {
  const navigate = useNavigate();
  const { connected, dbUrl, dbName } = useApp();
  const [showModal, setShowModal] = useState(!connected);
  const [sessions, setSessions] = useState<NL2SQLSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const [currentSql, setCurrentSql] = useState<string>();
  const [currentExecution, setCurrentExecution] = useState<any>();
  const [currentChart, setCurrentChart] = useState<any>();
  const [currentPlan, setCurrentPlan] = useState<any>();
  const [dividerPos, setDividerPos] = useState(55);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const data = await getNl2sqlSessions();
      setSessions(data || []);
    } catch { /* ignore */ } finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => { if (connected) loadSessions(); }, [connected, loadSessions]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);
  useEffect(() => { setShowModal(!connected); }, [connected]);

  const selectSession = async (id: string | number) => {
    try {
      const hist = await getSessionHistory(id as string);
      setSessionId(id as string);
      const msgs: Message[] = [];
      if (hist.history) {
        for (const h of hist.history) {
          if (h.role === "user") msgs.push({ id: crypto.randomUUID(), role: "user", content: h.content });
          else msgs.push({ id: crypto.randomUUID(), role: "assistant", content: h.content?.summary || h.content || "", metadata: h.content });
        }
      }
      setMessages(msgs);
      if (hist.last_sql) setCurrentSql(hist.last_sql);
      if (hist.last_execution) setCurrentExecution(hist.last_execution);
    } catch { /* ignore */ }
  };

  const handleNew = () => {
    setSessionId(null);
    setMessages([]);
    setCurrentSql(undefined);
    setCurrentExecution(undefined);
    setCurrentChart(undefined);
    setCurrentPlan(undefined);
  };

  const handleDelete = async (id: string | number) => {
    setSessions(prev => prev.filter(s => s.session_id !== id));
    if (sessionId === id) handleNew();
    try { await deleteNl2sqlSession(id as string); } catch { /* ignore */ }
  };

  const handleSend = async (text: string, clarResponse?: string, origInput?: string) => {
    let sid = sessionId;
    if (!sid) {
      try {
        const res = await createNl2sqlSession();
        sid = res.session_id;
        setSessionId(sid);
      } catch { return; }
    }

    if (!clarResponse) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    }

    setThinking(true);
    try {
      const res = await chatDb({
        db_url: dbUrl,
        user_input: clarResponse ? (origInput || text) : text,
        session_id: sid!,
        ...(clarResponse ? { clarification_response: clarResponse } : {}),
      });

      if (res.needs_clarification) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: "clarification", content: res.question,
          metadata: { question: res.question, originalInput: clarResponse ? origInput : text }
        }]);
      } else if (res.error) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "error", content: res.error, metadata: { errorCode: res.error_code } }]);
      } else {
        const msg: Message = {
          id: crypto.randomUUID(), role: "assistant",
          content: res.summary || res.answer || "",
          metadata: {
            sql: res.sql, summary: res.summary, chart: res.chart_suggestion,
            execution: res.execution, plan: res.plan, wasRetried: res.was_retried,
          }
        };
        setMessages(prev => [...prev, msg]);
        if (res.sql) setCurrentSql(res.sql);
        if (res.execution) setCurrentExecution(res.execution);
        if (res.chart_suggestion) setCurrentChart(res.chart_suggestion);
        if (res.plan) setCurrentPlan(res.plan);
      }
      loadSessions();
    } catch (e: any) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "error", content: e.message }]);
    } finally { setThinking(false); }
  };

  const onMouseDown = () => { dragging.current = true; };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientY - rect.top) / rect.height) * 100;
      setDividerPos(Math.max(25, Math.min(75, pct)));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <div className="animated-bg" />
      <DBConnectionModal open={showModal} onClose={() => setShowModal(false)} />

      <AppSidebar
        label="Chats"
        sessions={sessions.map(s => ({ id: s.session_id, title: s.title, updated_at: s.updated_at }))}
        activeId={sessionId}
        onSelect={selectSession}
        onDelete={handleDelete}
        onNew={handleNew}
        loading={sessionsLoading}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Home
            </button>
            <span className="text-sm text-foreground truncate">{sessionId ? sessions.find(s => s.session_id === sessionId)?.title || "Chat" : "New Chat"}</span>
          </div>
          {connected && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-success/20 text-success px-3 py-1 rounded-full text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {dbName}
            </button>
          )}
        </div>

        {/* Main area with draggable divider */}
        <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
          <div style={{ height: `${dividerPos}%` }} className="flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map(m => (
                <ChatMessage key={m.id} message={m} onClarificationSubmit={(resp, orig) => handleSend(resp, resp, orig)} />
              ))}
              {thinking && <ThinkingIndicator />}
              <div ref={chatEndRef} />
            </div>
            <ChatInput onSend={handleSend} disabled={thinking || !connected} placeholder="Ask a question about your data..." />
          </div>
          <div onMouseDown={onMouseDown} className="h-1.5 bg-border hover:bg-primary/50 cursor-row-resize shrink-0 transition-colors" />
          <div style={{ height: `${100 - dividerPos}%` }} className="min-h-0">
            <ResultsPanel sql={currentSql} execution={currentExecution} chart={currentChart} plan={currentPlan} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NL2SQL;
