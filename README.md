# DataMind — AI-Powered Data Intelligence

A production-grade enterprise data platform that lets you query databases and documents in plain English — no SQL, no manual searching, just instant, grounded answers.

---

## What It Does

DataMind provides two AI-powered pipelines:

1. **NL2SQL Pipeline** converts plain-English questions into validated SQL queries (SELECT, INSERT, UPDATE, DELETE), executes them against your PostgreSQL database, and returns results as tables, auto-suggested charts, and plain-English summaries.
2. **DataCopilot** answers questions from your uploaded PDF documents with cited, confidence-scored answers. For complex queries, it automatically combines live database figures with document context into a single synthesized answer.

---

## Architecture

### NL2SQL Pipeline

```
User Question
    ↓
Clarifier        → Is the query specific enough? Ask follow-up if not
    ↓
Planner          → Structured intent: metrics, dimensions, filters, candidate tables
    ↓
SQL Generator    → PostgreSQL query (supports SELECT / INSERT / UPDATE / DELETE)
    ↓
Validator        → Block forbidden keywords; enforce WHERE on mutations
    ↓
Executor         → Run query; auto-retry with error feedback on failure
    ↓
Summary + Chart  → Plain-English summary + auto-suggested chart type
```

### DataCopilot (Agent Graph)

```
User Question
    ↓
Planner Node      → Decide tools: nl2sql | rag | chat
    ↓
Execution Node    → Run nl2sql_tool and/or rag_tool in parallel
    ↓
Synthesis Node    → Merge SQL results + RAG citations into one answer
```

All agents communicate through a typed `AgentState` dict via LangGraph — no raw document passing between nodes.

---

## Quick Start

### 1. Clone & install backend

```bash
git clone <repo-url>
cd NL2SQL-Chatbot-Agent/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp env.example .env
# Edit .env with your keys
```

| Variable | Required | Description |
|---|---|---|
| `LLM_PROVIDER` | ✅ | `huggingface`, `openai`, or `groq` |
| `HUGGINGFACEHUB_API_TOKEN` | If HuggingFace | HF Inference API token |
| `OPENAI_API_KEY` | If OpenAI | OpenAI API key |
| `GROQ_API_KEY` | If Groq | Groq API key |
| `DATABASE_URL` | Optional | SQLite (default) or PostgreSQL for session storage |

### 3. Start the backend

```bash
uvicorn main:app --reload --port 8000
```

### 4. Install & start the frontend

```bash
cd ../frontend
npm install
npm run dev
# Open http://localhost:8080
```

### 5. Docker (full stack)

```bash
docker-compose up --build
# Frontend: http://localhost:80
# Backend:  http://localhost:8000
```

---

## Project Structure

