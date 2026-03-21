// frontend/src/components/common/HowToUseModal.tsx
// Drop this file into frontend/src/components/common/
// Then add the "How to Use" button + modal to NL2SQL.tsx and Copilot.tsx (see bottom of file)

import { useState } from "react";
import { X, ChevronDown, ChevronRight, Database, Brain, Zap, Search, Shield, BarChart3, MessageSquare, FileText, ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PipelineType = "nl2sql" | "copilot";

interface HowToUseModalProps {
  open: boolean;
  onClose: () => void;
  pipeline: PipelineType;
}

// ─── Content ──────────────────────────────────────────────────────────────────

const PROBLEM_STATEMENT = {
  title: "The Problem: Data Locked Behind Technical Barriers",
  body: `At FinLend Capital — and at most enterprises — critical business data lives in two silos that are almost impossible to access without specialist knowledge:

**Structured data** (loan balances, repayment history, covenant compliance figures) sits in PostgreSQL databases that require SQL expertise to query.  
**Unstructured knowledge** (credit policies, covenant schedules, collections procedures) lives in PDFs that require manual reading and cross-referencing.

A portfolio manager who wants to know *"Are any of our active corporate loans at risk of breaching their DSCR covenant this quarter?"* has to:
1. Ask a data analyst to write a SQL query — wait hours or days
2. Manually read the covenant schedule PDF to find the threshold
3. Cross-reference the two manually

**DataMind eliminates all three steps.** Ask in plain English and get a cited, grounded answer in seconds.`,
};

const NL2SQL_CONTENT = {
  whatItDoes: `The NL2SQL pipeline converts plain-English questions into validated, safe SQL queries — then executes them against your PostgreSQL database and returns results as tables, charts, and plain-English summaries.`,
  howToUse: [
    { step: "1", title: "Connect your database", desc: 'Click "Connect to Database" and enter your PostgreSQL credentials. DataMind reads your schema automatically — no configuration needed.' },
    { step: "2", title: "Ask your question", desc: 'Type any business question in plain English. e.g. "Show me all loans 30+ days overdue this quarter" or "What is our total interest income by loan type?"' },
    { step: "3", title: "Review the results", desc: "Results appear as a data table with an auto-suggested chart. The generated SQL is shown so you can verify or copy it. A plain-English summary explains the key findings." },
    { step: "4", title: "Ask follow-up questions", desc: 'The conversation remembers context. Say "Now filter by risk grade A" or "Sort by outstanding balance" — no need to repeat yourself.' },
  ],
  queries: [
    {
      category: "Portfolio Health",
      icon: "📊",
      questions: [
        { q: "Show me all loans 30+ days overdue this quarter", why: "Identifies delinquent loans before they escalate. DataMind translates this to a date-filtered JOIN across loans and repayments, grouping overdue days automatically." },
        { q: "What is our delinquency rate by risk grade?", why: "Surfaces concentration risk in specific credit tiers. The pipeline aggregates repayment gaps and calculates rates per grade — a query that would take an analyst 20 minutes." },
        { q: "Which borrowers have missed more than 2 consecutive payments?", why: "Early warning signal for default. DataMind writes a window function query to detect consecutive missed payments — advanced SQL that most users couldn't write themselves." },
      ],
    },
    {
      category: "Revenue & Performance",
      icon: "💰",
      questions: [
        { q: "What is total interest income by loan type last month?", why: "Instant P&L visibility by product. Groups across loan types and sums accrued interest — returned as a bar chart automatically." },
        { q: "Show top 10 loans by outstanding balance", why: "Concentration check on largest exposures. Ranked table returned in seconds." },
        { q: "What is the average loan-to-value ratio for secured loans this year?", why: "Risk metric that requires joining loans and collateral tables — DataMind handles the multi-table join invisibly." },
      ],
    },
    {
      category: "Officer & Ops",
      icon: "👤",
      questions: [
        { q: "Which loan officers have the most overdue accounts?", why: "Performance monitoring. Groups delinquencies by officer — useful for coaching and workload redistribution." },
        { q: "How many new loans were approved per month this year?", why: "Pipeline velocity tracking. Returns a monthly time-series line chart automatically." },
      ],
    },
  ],
  whatMakesItBetter: [
    { title: "Clarifier layer", desc: "If your question is ambiguous, DataMind asks a clarifying question before generating SQL — preventing wrong results silently." },
    { title: "Auto-retry on failure", desc: "If a generated query fails execution, DataMind feeds the exact error back to the LLM and regenerates — without you seeing the failure." },
    { title: "Safety validation", desc: "Every query is validated before execution. DROP, ALTER, DELETE without WHERE, and unknown table references are blocked automatically." },
    { title: "Follow-up awareness", desc: "The clarifier and planner both see your full conversation history, so vague follow-ups like 'filter by Germany' resolve correctly." },
    { title: "Chart auto-suggestion", desc: "The system detects column types (text + numeric → bar/pie, two numerics → line) and suggests the right chart without you asking." },
  ],
};

const COPILOT_CONTENT = {
  whatItDoes: `DataCopilot is an AI agent that answers questions using your uploaded PDF documents — contracts, policies, manuals, and reports. Every answer includes the source file, page number, and a confidence score. It never halluccinates: if the answer isn't in your documents, it says so.`,
  howToUse: [
    { step: "1", title: "Upload your documents", desc: 'Click "Manage Docs" and upload PDFs. DataMind chunks, embeds, and indexes them into a vector store. Supported: loan agreements, policy documents, procedure manuals.' },
    { step: "2", title: "Ask your question", desc: 'Type any question about your documents. e.g. "What is the DSCR covenant threshold for corporate loans?" or "What collateral is required for loans above $500K?"' },
    { step: "3", title: "Review cited answer", desc: "The answer includes the source document, page number, and a confidence bar. You always know where the information came from — no black-box answers." },
    { step: "4", title: "Ask cross-pipeline questions", desc: "For questions that need both database figures AND document context (e.g. covenant breach analysis), DataCopilot automatically combines SQL results with RAG retrieval into one synthesized answer." },
  ],
  queries: [
    {
      category: "Credit Policy",
      icon: "📋",
      questions: [
        { q: "What is the maximum LTV ratio allowed for commercial real estate loans?", why: "Instantly surfaces a specific threshold from your credit_policy.pdf without manual searching. Cited with page number." },
        { q: "What collateral types are accepted for loans above $500,000?", why: "Cross-references eligibility criteria buried in policy documents — returned in seconds with source attribution." },
        { q: "What credit score is required for a Grade A risk classification?", why: "Retrieves specific eligibility thresholds from the risk grading section of your policy document." },
      ],
    },
    {
      category: "Covenant & Compliance",
      icon: "⚖️",
      questions: [
        { q: "What is the minimum DSCR threshold before a covenant is considered breached?", why: "Pinpoints the exact threshold from your covenant schedule — the number the SQL pipeline needs for breach detection." },
        { q: "What are the consequences if a borrower breaches the debt-to-equity covenant?", why: "Retrieves escalation steps and legal consequences from the covenant schedule. Critical for collections decisions." },
        { q: "How many days after a covenant breach must we notify the borrower?", why: "Compliance timeline retrieved from policy — cited with confidence so your team can act with certainty." },
      ],
    },
    {
      category: "Collections & Recovery",
      icon: "🔔",
      questions: [
        { q: "What is the penalty for early loan repayment?", why: "Fee structure retrieved from collections_procedure.pdf — prevents incorrect manual calculations." },
        { q: "What steps must be taken before a loan is referred to legal?", why: "Full escalation procedure returned with source page. Ensures compliance with internal process." },
        { q: "At what point is a loan written off as unrecoverable?", why: "Write-off policy threshold retrieved and cited — critical for provisioning decisions." },
      ],
    },
    {
      category: "Cross-Pipeline Power",
      icon: "⚡",
      questions: [
        { q: "Are any of our active corporate loans at risk of breaching their DSCR covenant?", why: "DataCopilot runs SQL to pull current DSCR figures AND retrieves the covenant threshold from your PDF — then synthesizes a single answer flagging at-risk loans." },
        { q: "Which loans exceed the LTV limit defined in our credit policy?", why: "SQL query fetches current LTV ratios; RAG retrieves the policy limit; synthesis compares them and names violating loans." },
        { q: "How does our current delinquency rate compare to our risk tolerance policy?", why: "Live delinquency rate from database cross-referenced against your stated tolerance threshold in the risk policy document." },
      ],
    },
  ],
  whatMakesItBetter: [
    { title: "Hybrid chunking strategy", desc: "Documents are split using structure-aware separators (headers, paragraphs, clauses) before falling back to sentence-level splitting — keeping legal clauses and policy sections intact for accurate retrieval." },
    { title: "Confidence scoring", desc: "Every citation includes a confidence score. The UI shows a colour-coded bar: green (≥80%), amber (50–79%), red (<50%) — so you know how much to trust each answer." },
    { title: "Query rewriting for follow-ups", desc: "Before hitting the vector store, vague follow-ups like 'tell me more' are rewritten into concrete search queries using conversation history — preventing irrelevant chunk retrieval." },
    { title: "Never hallucinates", desc: "The synthesis prompt explicitly instructs: if the data is insufficient, say so. No invented thresholds, no made-up policy clauses." },
    { title: "Cross-pipeline synthesis", desc: "The LangGraph agent automatically routes to both SQL and RAG when needed, then synthesizes a single coherent answer — invisible to the user." },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StepCard = ({ step, title, desc }: { step: string; title: string; desc: string }) => (
  <div className="flex gap-3 p-3 rounded-lg bg-background border border-border">
    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-xs font-bold text-primary-light">{step}</span>
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const QueryCard = ({ q, why }: { q: string; why: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
      >
        <span className="text-xs font-mono text-primary-light flex-1 leading-relaxed">"{q}"</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 bg-accent/20 border-t border-border">
          <div className="flex gap-1.5 items-start">
            <Lightbulb className="w-3 h-3 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{why}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const BetterCard = ({ title, desc }: { title: string; desc: string }) => (
  <div className="flex gap-2.5 p-3 rounded-lg bg-success/5 border border-success/20">
    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
    <div>
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ─── Simple inline markdown renderer for the problem statement ───────────────

const SimpleMarkdown = ({ text }: { text: string }) => {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bold text
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j} className="text-foreground font-medium">{p.slice(2, -2)}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "problem" | "how-to-use" | "queries" | "why-better";

const TABS: { id: Tab; label: string }[] = [
  { id: "problem",    label: "The Problem" },
  { id: "how-to-use", label: "How to Use" },
  { id: "queries",    label: "Sample Queries" },
  { id: "why-better", label: "Why DataMind?" },
];

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const HowToUseModal = ({ open, onClose, pipeline }: HowToUseModalProps) => {
  const [tab, setTab] = useState<Tab>("problem");

  if (!open) return null;

  const isNl2sql   = pipeline === "nl2sql";
  const content    = isNl2sql ? NL2SQL_CONTENT : COPILOT_CONTENT;
  const Icon       = isNl2sql ? Database : Brain;
  const accentColor = isNl2sql ? "text-primary-light" : "text-success";
  const badgeBg    = isNl2sql ? "bg-primary/15 border-primary/30 text-primary-light" : "bg-success/15 border-success/30 text-success";
  const title      = isNl2sql ? "NL2SQL Pipeline" : "DataCopilot";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0 bg-surface/95">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${badgeBg}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground">FinLend Capital — Loan Portfolio Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-border shrink-0 bg-background/40 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.id
                  ? "bg-primary/20 text-primary-light border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Problem Tab ── */}
          {tab === "problem" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  {PROBLEM_STATEMENT.title}
                </h3>
                <SimpleMarkdown text={PROBLEM_STATEMENT.body} />
              </div>

              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-success" />
                  The DataMind Solution
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isNl2sql
                    ? "The NL2SQL pipeline translates plain-English questions into safe, validated SQL queries — executed instantly against your live database. No analyst required. No waiting. No wrong queries reaching production."
                    : "DataCopilot embeds your policy documents into a vector store and retrieves the most relevant passages for any question — with source citations. For complex cross-pipeline questions, it automatically combines live database figures with document context."}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-success font-medium">
                  <ArrowRight className="w-3.5 h-3.5" />
                  See the "How to Use" tab to get started in under 2 minutes
                </div>
              </div>

              {/* Pipeline overview */}
              <div className="p-4 rounded-xl bg-background border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">How {title} Works</h3>
                <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
                  {isNl2sql
                    ? ["You ask", "Clarifier", "Planner", "SQL Generator", "Validator", "Executor", "Chart + Summary"].map((s, i, arr) => (
                        <div key={i} className="flex items-center gap-2 shrink-0">
                          <div className="bg-accent border border-border rounded-lg px-2.5 py-1.5 text-foreground">{s}</div>
                          {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                        </div>
                      ))
                    : ["You ask", "Planner", "RAG Search", "Query Rewrite", "Chunk Retrieval", "Synthesis", "Cited Answer"].map((s, i, arr) => (
                        <div key={i} className="flex items-center gap-2 shrink-0">
                          <div className="bg-accent border border-border rounded-lg px-2.5 py-1.5 text-foreground">{s}</div>
                          {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                        </div>
                      ))}
                </div>
              </div>
            </div>
          )}

          {/* ── How to Use Tab ── */}
          {tab === "how-to-use" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground leading-relaxed">{content.whatItDoes}</p>
              </div>
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step-by-Step</h3>
                {content.howToUse.map(s => (
                  <StepCard key={s.step} {...s} />
                ))}
              </div>

              {isNl2sql ? (
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 space-y-1.5">
                  <p className="text-xs font-semibold text-warning flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Safety Note
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Only SELECT queries are permitted through the NL2SQL chat. INSERT, UPDATE, DELETE, DROP, and ALTER are blocked. Mutations can only be performed through the dedicated NL2SQL tab pipeline with explicit intent.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 space-y-1.5">
                  <p className="text-xs font-semibold text-warning flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Document Tips
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    For best results upload structured PDFs with clear section headings (contracts, policy documents, procedure manuals). Scanned image PDFs without selectable text will not retrieve accurately.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Sample Queries Tab ── */}
          {tab === "queries" && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">
                Click any query to see how DataMind solves it. These are real questions FinLend Capital operations teams ask daily.
              </p>
              {content.queries.map(cat => (
                <div key={cat.category} className="space-y-2">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>{cat.icon}</span>
                    {cat.category}
                  </h3>
                  <div className="space-y-1.5">
                    {cat.questions.map(q => (
                      <QueryCard key={q.q} q={q.q} why={q.why} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Why Better Tab ── */}
          {tab === "why-better" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-accent/50 border border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Most NL-to-data tools generate a query and hope for the best. DataMind has multiple layers of intelligence that make it production-safe and genuinely useful for real enterprise data.
                </p>
              </div>
              <div className="space-y-2.5">
                {content.whatMakesItBetter.map(item => (
                  <BetterCard key={item.title} {...item} />
                ))}
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Built for FinLend Capital's Reality</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The system was designed around the specific challenges of commercial lending: multi-table relational schemas, legal document retrieval with citation requirements, covenant compliance cross-referencing, and the need for an audit trail on every data access.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-background/40 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground">
            {isNl2sql ? "NL2SQL Pipeline" : "DataCopilot"} · DataMind v1.0
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/80 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── HOW TO WIRE THIS UP ──────────────────────────────────────────────────────
//
// 1. Copy this file to frontend/src/components/common/HowToUseModal.tsx
//
// 2. In frontend/src/pages/NL2SQL.tsx:
//    a) Add import at top:
//       import { HowToUseModal } from "@/components/common/HowToUseModal";
//    b) Add state:
//       const [showHowTo, setShowHowTo] = useState(false);
//    c) Add the modal anywhere inside the return (before closing div):
//       <HowToUseModal open={showHowTo} onClose={() => setShowHowTo(false)} pipeline="nl2sql" />
//    d) Add the button in the slim context bar (the h-10 div), next to the db badge:
//       <button
//         onClick={() => setShowHowTo(true)}
//         className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary-light transition-colors px-2 py-1 rounded-lg hover:bg-accent"
//       >
//         <BookOpen className="w-3.5 h-3.5" />
//         How to Use
//       </button>
//    e) Add BookOpen to your lucide-react import
//
// 3. In frontend/src/pages/Copilot.tsx — same steps but use pipeline="copilot":
//    import { HowToUseModal } from "@/components/common/HowToUseModal";
//    const [showHowTo, setShowHowTo] = useState(false);
//    <HowToUseModal open={showHowTo} onClose={() => setShowHowTo(false)} pipeline="copilot" />
//    Button goes in the slim context bar next to "Manage Docs".
//
// ─────────────────────────────────────────────────────────────────────────────

export default HowToUseModal;