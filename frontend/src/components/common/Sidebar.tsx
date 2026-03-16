// frontend/src/components/common/Sidebar.tsx
import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, MessageSquare, Pencil, Check, X } from "lucide-react";
import { NavLink } from "react-router-dom";

interface Session {
  id: string | number;
  title: string;
  updated_at?: string;
}

interface SidebarProps {
  sessions: Session[];
  activeId: string | number | null;
  onSelect: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  onNewChat: () => void;
  onRename?: (id: string | number, newTitle: string) => void;
  loading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  onRename,
  loading = false,
}) => {
  const [renamingId, setRenamingId] = useState<string | number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId !== null) inputRef.current?.focus();
  }, [renamingId]);

  const startRename = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setRenamingId(session.id);
    setRenameValue(session.title);
  };

  const commitRename = (id: string | number) => {
    const trimmed = renameValue.trim();
    if (trimmed && onRename) onRename(id, trimmed);
    setRenamingId(null);
  };

  const cancelRename = () => setRenamingId(null);

  const handleKeyDown = (e: React.KeyboardEvent, id: string | number) => {
    if (e.key === "Enter") commitRename(id);
    if (e.key === "Escape") cancelRename();
  };

  return (
    <div className="w-60 shrink-0 flex flex-col h-screen bg-card border-r border-border">
      {/* Header nav */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
        <NavLink
          to="/nl2sql"
          className={({ isActive }) =>
            `flex-1 text-center text-xs py-1.5 rounded-md transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`
          }
        >
          NL2SQL
        </NavLink>
        <NavLink
          to="/copilot"
          className={({ isActive }) =>
            `flex-1 text-center text-xs py-1.5 rounded-md transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`
          }
        >
          Copilot
        </NavLink>
      </div>

      {/* New chat */}
      <div className="px-3 py-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
        >
          <Plus size={14} />
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2 space-y-0.5">
        {loading && (
          <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>
        )}
        {!loading && sessions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No chats yet</p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => renamingId !== session.id && onSelect(session.id)}
            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
              activeId === session.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted text-foreground"
            }`}
          >
            <MessageSquare size={13} className="shrink-0 text-muted-foreground" />

            {renamingId === session.id ? (
              <div
                className="flex items-center gap-1 flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={inputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, session.id)}
                  className="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={() => commitRename(session.id)}
                  className="text-success hover:opacity-70 shrink-0"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={cancelRename}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-xs truncate">{session.title}</span>
                <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                  {onRename && (
                    <button
                      onClick={(e) => startRename(e, session)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(session.id);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;