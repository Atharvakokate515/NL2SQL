import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Upload, Trash2, FileText, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/common/Modal";
import { getDocs, uploadDoc, deleteDoc } from "@/api/client";
import type { DocInfo } from "@/types";

interface DocUploadModalProps {
  onReady: () => void;
  onClose?: () => void;
  showBack?: boolean;
}

const DocUploadModal: React.FC<DocUploadModalProps> = ({ onReady, onClose, showBack = true }) => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await getDocs();
      setDocs(res.documents || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadDoc(file);
      setUploadResult(`${res.status}: ${res.chunks_added} chunks added`);
      fetchDocs();
    } catch (err: any) {
      setUploadResult(`Error: ${err.message}`);
    }
    setUploading(false);
  };

  const handleDelete = async (source: string) => {
    setDocs((prev) => prev.filter((d) => d.source !== source));
    try { await deleteDoc(source); fetchDocs(); } catch { fetchDocs(); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") handleUpload(file);
  };

  return (
    <Modal title="Knowledge Base Setup" onClose={onClose}>
      {showBack && (
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to home
        </button>
      )}

      {/* Document list */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground mb-2">Documents</h3>
        {loading ? (
          <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : docs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No documents uploaded yet</p>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
            {docs.map((doc) => (
              <div key={doc.source} className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2 group">
                <FileText size={14} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{doc.source}</p>
                  <p className="text-xs text-muted-foreground">{doc.chunk_count} chunks</p>
                </div>
                <button
                  onClick={() => handleDelete(doc.source)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".pdf";
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          };
          input.click();
        }}
      >
        {uploading ? (
          <Loader2 size={24} className="mx-auto text-primary animate-spin" />
        ) : (
          <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
        )}
        <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Drop a PDF here or click to browse"}</p>
      </div>

      {uploadResult && (
        <div className="flex items-center gap-2 mt-2 text-xs text-success">
          <CheckCircle size={14} /> {uploadResult}
        </div>
      )}

      <button
        onClick={onReady}
        disabled={docs.length === 0}
        className="w-full mt-4 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
      >
        Start Chatting
      </button>
    </Modal>
  );
};

export default DocUploadModal;
