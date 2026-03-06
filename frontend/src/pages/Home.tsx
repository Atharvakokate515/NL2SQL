import { useNavigate } from "react-router-dom";
import { Database, Brain } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-3xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">
          Enterprise Data Copilot
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          Query your database. Search your documents. Get answers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/nl2sql")}
            className="group bg-card border border-border rounded-xl p-8 text-left hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Database size={24} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">NL2SQL Pipeline</h2>
            <p className="text-sm text-muted-foreground">
              Connect to PostgreSQL and query with natural language
            </p>
          </button>

          <button
            onClick={() => navigate("/copilot")}
            className="group bg-card border border-border rounded-xl p-8 text-left hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Brain size={24} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">RAG Copilot</h2>
            <p className="text-sm text-muted-foreground">
              Upload documents and ask questions across your knowledge base
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
