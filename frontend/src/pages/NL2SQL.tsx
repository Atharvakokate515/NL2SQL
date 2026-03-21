// frontend/src/pages/NL2SQL.tsx
// CHANGES FROM ORIGINAL:
//   + import HowToUseModal
//   + import BookOpen from lucide-react
//   + const [showHowTo, setShowHowTo] = useState(false);
//   + <HowToUseModal> rendered in JSX
//   + "How to Use" button — yellow/warning colour for visibility

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { AppSidebar } from "@/components/common/Sidebar";
import { ChatMessage } from "@/components/common/ChatMessage";
import { ChatInput } from "@/components/common/ChatInput";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";
import { DBConnectionModal } from "@/components/nl2sql/DBConnectionModal";
import { ResultsPanel } from "@/components/nl2sql/ResultsPanel";
import { HowToUseModal } from "@/components/common/HowToUseModal";
import { Message, NL2SQLSession } from "@/types";
import {
  getNl2sqlSessions, getSessionHistory, deleteNl2sqlSession,
  chatDb, createNl2sqlSession, patchNl2sqlSession,
} from "@/api/client";
import { BookOpen } from "lucide-react";

const NL2SQL = () => {
  const navigate = useNavigate();
  const { connected, dbUrl, dbName } = useApp();
  const [showModal, setShowModal] = useState(!connected);
  const [showHowTo, setShowHowTo] = useState(false);
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
      const history = hist.chat_history || hist.history || [];
      for (const h of history) {
        if (h.role === "user") {
          msgs.push({ id: crypto.randomUUID(), role: "user", content: h.content });
        } else if (h.role === "assistant") {
          let displayContent = "";
          let metadata: Message["metadata"] = {};
          if (typeof h.content === "string") {
            try {
              const parsed = JSON.parse(h.content);
              displayContent = parsed.summary || parsed.answer || parsed.sql || h.content;
              metadata = { sql: parsed.sql, summary: parsed.summary, chart: parsed.chart_suggestion, plan: parsed.plan, wasRetried: parsed.was_retried };
            } catch { displayContent = h.content; }
          } else if (typeof h.content === "object" && h.content !== null) {
            displayContent = h.content.summary || h.content.answer || h.content.sql || "";
            metadata = { sql: h.content.sql, summary: h.content.summary, chart: h.content.chart_suggestion, plan: h.content.plan, wasRetried: h.content.was_retried };
          }
          msgs.push({ id: crypto.randomUUID(), role: "assistant", content: displayContent, metadata });
        }
      }
      setMessages(msgs);
      if (hist.last_sql) setCurrentSql(hist.last_sql);
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

  const handleRename = async (id: string | number, title: string) => {
    setSessions(prev => prev.map(s => s.session_id === id ? { ...s, title } : s));
    try { await patchNl2sqlSession(id as string, title); } catch { loadSessions(); }
  };

  const handleSend = async (text: string, clarResponse?: string, origInput?: string) => {
    let sid = sessionId;
    if (!sid) {
      try { const res = await createNl2sqlSession(); sid = res.session_id; setSessionId(sid); }
      catch { return; }
    }

    if (!clarResponse) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    }

    setThinking(true);
    try {
      const res = await chatDb({
        db_url:     dbUrl,
        user_input: clarResponse ? (origInput || text) : text,
        session_id: sid!,
        ...(clarResponse ? { clarification_response: clarResponse } : {}),
      });

      if (res.needs_clarification) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: "clarification", content: res.question,
          metadata: { question: res.question, originalInput: clarResponse ? origInput : text }
        }]);
      } else if (!res.success || res.error) {
        setMessages(prev => [...prev, {
          id:       crypto.randomUUID(),
          role:     "error",
          content:  res.error || "Something went wrong. Please try again.",
          metadata: { errorCode: res.error_code || "UNKNOWN_ERROR" },
        }]);
      } else {
        const msg: Message = {
          id:      crypto.randomUUID(),
          role:    "assistant",
          content: res.summary || res.answer || "",
          metadata: {
            sql:         res.generated_sql,
            summary:     res.summary,
            chart:       res.chart_suggestion,
            execution:   res.execution,
            plan:        res.plan,
            wasRetried:  res.was_retried,
          },
        };
        setMessages(prev => [...prev, msg]);
        if (res.generated_sql)    setCurrentSql(res.generated_sql);
        if (res.execution)        setCurrentExecution(res.execution);
        if (res.chart_suggestion) setCurrentChart(res.chart_suggestion);
        if (res.plan)             setCurrentPlan(res.plan);
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

  const onMouseDown = () => { dragging.current = true; };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct  = ((e.clientY - rect.top) / rect.height) * 100;
      setDividerPos(Math.max(25, Math.min(75, pct)));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden pt-12">
      <div className="animated-bg" />
      <div className="corner-accent tl" />
      <div className="corner-accent tr" />
      <div className="corner-accent bl" />
      <div className="corner-accent br" />

      <DBConnectionModal open={showModal} onClose={() => setShowModal(false)} />
      <HowToUseModal open={showHowTo} onClose={() => setShowHowTo(false)} pipeline="nl2sql" />

      <AppSidebar
        label="Chats"
        sessions={sessions.map(s => ({ id: s.session_id, title: s.title, updated_at: s.updated_at }))}
        activeId={sessionId}
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
            {sessionId ? sessions.find(s => s.session_id === sessionId)?.title || "Chat" : "New Chat"}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {/* FIX: yellow/warning colour for high visibility */}
            <button
              onClick={() => setShowHowTo(true)}
              className="flex items-center gap-1.5 text-xs font-medium
                         bg-warning/15 text-warning border border-warning/35
                         hover:bg-warning/25 hover:border-warning/55
                         transition-all px-2.5 py-1 rounded-lg"
            >
              <BookOpen className="w-3.5 h-3.5" />
              How to Use
            </button>

            {connected && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 bg-success/15 text-success px-2.5 py-1 rounded-full text-xs hover:bg-success/25 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                {dbName}
              </button>
            )}
          </div>
        </div>

        {/* Main split area */}
        <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
          <div style={{ height: `${dividerPos}%` }} className="flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto py-4">
              <div className="max-w-3xl mx-auto px-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
                    <p className="text-muted-foreground text-sm">Ask a question about your data</p>
                    <p className="text-muted-foreground/50 text-xs">e.g. "Show total revenue by region last quarter"</p>
                    <button
                      onClick={() => setShowHowTo(true)}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium
                                 bg-warning/15 text-warning border border-warning/30
                                 hover:bg-warning/25 transition-all px-2.5 py-1 rounded-lg"
                    >
                      <BookOpen className="w-3 h-3" />
                      See sample queries for FinLend Capital
                    </button>
                  </div>
                )}
                {messages.map(m => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    onClarificationSubmit={(resp, orig) => handleSend(resp, resp, orig)}
                  />
                ))}
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
              disabled={thinking || !connected}
              placeholder={connected ? "Ask a question about your data…" : "Connect to a database to start"}
            />
          </div>

          <div
            onMouseDown={onMouseDown}
            className="h-1.5 bg-border hover:bg-primary/40 cursor-row-resize shrink-0 transition-colors"
          />

          <div style={{ height: `${100 - dividerPos}%` }} className="min-h-0">
            <ResultsPanel sql={currentSql} execution={currentExecution} chart={currentChart} plan={currentPlan} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NL2SQL;