import { useCallback, useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImageUploadProps {
  onUpload: (images: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({
  onUpload,
  multiple = true,
  maxFiles = 20,
  className,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const validFiles = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, maxFiles - previews.length);

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setPreviews((prev) => {
            const newPreviews = [...prev, result].slice(0, maxFiles);
            return newPreviews;
          });
        };
        reader.readAsDataURL(file);
      });
    },
    [maxFiles, previews.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (previews.length > 0) {
      onUpload(previews);
    }
  };

  const clearAll = () => {
    setPreviews([]);
  };

  return (
    <div className={className}>
      <Card
        className={`relative cursor-pointer border-2 border-dashed p-6 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        data-testid="dropzone-upload"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          data-testid="input-file-upload"
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-muted p-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Drop images here or click to upload</p>
            <p className="text-sm text-muted-foreground">
              {multiple ? `Up to ${maxFiles} images` : "Single image"} (JPG, PNG)
            </p>
          </div>
        </div>
      </Card>

      {previews.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {previews.length} image{previews.length > 1 ? "s" : ""} selected
            </span>
            <Button variant="ghost" size="sm" onClick={clearAll} data-testid="button-clear-images">
              Clear all
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full rounded-md object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  data-testid={`button-remove-image-${index}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <Button onClick={handleSubmit} className="w-full" data-testid="button-upload-submit">
            <ImageIcon className="mr-2 h-4 w-4" />
            Upload {previews.length} Image{previews.length > 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
