const ThinkingIndicator = () => (
  <div className="flex items-start gap-3 animate-fade-in">
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.2s]" />
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.4s]" />
      <span className="ml-2 text-sm text-muted-foreground">Thinking...</span>
    </div>
  </div>
);

export default ThinkingIndicator;
