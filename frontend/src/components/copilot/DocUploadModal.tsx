import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { uploadDoc, getDocs, deleteDoc } from "@/api/client";
import { DocInfo } from "@/types";
import { Trash2, Upload, Loader2, FileText } from "lucide-react";
import { useEffect } from "react";

interface DocUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export const DocUploadModal = ({ open, onClose }: DocUploadModalProps) => {
  const { setDocsReady } = useApp();
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await getDocs();
      setDocs(data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { if (open) loadDocs(); }, [open]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadStatus("");
    try {
      const res = await uploadDoc(files[0]);
      setUploadStatus(`Uploaded: ${res.chunks_added || 0} chunks added`);
      loadDocs();
    } catch {
      setUploadStatus("Upload failed.");
    } finally { setUploading(false); }
  };

  const handleDelete = async (source: string) => {
    setDocs(prev => prev.filter(d => d.source !== source));
    try { await deleteDoc(source); } catch { loadDocs(); }
  };

  const handleStart = () => {
    setDocsReady(true);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Knowledge Base Setup">
      <div className="space-y-4">
        {/* Doc list */}
        <div className="max-h-48 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No documents uploaded yet.</p>
          ) : docs.map(d => (
            <div key={d.source} className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{d.source}</p>
                  <p className="text-xs text-muted-foreground">{d.chunk_count} chunks</p>
                </div>
              </div>
              <button onClick={() => handleDelete(d.source)} className="p-1 rounded hover:bg-destructive/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>

        {/* Upload */}
        <label className="block border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
          <input type="file" accept=".pdf" className="hidden" onChange={e => handleUpload(e.target.files)} disabled={uploading} />
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Drop a PDF or click to upload</p>
            </>
          )}
        </label>
        {uploadStatus && <p className="text-xs text-primary-light">{uploadStatus}</p>}

        <button
          onClick={handleStart}
          disabled={docs.length === 0}
          className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/80 disabled:opacity-50 transition-all"
        >
          Start Chatting
        </button>
      </div>
    </Modal>
  );
};
