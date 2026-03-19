import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
  showClose?: boolean;
}

export const Modal = ({ open, onClose, title, children, showClose = true }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl shadow-glow max-w-lg w-full mx-4 p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-foreground">{title}</h2>
          {showClose && onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};