```
NL2SQL-Chatbot-Agent/
├── backend/
│   ├── api/
│   │   ├── chat.py              # NL2SQL + Copilot endpoints, session management
│   │   ├── docs.py              # PDF upload, list, delete
│   │   └── metrics.py           # Observability middleware + /metrics endpoint
│   ├── core/
│   │   ├── state.py             # AgentState TypedDict for LangGraph
│   │   ├── planner_schema.py    # PlannerOutput (tools, sql_tasks, rag_tasks)
│   │   ├── nl2sql_plan_schema.py # NL2SQLPlan (intent, metrics, tables, columns)
│   │   └── clarifier_schema.py  # ClarifierOutput (is_clear, question)
│   ├── db/
│   │   ├── schema.py            # Schema introspection (columns, PKs, FKs, samples)
│   │   ├── executor.py          # SQL execution with SELECT/mutation handling
│   │   └── connection.py        # psycopg2 connection + test
│   ├── graph/
│   │   ├── graph.py             # LangGraph pipeline definition
│   │   ├── planner_node.py      # Tool routing with follow-up awareness
│   │   ├── execution_node.py    # nl2sql_tool + rag_tool execution
│   │   └── synthesis_node.py    # Final answer assembly with citations
│   ├── llm/
│   │   ├── client.py            # Unified LLM client (HuggingFace / OpenAI / Groq)
│   │   └── *.py                 # Prompts and Pydantic output parsers
│   ├── memory/
│   │   ├── session_store.py     # NL2SQL session persistence (SQLAlchemy)
│   │   ├── chat_store.py        # Copilot chat persistence (SQLAlchemy)
│   │   ├── models.py            # ORM models: sessions, messages, request logs
│   │   └── db.py                # SQLite / Postgres engine setup
│   ├── nl2sql/
│   │   ├── clarrifier.py        # Ambiguity detection with context awareness
│   │   ├── planner.py           # Intent decomposition → NL2SQLPlan
│   │   ├── generator.py         # SQL generation + retry with error feedback
│   │   └── validator.py         # Safety validation (forbidden keywords, WHERE enforcement)
│   ├── rag/
│   │   ├── ingest.py            # Hybrid chunking (structure-aware + sentence fallback)
│   │   ├── search.py            # ChromaDB similarity search
│   │   ├── rag_services.py      # Query rewriting for follow-ups + answer generation
│   │   └── embeddings.py        # HuggingFace / OpenAI embedding selector
│   ├── tools/
│   │   ├── nl2sql_tool.py       # Read-only SQL tool for the Copilot agent
│   │   ├── rag_tool.py          # Vector search tool for the Copilot agent
│   │   └── chat_tool.py         # General conversation fallback
│   ├── main.py                  # FastAPI app, CORS, middleware, lifespan
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx         # Landing page with use-case showcase
    │   │   ├── NL2SQL.tsx       # SQL chat interface with resizable results panel
    │   │   └── Copilot.tsx      # Document Q&A chat interface
    │   ├── components/
    │   │   ├── common/          # Sidebar, ChatMessage, ChatInput, ThinkingIndicator
    │   │   ├── nl2sql/          # DBConnectionModal, ResultsPanel, ChartDisplay, TableDisplay
    │   │   └── copilot/         # DocUploadModal
    │   ├── api/client.ts        # All API calls (typed fetch wrappers)
    │   ├── context/AppContext.tsx # Global DB connection + docs state
    │   └── types/index.ts       # Shared TypeScript interfaces
    ├── tailwind.config.ts
    └── vite.config.ts           # Dev proxy to /api at localhost:8000
```

---

## LLM Provider Configuration

Switch providers by setting `LLM_PROVIDER` in `backend/.env`:

```bash
# HuggingFace (default)
LLM_PROVIDER=huggingface
HUGGINGFACEHUB_API_TOKEN=hf_...

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o               # optional, default: gpt-4o

# Groq (fast, free tier available)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile  # optional
```

Embeddings follow the same provider selector — OpenAI uses `text-embedding-3-small`, HuggingFace uses `BAAI/bge-small-en-v1.5` via the Inference API.

---

## Key Features

### NL2SQL

| Feature | Detail |
|---|---|
| Clarifier layer | Detects ambiguous queries and asks a follow-up before generating SQL. Follow-ups with context are marked clear automatically. |
| Auto-retry | On validation or execution failure, the exact error is fed back to the LLM for a corrected query — invisible to the user. |
| Safety validation | Blocks `DROP`, `ALTER`, `TRUNCATE`, `GRANT`, `REVOKE`. `UPDATE`/`DELETE` without `WHERE` are rejected. Unknown tables are blocked. |
| Follow-up awareness | Planner and clarifier both receive full conversation history and the previous SQL, so "filter by Germany" resolves correctly. |
| Chart auto-suggestion | Detects column types: text + numeric (≤6 rows) → pie, text + numeric (>6 rows) → bar, two numerics → line, scalar → table. |
| Session persistence | Every conversation is saved to SQLite/Postgres. Sessions can be renamed, restored, and deleted from the sidebar. |

### DataCopilot

| Feature | Detail |
|---|---|
| Hybrid chunking | Structure-aware splitting (headers, paragraphs, clauses) with sentence-level fallback — keeps legal clauses intact for accurate retrieval. |
| Query rewriting | Before hitting ChromaDB, vague follow-ups like "tell me more" are rewritten into concrete search queries using conversation history. |
| Confidence scoring | Every citation includes a 0–1 confidence score with a colour-coded bar (green ≥80%, amber 50–79%, red <50%). |
| Cross-pipeline synthesis | The LangGraph planner automatically routes to both SQL and RAG when needed and synthesizes a single coherent answer. |
| Grounding check | Synthesis is grounded in retrieved evidence only. If no citation confidence reaches 0.5, a "may not be fully grounded" warning is shown. |

---

## API Reference

### Connection

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/test-connection` | Test DB connection, return schema preview |
| `GET` | `/api/schema-preview` | Live table list for workspace |

### NL2SQL

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat-db` | Run NL2SQL pipeline |
| `POST` | `/api/nl2sql-sessions` | Create new session (server-generated UUID) |
| `GET` | `/api/nl2sql-sessions` | List all sessions |
| `GET` | `/api/session-history/{id}` | Restore session with full message history |
| `PATCH` | `/api/nl2sql-sessions/{id}` | Rename session |
| `DELETE` | `/api/nl2sql-sessions/{id}` | Delete session and all messages |

