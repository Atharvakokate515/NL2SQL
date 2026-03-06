import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ children, onClose, title }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl shadow-primary/5 animate-fade-in">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  </div>
);

export default Modal;
