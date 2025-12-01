import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  accept?: string;
  label?: string;
}

export function FileUpload({ 
  value, 
  onChange, 
  bucket = "ebook-files",
  accept = ".pdf,.epub,.mobi",
  label = "Upload File"
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB for ebooks)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onChange(data.publicUrl);
      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{value.split("/").pop()}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept={accept}
            onChange={handleUpload}
            disabled={uploading}
            className="flex-1"
          />
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="file-url">Or paste file URL</Label>
        <Input
          id="file-url"
          type="url"
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
