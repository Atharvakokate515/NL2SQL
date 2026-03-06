import React, { useState } from "react";
import { AlertTriangle, Zap } from "lucide-react";
import type { Message } from "@/types";
import CitationsPanel from "@/components/copilot/CitationsPanel";
import ToolBadge from "@/components/copilot/ToolBadge";

interface ChatMessageProps {
  message: Message;
  onClarificationSubmit?: (response: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onClarificationSubmit }) => {
  const [clarifyInput, setClarifyInput] = useState("");

  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[75%] bg-primary text-primary-foreground rounded-xl rounded-br-sm px-4 py-2.5 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex justify-start animate-fade-in">
        <div className="max-w-[80%] bg-card border border-destructive/50 rounded-xl px-4 py-3">
          {message.metadata?.errorCode && (
            <span className="inline-block px-2 py-0.5 text-xs font-mono rounded bg-destructive/20 text-destructive mb-2">
              {message.metadata.errorCode}
            </span>
          )}
          <p className="text-sm text-destructive">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.role === "clarification") {
    return (
      <div className="flex justify-start animate-fade-in">
        <div className="max-w-[80%] bg-card border border-warning/50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2 text-warning text-xs font-medium">
            <AlertTriangle size={14} /> Clarification needed
          </div>
          <p className="text-sm text-foreground mb-3">{message.content}</p>
          {onClarificationSubmit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (clarifyInput.trim()) {
                  onClarificationSubmit(clarifyInput.trim());
                  setClarifyInput("");
                }
              }}
              className="flex gap-2"
            >
              <input
                value={clarifyInput}
                onChange={(e) => setClarifyInput(e.target.value)}
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Type your response..."
              />
              <button type="submit" className="px-3 py-1.5 bg-warning text-warning-foreground text-sm rounded-lg hover:bg-warning/90 transition-colors">
                Reply
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[80%] bg-card border border-border rounded-xl px-4 py-3">
        <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {message.metadata?.wasRetried && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-warning/20 text-warning">
              <Zap size={12} /> Retried
            </span>
          )}
          {message.metadata?.tool && (
            <ToolBadge tool={message.metadata.tool} sqlUsed={message.metadata.sqlUsed} ragUsed={message.metadata.ragUsed} />
          )}
          {message.metadata?.answerGrounded === false && message.metadata?.ragUsed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-warning/20 text-warning">
              <AlertTriangle size={12} /> Answer may not be from your documents
            </span>
          )}
        </div>
        {message.metadata?.citations && message.metadata.citations.length > 0 && (
          <CitationsPanel citations={message.metadata.citations} />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
