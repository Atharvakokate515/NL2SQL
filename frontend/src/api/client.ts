const BASE = "/api";

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...(opts?.headers as Record<string, string> || {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  return res.json();
}

// NL2SQL
export const testConnection = (db_url: string) =>
  request<{ success: boolean; db_name: string; tables: string[] }>("/test-connection", {
    method: "POST", body: JSON.stringify({ db_url }),
  });

export const getSchemaPreview = (db_url: string) =>
  request<any>(`/schema-preview?db_url=${encodeURIComponent(db_url)}`);

export const chatDb = (data: { db_url: string; user_input: string; session_id: string; clarification_response?: string }) =>
  request<any>("/chat-db", { method: "POST", body: JSON.stringify(data) });

export const getNl2sqlSessions = () =>
  request<any[]>("/nl2sql-sessions");

export const createNl2sqlSession = () =>
  request<{ session_id: string }>("/nl2sql-sessions", { method: "POST", body: JSON.stringify({}) });

export const getSessionHistory = (id: string) =>
  request<any>(`/session-history/${id}`);

export const deleteNl2sqlSession = (id: string) =>
  request<any>(`/nl2sql-sessions/${id}`, { method: "DELETE" });

export const patchNl2sqlSession = (id: string, title: string) =>
  request<any>(`/nl2sql-sessions/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });

// Copilot
export const createChat = (title?: string) =>
  request<{ chat_id: number }>("/create-chat", { method: "POST", body: JSON.stringify({ title: title || "New Copilot Chat" }) });

export const agentChat = (data: { db_url: string; user_input: string; chat_id: number }) =>
  request<any>("/agent-chat", { method: "POST", body: JSON.stringify(data) });

export const getCopilotSessions = () =>
  request<any[]>("/copilot-sessions");

export const getCopilotHistory = (id: number) =>
  request<any>(`/copilot-history/${id}`);

export const deleteCopilotSession = (id: number) =>
  request<any>(`/copilot-sessions/${id}`, { method: "DELETE" });

// Docs
export const uploadDoc = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return fetch(`${BASE}/upload-doc`, { method: "POST", body: fd }).then(r => {
    if (!r.ok) throw new Error("Upload failed");
    return r.json();
  });
};

export const getDocs = () => request<any[]>("/docs");

export const deleteDoc = (source: string) =>
  request<any>(`/docs/${encodeURIComponent(source)}`, { method: "DELETE" });

// Metrics
export const getMetrics = () => request<any>("/metrics");
