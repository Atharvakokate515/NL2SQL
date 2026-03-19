import { useState } from "react";
import { Message } from "@/types";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  onClarificationSubmit?: (response: string, originalInput: string) => void;
}

export const ChatMessage = ({ message, onClarificationSubmit }: ChatMessageProps) => {
  const [clarInput, setClarInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[75%] bg-primary text-primary-foreground px-4 py-2.5 rounded-xl rounded-br-sm text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[80%] border border-destructive/50 bg-destructive/10 rounded-xl px-4 py-3 text-sm">
          {message.metadata?.errorCode && (
            <span className="inline-block bg-destructive/20 text-destructive text-xs font-medium px-2 py-0.5 rounded mb-1 mr-2">
              {message.metadata.errorCode}
            </span>
          )}
          <p className="text-destructive">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.role === "clarification") {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[80%] border border-warning/50 bg-warning/10 rounded-xl px-4 py-3 text-sm">
          <p className="text-warning mb-2">{message.metadata?.question || message.content}</p>
          {!submitted ? (
            <div className="flex gap-2">
              <input
                value={clarInput}
                onChange={e => setClarInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && clarInput.trim()) {
                    setSubmitted(true);
                    onClarificationSubmit?.(clarInput.trim(), message.metadata?.originalInput || "");
                  }
                }}
                placeholder="Type your response..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-warning/50"
              />
              <button
                onClick={() => {
                  if (clarInput.trim()) {
                    setSubmitted(true);
                    onClarificationSubmit?.(clarInput.trim(), message.metadata?.originalInput || "");
                  }
                }}
                className="px-3 py-1.5 bg-warning text-warning-foreground rounded-lg text-sm hover:bg-warning/80 transition-all"
              >
                Send
              </button>
            </div>
          ) : (
            <p className="text-foreground italic text-xs">Responded: {clarInput}</p>
          )}
        </div>
      </div>
    );
  }

  // assistant
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[80%] bg-surface border border-border rounded-xl px-4 py-3 text-sm space-y-2">
        {message.metadata?.wasRetried && (
          <span className="inline-flex items-center gap-1 bg-warning/20 text-warning text-xs font-medium px-2 py-0.5 rounded">
            <RefreshCw className="w-3 h-3" /> Retried
          </span>
        )}
        <p className="text-foreground whitespace-pre-wrap">{message.content}</p>

        {/* Tool badges for copilot */}
        {message.metadata?.tool && (
          <div className="flex gap-2 flex-wrap">
            {message.metadata.tool === "synthesis" && (
              <>
                {message.metadata.sqlUsed && (
                  <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded">🗄 SQL</span>
                )}
                {message.metadata.ragUsed && (
                  <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded">📄 RAG</span>
                )}
              </>
            )}
            {message.metadata.tool === "chat" && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">💬 Chat</span>
            )}
          </div>
        )}

        {message.metadata?.answerGrounded === false && message.metadata?.ragUsed && (
          <div className="flex items-center gap-1.5 text-warning text-xs mt-1">
            <AlertTriangle className="w-3 h-3" />
            Answer may not be fully from your documents
          </div>
        )}

        {/* Citations */}
        {message.metadata?.citations && message.metadata.citations.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Sources ({message.metadata.citations.length})
            </summary>
            <div className="mt-2 space-y-1.5">
              {message.metadata.citations.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-foreground">{c.source}</span>
                  <span className="text-muted-foreground">p.{c.page}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                    <div
                      className={`h-full rounded-full ${c.confidence >= 0.8 ? "bg-success" : c.confidence >= 0.5 ? "bg-warning" : "bg-destructive"}`}
                      style={{ width: `${c.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground">{(c.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};