### DataCopilot

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/agent-chat` | Run Copilot agent pipeline |
| `POST` | `/api/create-chat` | Create new Copilot chat |
| `GET` | `/api/copilot-sessions` | List all Copilot chats |
| `GET` | `/api/copilot-history/{id}` | Restore chat with full message history |
| `PATCH` | `/api/copilot-sessions/{id}` | Rename chat |
| `DELETE` | `/api/copilot-sessions/{id}` | Delete chat |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload-doc` | Upload and ingest a PDF |
| `GET` | `/api/docs` | List all ingested documents |
| `DELETE` | `/api/docs/{source}` | Delete document and all its chunks |

### Observability

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/metrics` | Aggregated stats: latency, retry rate, SQL error rate, by pipeline / tool / query type |

---

## Safety & Token Handling

Every query is validated before touching the database:

```
Forbidden keywords (DROP, ALTER, TRUNCATE, GRANT, REVOKE) → blocked immediately
UPDATE / DELETE without WHERE                              → blocked
Unknown table reference                                    → blocked
system schema queries (information_schema, pg_catalog)     → always allowed
scalar queries with no FROM clause                         → always allowed
```

Token / quota errors from any LLM provider are caught uniformly by `llm/token_error.py` and returned to the frontend as `error_code: TOKEN_LIMIT`, which renders a dedicated banner with retry and billing link buttons.

---

## Observability

The metrics middleware logs every request to a `request_logs` table automatically. `GET /api/metrics` returns:

```json
{
  "total_requests": 142,
  "success_rate": 0.944,
  "avg_latency_ms": 3820.5,
  "retry_rate": 0.085,
  "sql_error_rate": 0.042,
  "by_pipeline": { "nl2sql": { "count": 98, "avg_latency_ms": 4100, "success_rate": 0.93 } },
  "by_tool": { "nl2sql": 82, "rag": 31, "chat": 12, "synthesis": 29 },
  "by_query_type": { "SELECT": 74, "INSERT": 8, "UPDATE": 5 },
  "recent_errors": [...]
}
```

---

## Running Tests

```bash
cd backend
pytest tests/test_nl2sql_pipeline.py -v
```

The test suite covers:

- `_suggest_chart()` — all chart type branches (pie, bar, line, table, empty, non-SELECT)
- `clarify_query()` — ambiguous queries, specific queries, follow-ups with context, history formatting
- `/api/chat-db` endpoint — clarification flow, clarification response bypass, full pipeline success, session auto-creation, validation retry, execution retry, follow-up SQL context passing

```bash
# Frontend unit tests
cd frontend
npm run test
```

---

## Deployment

### Render (backend)

See `render.yaml`. The build command installs CPU-only PyTorch to avoid memory limits:

```yaml
buildCommand: |
  pip install torch --index-url https://download.pytorch.org/whl/cpu
  pip install -r requirements.txt
startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Nginx)

The `frontend/Dockerfile` builds a static bundle and serves it via Nginx. The `nginx.conf` proxies `/api/` to `$BACKEND_URL`.

### Database Notes

- Session and chat storage defaults to **SQLite** (`./app.db`) — no configuration needed for development.
- Set `DATABASE_URL=postgresql://...` in `.env` for production.
- ChromaDB persists to `./chroma_db/` — mount this as a volume in Docker.

---

## Extending the System

| Goal | Where to change |
|---|---|
| Add a new LLM provider | `llm/client.py` — add an `elif _PROVIDER == "..."` block |
| Change retrieval chunk count | `tools/rag_tool.py` — update `k=5` |
| Enable reasoning layer | Uncomment blocks in `graph/graph.py`, `graph/synthesis_node.py`, `llm/synthesis_prompt.py` |
| Add a new API tool to the Copilot agent | `tools/` — create a new tool function; register in `graph/execution_node.py` |
| Change chart thresholds | `api/chat.py` — `_suggest_chart()` |
| Add embedding model | `rag/embeddings.py` — add new provider block |

---

## Requirements

- Python ≥ 3.10
- Node.js ≥ 18
- A hosted PostgreSQL database (Supabase, Neon, Railway, Render — local databases are not reachable from a deployed backend)
- API key for at least one LLM provider (HuggingFace free tier available)
