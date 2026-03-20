import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, MessageSquare, Pencil, Check, X } from "lucide-react";

interface SidebarSession {
  id: string | number;
  title: string;
  updated_at: string;
}

interface AppSidebarProps {
  label: string;
  sessions: SidebarSession[];
  activeId: string | number | null;
  onSelect: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  onRename: (id: string | number, title: string) => void;
  onNew: () => void;
  loading?: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const AppSidebar = ({
  label, sessions, activeId, onSelect, onDelete, onRename, onNew, loading,
}: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEdit = (e: React.MouseEvent, session: SidebarSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const commitEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editingId !== null && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div
      className={`h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
        {!collapsed && <span className="font-display text-sm text-sidebar-foreground">{label}</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-sidebar-accent transition-colors ml-auto"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
            : <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />}
        </button>
      </div>

      <button
        onClick={onNew}
        className={`mx-2 mt-2 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all ${
          collapsed ? "justify-center" : ""
        }`}
        title="New Chat"
      >
        <Plus className="w-4 h-4 shrink-0" />
        {!collapsed && <span>New Chat</span>}
      </button>

      <div className="flex-1 overflow-y-auto mt-2 px-1">
        {loading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-sidebar-accent rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground px-3 py-4">
            No chats yet. Ask your first question to get started.
          </p>
        ) : (
          sessions.map(s => (
            <div
              key={s.id}
              onClick={() => editingId !== s.id && onSelect(s.id)}
              className={`group flex items-center gap-2 px-2 py-2 mx-1 rounded-lg cursor-pointer transition-all duration-200 ${
                activeId === s.id
                  ? "bg-sidebar-accent border-l-2 border-sidebar-primary"
                  : "hover:bg-sidebar-accent/50 border-l-2 border-transparent"
              }`}
              title={collapsed ? s.title : undefined}
            >
              {collapsed ? (
                <MessageSquare className="w-4 h-4 text-sidebar-foreground shrink-0" />
              ) : editingId === s.id ? (
                /* ── Inline rename input ── */
                <div
                  className="flex items-center gap-1 flex-1 min-w-0"
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 bg-background border border-primary/50 rounded px-2 py-0.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <button
                    onClick={commitEdit}
                    className="p-0.5 rounded hover:bg-success/20 transition-colors shrink-0"
                    title="Save"
                  >
                    <Check className="w-3.5 h-3.5 text-success" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-0.5 rounded hover:bg-destructive/20 transition-colors shrink-0"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                /* ── Normal row ── */
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-sidebar-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(s.updated_at)}</p>
                  </div>
                  {/* Action buttons — visible on hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      onClick={e => startEdit(e, s)}
                      className="p-1 rounded hover:bg-primary/20 transition-colors"
                      title="Rename"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground hover:text-primary-light" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                      className="p-1 rounded hover:bg-destructive/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};