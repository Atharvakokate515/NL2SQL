import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Plan } from "@/types";

interface PlanInspectorProps {
  plan: Plan;
}

const PlanInspector: React.FC<PlanInspectorProps> = ({ plan }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Query Plan
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1 text-xs">
          <div><span className="text-muted-foreground">Intent:</span> <span className="text-foreground">{plan.intent}</span></div>
          <div><span className="text-muted-foreground">Tables:</span> <span className="text-foreground">{plan.tables.join(", ")}</span></div>
          <div><span className="text-muted-foreground">Columns:</span> <span className="text-foreground">{plan.columns.join(", ")}</span></div>
        </div>
      )}
    </div>
  );
};

export default PlanInspector;
