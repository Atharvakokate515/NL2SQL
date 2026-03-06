import React, { useState } from "react";
import { Copy, Check, Table2, BarChart3, Columns } from "lucide-react";
import type { ExecutionResult, ChartSuggestion, Plan } from "@/types";
import TableDisplay from "./TableDisplay";
import ChartDisplay from "./ChartDisplay";
import PlanInspector from "./PlanInspector";

interface ResultsPanelProps {
  sql: string | null;
  execution: ExecutionResult | null;
  chart: ChartSuggestion | null;
  plan: Plan | null;
}

const queryTypeColor: Record<string, string> = {
  SELECT: "bg-primary/20 text-primary",
  INSERT: "bg-success/20 text-success",
  UPDATE: "bg-warning/20 text-warning",
  DELETE: "bg-destructive/20 text-destructive",
};

const ResultsPanel: React.FC<ResultsPanelProps> = ({ sql, execution, chart, plan }) => {
  const [view, setView] = useState<"table" | "chart" | "split">("table");
  const [copied, setCopied] = useState(false);

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
        <div className="text-center">
          <Table2 size={32} className="mx-auto mb-2 opacity-30" />
          <p>Results will appear here</p>
        </div>
      </div>
    );
  }

  const hasChart = chart && chart.type !== "table";
  const result = execution?.result;

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView("table")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${view === "table" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Table
          </button>
          {hasChart && (
            <>
              <button
                onClick={() => setView("chart")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${view === "chart" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Chart
              </button>
              <button
                onClick={() => setView("split")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${view === "split" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Columns size={14} />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {execution?.query_type && (
            <span className={`px-2 py-0.5 text-xs rounded font-mono ${queryTypeColor[execution.query_type] || "bg-muted text-muted-foreground"}`}>
              {execution.query_type}
            </span>
          )}
          {execution?.execution_time_sec != null && (
            <span className="text-xs text-muted-foreground">{(execution.execution_time_sec * 1000).toFixed(0)}ms</span>
          )}
          {result?.row_count != null && (
            <span className="text-xs text-muted-foreground">{result.row_count} rows</span>
          )}
        </div>
      </div>

      {/* SQL */}
      {sql && (
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-start justify-between gap-2">
            <pre className="text-xs font-mono text-primary overflow-x-auto whitespace-pre-wrap flex-1">{sql}</pre>
            <button onClick={copySQL} className="p-1 rounded text-muted-foreground hover:text-foreground shrink-0 transition-colors">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {result?.rows_affected != null && !result.col_names && (
          <div className="p-4">
            <p className="text-sm text-foreground">{result.rows_affected} row(s) affected</p>
            {result.updated_table && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Updated table snapshot:</p>
                <TableDisplay colNames={result.updated_table.col_names} rows={result.updated_table.rows} />
              </div>
            )}
          </div>
        )}

        {view === "table" && result?.col_names && result?.rows && (
          <TableDisplay colNames={result.col_names} rows={result.rows} />
        )}

        {view === "chart" && hasChart && result?.col_names && result?.rows && (
          <div className="p-4">
            <ChartDisplay chart={chart} colNames={result.col_names} rows={result.rows} />
          </div>
        )}

        {view === "split" && hasChart && result?.col_names && result?.rows && (
          <div className="grid grid-cols-2 divide-x divide-border h-full">
            <TableDisplay colNames={result.col_names} rows={result.rows} />
            <div className="p-4">
              <ChartDisplay chart={chart} colNames={result.col_names} rows={result.rows} />
            </div>
          </div>
        )}
      </div>

      {/* Plan */}
      {plan && <PlanInspector plan={plan} />}
    </div>
  );
};

export default ResultsPanel;
