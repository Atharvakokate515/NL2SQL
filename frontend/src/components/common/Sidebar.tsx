import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, MessageSquare } from "lucide-react";

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

export const AppSidebar = ({ label, sessions, activeId, onSelect, onDelete, onNew, loading }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

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
          {collapsed ? <ChevronRight className="w-4 h-4 text-sidebar-foreground" /> : <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />}
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
              onClick={() => onSelect(s.id)}
              className={`group flex items-center gap-2 px-2 py-2 mx-1 rounded-lg cursor-pointer transition-all duration-200 ${
                activeId === s.id ? "bg-sidebar-accent border-l-2 border-sidebar-primary" : "hover:bg-sidebar-accent/50 border-l-2 border-transparent"
              }`}
              title={collapsed ? s.title : undefined}
            >
              {collapsed ? (
                <MessageSquare className="w-4 h-4 text-sidebar-foreground shrink-0" />
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-sidebar-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(s.updated_at)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
