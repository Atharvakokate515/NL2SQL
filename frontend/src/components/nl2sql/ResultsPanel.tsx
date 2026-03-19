import { useState } from "react";
import { ExecutionResult, ChartSuggestion, Plan } from "@/types";
import { TableDisplay } from "./TableDisplay";
import { ChartDisplay } from "./ChartDisplay";
import { PlanInspector } from "./PlanInspector";
import { Copy, Check } from "lucide-react";

interface ResultsPanelProps {
  sql?: string;
  execution?: ExecutionResult;
  chart?: ChartSuggestion | null;
  plan?: Plan;
}

const queryTypeColor: Record<string, string> = {
  SELECT: "bg-primary/20 text-primary-light",
  INSERT: "bg-success/20 text-success",
  UPDATE: "bg-warning/20 text-warning",
  DELETE: "bg-destructive/20 text-destructive",
};

export const ResultsPanel = ({ sql, execution, chart, plan }: ResultsPanelProps) => {
  const [tab, setTab] = useState<"table" | "chart" | "split">("table");
  const [copied, setCopied] = useState(false);

  const hasChart = chart && chart.type !== "table";
  const hasTable = execution?.result?.col_names && execution.result.rows;

  const copySQL = () => {
    if (sql) {
      navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!sql && !execution) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Results will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setTab("table")} className={`text-xs px-3 py-1 rounded-lg transition-all ${tab === "table" ? "bg-primary/20 text-primary-light" : "text-muted-foreground hover:text-foreground"}`}>Table</button>
          {hasChart && <button onClick={() => setTab("chart")} className={`text-xs px-3 py-1 rounded-lg transition-all ${tab === "chart" ? "bg-primary/20 text-primary-light" : "text-muted-foreground hover:text-foreground"}`}>Chart</button>}
          {hasChart && hasTable && <button onClick={() => setTab("split")} className={`text-xs px-3 py-1 rounded-lg transition-all ${tab === "split" ? "bg-primary/20 text-primary-light" : "text-muted-foreground hover:text-foreground"}`}>Split</button>}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {execution && (
            <>
              <span className={`px-2 py-0.5 rounded ${queryTypeColor[execution.query_type] || ""}`}>
                {execution.query_type}
              </span>
              <span className="text-muted-foreground">{(execution.execution_time_sec * 1000).toFixed(0)}ms</span>
              {execution.result.row_count !== undefined && (
                <span className="text-muted-foreground">{execution.result.row_count} rows</span>
              )}
              {execution.result.rows_affected !== undefined && (
                <span className="text-muted-foreground">{execution.result.rows_affected} affected</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* SQL */}
      {sql && (
        <div className="px-4 py-2 bg-background border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-2">
            <pre className="text-xs font-mono text-primary-light overflow-x-auto flex-1 whitespace-pre-wrap">{sql}</pre>
            <button onClick={copySQL} className="p-1 shrink-0 rounded hover:bg-accent transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {tab === "table" && hasTable && (
          <TableDisplay colNames={execution!.result.col_names!} rows={execution!.result.rows!} />
        )}
        {tab === "chart" && hasChart && hasTable && (
          <ChartDisplay chart={chart!} colNames={execution!.result.col_names!} rows={execution!.result.rows!} />
        )}
        {tab === "split" && hasChart && hasTable && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <TableDisplay colNames={execution!.result.col_names!} rows={execution!.result.rows!} />
            <ChartDisplay chart={chart!} colNames={execution!.result.col_names!} rows={execution!.result.rows!} />
          </div>
        )}
        {execution && !hasTable && execution.result.rows_affected !== undefined && (
          <div className="text-center py-8">
            <p className="text-2xl font-display text-foreground">{execution.result.rows_affected}</p>
            <p className="text-sm text-muted-foreground">rows affected</p>
          </div>
        )}
      </div>

      {/* Plan */}
      {plan && <PlanInspector plan={plan} />}
    </div>
  );
};
