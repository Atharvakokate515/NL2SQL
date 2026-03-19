export type Message = {
  id: string;
  role: "user" | "assistant" | "error" | "clarification";
  content: string;
  metadata?: {
    sql?: string;
    summary?: string;
    chart?: ChartSuggestion | null;
    execution?: ExecutionResult;
    plan?: Plan;
    wasRetried?: boolean;
    tool?: string;
    sqlUsed?: boolean;
    ragUsed?: boolean;
    citations?: Citation[] | null;
    answerGrounded?: boolean;
    errorCode?: string;
    question?: string;
    originalInput?: string;
  };
};

export type ChartSuggestion = {
  type: "bar" | "line" | "pie" | "table";
  x_axis: string;
  y_axis: string;
};

export type ExecutionResult = {
  success: boolean;
  query_type: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  execution_time_sec: number;
  result: {
    type: string;
    col_names?: string[];
    rows?: any[][];
    row_count?: number;
    rows_affected?: number;
    updated_table?: { col_names: string[]; rows: any[][] };
  };
};

export type Plan = {
  intent: string;
  tables: string[];
  columns: Record<string, string[]>;
};

export type Citation = {
  source: string;
  page: number;
  confidence: number;
};

export type NL2SQLSession = {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type CopilotSession = {
  chat_id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

export type DocInfo = {
  source: string;
  chunk_count: number;
  ingested_at: string;
};
