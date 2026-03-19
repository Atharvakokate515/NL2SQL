import { Plan } from "@/types";
import { ChevronDown } from "lucide-react";

interface PlanInspectorProps {
  plan: Plan;
}

export const PlanInspector = ({ plan }: PlanInspectorProps) => (
  <details className="border-t border-border mt-2">
    <summary className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
      <ChevronDown className="w-3 h-3" />
      Query Plan
    </summary>
    <div className="px-4 py-2 space-y-2 text-xs">
      <div>
        <span className="text-muted-foreground">Intent: </span>
        <span className="text-foreground">{plan.intent}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Tables: </span>
        <span className="text-foreground">{plan.tables.join(", ")}</span>
      </div>
      {Object.keys(plan.columns).length > 0 && (
        <div>
          <span className="text-muted-foreground">Columns: </span>
          {Object.entries(plan.columns).map(([t, cols]) => (
            <span key={t} className="text-foreground mr-2">{t}({cols.join(", ")})</span>
          ))}
        </div>
      )}
    </div>
  </details>
);
