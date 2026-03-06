import React, { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { Citation } from "@/types";

interface CitationsPanelProps {
  citations: Citation[];
}

const CitationsPanel: React.FC<CitationsPanelProps> = ({ citations }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t border-border pt-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Sources ({citations.length})
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {citations.map((c, i) => (
            <div key={i} className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2">
              <FileText size={14} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{c.source}</p>
                <p className="text-xs text-muted-foreground">Page {c.page}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.confidence >= 0.8 ? "bg-success" : c.confidence >= 0.5 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${c.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(c.confidence * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitationsPanel;
