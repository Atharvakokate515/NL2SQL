import { useNavigate } from "react-router-dom";
import { Database, FileText, ArrowRight, Zap, Shield, BarChart3, MessageSquare, Brain, Search } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="animated-bg" />

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-5xl md:text-7xl text-primary-light animate-fade-up mb-6">
          From question to insight, instantly.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-12 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          Query databases and documents in plain English — fast, visual, effortless.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <PipelineCard
            icon={<Database className="w-6 h-6" />}
            title="NL2SQL Pipeline"
            description="Transform questions into SQL queries, no SQL knowledge needed."
            onClick={() => navigate("/nl2sql")}
          />
          <PipelineCard
            icon={<Brain className="w-6 h-6" />}
            title="DataCopilot"
            description="Ask documents anything, get instant, citation-backed answers."
            onClick={() => navigate("/copilot")}
          />
        </div>
      </section>

      {/* About */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-8 text-center">What is DataMind?</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 text-muted-foreground">
            <p>DataMind lets you interact with your data and documents using natural language. No SQL. No manual digging. Just instant, reliable insights.</p>
            <p>Connect your PostgreSQL database and ask questions in plain English — DataMind plans, generates, validates, and executes SQL automatically. Get results as tables, charts, and plain-English summaries.</p>
            <p>Upload your internal PDFs and documents to the knowledge base. Ask complex questions across multiple files and get cited, grounded answers — never hallucinated.</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 text-sm">
              {["You type", "AI Plans", "SQL / RAG", "Answer"].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-center">
                    {step}
                  </div>
                  {i < 3 && <ArrowRight className="w-4 h-4 text-primary shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-12 text-center">Built for Every Team</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "📊", title: "Finance Wizards", desc: "Analyze revenue, expenses, and KPIs in seconds." },
            { icon: "📦", title: "Operations Heroes", desc: "Track orders, inventory, and delivery performance effortlessly." },
            { icon: "🚀", title: "Sales & Growth Pros", desc: "Identify top customers and product trends instantly." },
            { icon: "👥", title: "HR & People Strategists", desc: "Get answers from HR policies and employee data." },
            { icon: "⚖️", title: "Legal & Compliance Sleuths", desc: "Quickly find clauses, policies, or contractual conditions." },
            { icon: "🔧", title: "Product & Engineering Minds", desc: "Query usage metrics and documentation without switching tools." },
          ].map((uc, i) => (
            <div key={i} className="group bg-surface border border-border rounded-xl p-6 hover:border-primary/60 hover:shadow-glow-sm transition-all duration-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{uc.icon}</div>
              <h3 className="font-medium text-foreground mb-1">{uc.title}</h3>
              <p className="text-sm text-muted-foreground">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NL2SQL Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-12 text-center">Smart Queries, No SQL Needed</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: <Zap className="w-5 h-5" />, title: "Natural Language → SQL Instantly", desc: "Type your question in plain English. DataMind understands intent, generates the right SQL, and runs it — no technical knowledge required." },
            { icon: <MessageSquare className="w-5 h-5" />, title: "Follow-Up Questions, Handled", desc: "Ask 'Now filter by Germany' or 'Show only 2023' and DataMind carries full conversation context forward." },
            { icon: <Shield className="w-5 h-5" />, title: "Auto-Fixes Broken Queries", desc: "If a query fails, DataMind automatically re-generates a corrected version using the exact error as feedback." },
            { icon: <Shield className="w-5 h-5" />, title: "Safe, Validated Execution", desc: "Every query is validated before it touches your database. DROP, ALTER, and unguarded mutations are blocked." },
            { icon: <BarChart3 className="w-5 h-5" />, title: "Charts & Summaries", desc: "Results arrive as tables, auto-suggested charts, and a plain-English summary — all in one view." },
            { icon: <Database className="w-5 h-5" />, title: "Persistent Session Memory", desc: "Every conversation is saved. Pick up any previous session exactly where you left off." },
          ].map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      {/* Copilot Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-12 text-center">Your Documents, Answered</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: <FileText className="w-5 h-5" />, title: "Ask PDFs Anything", desc: "Upload contracts, policies, manuals, and reports. Ask questions in plain English and get direct answers." },
            { icon: <Search className="w-5 h-5" />, title: "Citation-Backed Answers", desc: "Every answer includes the source file, page number, and a confidence score. You always know where the information came from." },
            { icon: <FileText className="w-5 h-5" />, title: "Multi-Document Queries", desc: "Your knowledge base holds unlimited documents. Questions search across all of them automatically." },
            { icon: <MessageSquare className="w-5 h-5" />, title: "Understands Follow-Ups", desc: "Ask 'What about the damaged goods clause?' after a previous answer. DataCopilot resolves references naturally." },
            { icon: <Shield className="w-5 h-5" />, title: "Never Hallucinates", desc: "The model is strictly grounded in your documents. If the answer isn't there, it says so." },
            { icon: <Zap className="w-5 h-5" />, title: "Cross-Pipeline Power", desc: "For complex questions needing both database figures and document context, DataMind synthesizes a unified answer." },
          ].map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      {/* Examples */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-12 text-center">See It In Action</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-display text-lg text-primary-light mb-4">NL2SQL Examples</h3>
            <div className="space-y-4">
              <ExampleCard query="Show quarterly revenue by region" result="→ Bar chart + data table + one-line summary" />
              <ExampleCard query="Top 5 customers last month" result='→ Ranked table | Follow-up: "Now filter by product X" → works instantly' />
              <ExampleCard query="Inventory levels by warehouse" result="→ Grouped table with alert highlights for low stock" />
            </div>
          </div>
          <div>
            <h3 className="font-display text-lg text-primary-light mb-4">DataCopilot Examples</h3>
            <div className="space-y-4">
              <ExampleCard query="What's the cancellation policy in contract ABC?" result="→ Cited answer with source file + page + confidence" />
              <ExampleCard query="Highlight refund-related clauses" result="→ Multi-document summary with all matching passages" />
              <ExampleCard query="Are we at risk of breaching loan covenants?" result="→ Cross-pipeline: live SQL data + contract thresholds" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-8">Ready to talk to your data?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/nl2sql")}
            className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/80 hover:shadow-glow transition-all duration-200"
          >
            Start with NL2SQL
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate("/copilot")}
            className="group inline-flex items-center gap-2 border border-primary/50 text-primary-light px-8 py-3 rounded-lg font-medium hover:border-primary hover:bg-primary/5 transition-all duration-200"
          >
            Try DataCopilot
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
};

const PipelineCard = ({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="group relative bg-surface/50 border border-border rounded-xl p-8 cursor-pointer hover:border-primary hover:bg-primary/5 hover:shadow-glow transition-all duration-200"
  >
    <div className="w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary mb-4 transition-colors duration-200">
      {icon}
    </div>
    <h3 className="font-display text-lg text-foreground mb-2 relative inline-block">
      {title}
      <span className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-primary transition-all duration-200" />
    </h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="group flex gap-4 bg-surface border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-glow-sm transition-all duration-200">
    <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary shrink-0 transition-colors">
      {icon}
    </div>
    <div>
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  </div>
);

const ExampleCard = ({ query, result }: { query: string; result: string }) => (
  <div className="bg-background border border-border rounded-xl p-4">
    <p className="font-mono text-sm text-primary-light mb-2">"{query}"</p>
    <p className="text-xs text-muted-foreground">{result}</p>
  </div>
);

export default Home;
