import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, ExternalLink, FileText, FileWarning, Calendar } from "lucide-react";
import { useEquipmentDocuments, useUploadDocument, useDeleteDocument, getDocumentUrl } from "@/hooks/useEquipmentDocuments";
import { Constants } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { format } from "date-fns";

const categories = Constants.public.Enums.document_category;

const categoryLabels: Record<string, string> = {
  coc: "Certificate of Compliance",
  lease_agreement: "Lease Agreement",
  contact_details: "Contact Details",
  utility_account: "Utility Account",
  compliance_register: "Compliance Register",
  lighting_schedule: "Lighting Schedule",
  maintenance_report: "Maintenance Report",
  specification: "Specification",
  other: "Other",
};

const categoryColors: Record<string, string> = {
  coc: "bg-scada-green/20 text-scada-green border-scada-green/30",
  lease_agreement: "bg-primary/20 text-primary border-primary/30",
  contact_details: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  utility_account: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  compliance_register: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  lighting_schedule: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  maintenance_report: "bg-scada-amber/20 text-scada-amber border-scada-amber/30",
  specification: "bg-muted text-muted-foreground border-border",
  other: "bg-muted text-muted-foreground border-border",
};

interface DocumentRepositoryProps {
  equipmentId: string;
}

export function DocumentRepository({ equipmentId }: DocumentRepositoryProps) {
  const { data: documents = [], isLoading } = useEquipmentDocuments(equipmentId);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleUpload = () => {
    if (!selectedFile || !title.trim()) {
      toast.error("Title and file are required");
      return;
    }
    uploadMutation.mutate(
      { equipmentId, file: selectedFile, title: title.trim(), category, description: description.trim(), expiryDate },
      {
        onSuccess: () => {
          toast.success("Document uploaded");
          setTitle("");
          setCategory("other");
          setDescription("");
          setExpiryDate("");
          setSelectedFile(null);
          setShowUpload(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleDelete = (doc: typeof documents[0]) => {
    deleteMutation.mutate(doc, {
      onSuccess: () => toast.success("Document deleted"),
      onError: (err) => toast.error(err.message),
    });
  };

  const filteredDocs = filterCategory === "all"
    ? documents
    : documents.filter((d) => d.category === filterCategory);

  const usedCategories = [...new Set(documents.map((d) => d.category))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
          Documents ({documents.length})
        </h4>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => setShowUpload(!showUpload)}>
          <Upload className="w-3 h-3" />
          Upload
        </Button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="p-3 rounded border border-border bg-muted/30 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Title *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="font-mono text-xs" maxLength={200} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="font-mono text-xs">{categoryLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">File *</label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs h-8 flex-1" onClick={() => fileInputRef.current?.click()}>
                  {selectedFile ? selectedFile.name : "Choose file..."}
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Expiry Date</label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes..." className="font-mono text-xs min-h-[40px]" maxLength={1000} />
          </div>
          <Button size="sm" className="w-full text-xs font-mono" onClick={handleUpload} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      )}

      {/* Filter */}
      {usedCategories.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${filterCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            All
          </button>
          {usedCategories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${filterCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {categoryLabels[c] ?? c}
            </button>
          ))}
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <p className="text-xs font-mono text-muted-foreground animate-pulse text-center py-4">Loading documents...</p>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <FileWarning className="w-8 h-8 text-muted-foreground/30 mx-auto" />
          <p className="text-xs font-mono text-muted-foreground">No documents uploaded</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 p-2.5 rounded border border-border bg-card group hover:bg-muted/30 transition-colors">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-foreground truncate">{doc.title}</span>
                  <Badge variant="outline" className={`text-[9px] font-mono px-1.5 py-0 ${categoryColors[doc.category] ?? ""}`}>
                    {categoryLabels[doc.category] ?? doc.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                  <span>{doc.file_name}</span>
                  {doc.file_size && <span>{(doc.file_size / 1024).toFixed(0)} KB</span>}
                  <span>{format(new Date(doc.uploaded_at), "dd MMM yyyy")}</span>
                  {doc.expiry_date && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      Exp: {format(new Date(doc.expiry_date), "dd MMM yyyy")}
                    </span>
                  )}
                </div>
                {doc.description && (
                  <p className="text-[10px] font-mono text-muted-foreground/70">{doc.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <a href={getDocumentUrl(doc.file_path)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(doc)} disabled={deleteMutation.isPending}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
