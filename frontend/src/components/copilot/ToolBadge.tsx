import React from "react";

interface ToolBadgeProps {
  tool: string;
  sqlUsed?: boolean;
  ragUsed?: boolean;
}

const ToolBadge: React.FC<ToolBadgeProps> = ({ tool, sqlUsed, ragUsed }) => {
  if (tool === "synthesis") {
    return (
      <div className="flex items-center gap-1.5">
        {sqlUsed && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-primary/20 text-primary">
            🗄 SQL
          </span>
        )}
        {ragUsed && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-success/20 text-success">
            📄 RAG
          </span>
        )}
      </div>
    );
  }

  if (tool === "chat") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
        💬 Chat
      </span>
    );
  }

  return null;
};

export default ToolBadge;
