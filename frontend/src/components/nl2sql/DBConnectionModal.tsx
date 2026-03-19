import { useState } from "react";
import { testConnection } from "@/api/client";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { Loader2 } from "lucide-react";

interface DBConnectionModalProps {
  open: boolean;
  onClose?: () => void;
}

export const DBConnectionModal = ({ open, onClose }: DBConnectionModalProps) => {
  const { setDb, connected } = useApp();
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("postgres");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    const url = `postgresql://${username}:${password}@${host}:${port}/${database}`;
    setLoading(true);
    setError("");
    try {
      const res = await testConnection(url);
      if (res.success) {
        setDb(url, res.db_name);
        onClose?.();
      } else {
        setError("Connection failed.");
      }
    } catch (e: any) {
      setError(e.message || "Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all";

  return (
    <Modal open={open} onClose={connected ? onClose : undefined} title="Connect to Database" showClose={connected}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Host</label>
          <input value={host} onChange={e => setHost(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Port</label>
          <input value={port} onChange={e => setPort(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Database</label>
          <input value={database} onChange={e => setDatabase(e.target.value)} placeholder="mydb" className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className={inputClass} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          onClick={handleConnect}
          disabled={loading || !database}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/80 disabled:opacity-50 transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Connecting..." : "Connect"}
        </button>
      </div>
    </Modal>
  );
};
