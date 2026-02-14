"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  bucket: string;
  folder: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  currentUrl?: string | null;
  maxSizeMB?: number;
  className?: string;
};

export function ImageUpload({
  bucket,
  folder,
  onUpload,
  onRemove,
  currentUrl,
  maxSizeMB = 5,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File must be under ${maxSizeMB}MB`);
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { upsert: true });

        if (error) {
          toast.error("Upload failed: " + error.message);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        onUpload(publicUrlData.publicUrl);
        toast.success("Image uploaded!");
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, maxSizeMB, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (currentUrl) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border", className)}>
        <div className="relative h-48 w-full">
          <Image
            src={currentUrl}
            alt="Cover"
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            type="button"
            size="icon-xs"
            variant="destructive"
            onClick={() => onRemove?.()}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
        dragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop an image, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxSizeMB}MB, JPG/PNG/WebP
          </p>
        </div>
      )}
    </div>
  );
}
