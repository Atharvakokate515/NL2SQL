import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";

interface TokenLimitBannerProps {
  provider?: string;  // optional — shown if known
}

const PROVIDER_LINKS: Record<string, { label: string; url: string }> = {
  openai:       { label: "OpenAI billing",      url: "https://platform.openai.com/account/billing" },
  groq:         { label: "Groq console",         url: "https://console.groq.com/settings/billing" },
  huggingface:  { label: "HuggingFace settings", url: "https://huggingface.co/settings/billing" },
};

export const TokenLimitBanner = ({ provider }: TokenLimitBannerProps) => {
  const link = provider ? PROVIDER_LINKS[provider.toLowerCase()] : undefined;

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[65%] rounded-xl border border-warning/60 bg-warning/10 px-4 py-3.5 space-y-2.5">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-warning/20 shrink-0">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <p className="text-sm font-semibold text-warning">
            API Token Limit Reached
          </p>
        </div>

        {/* Body */}
        <p className="text-xs text-foreground/80 leading-relaxed">
          Your API quota or rate limit has been exhausted. The request could not
          be completed. This usually means you have run out of free-tier credits
          or hit a per-minute / per-day rate limit.
        </p>

        {/* What to do */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground/70 uppercase tracking-wide">
            What to do
          </p>
          <ul className="text-xs text-foreground/70 space-y-0.5 list-disc list-inside">
            <li>Wait a moment and try again (rate limit may reset)</li>
            <li>Check your API key billing or usage dashboard</li>
            <li>Switch to a different provider in your <code className="bg-muted px-1 rounded text-[11px]">.env</code></li>
          </ul>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 text-xs bg-warning/20 hover:bg-warning/30 text-warning px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>

          {link && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-accent"
            >
              <ExternalLink className="w-3 h-3" />
              {link.label}
            </a>
          )}
        </div>

      </div>
    </div>
  );
};