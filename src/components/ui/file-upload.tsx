
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  storageBucket: string;
  storagePath: string;
  maxSizeInMB?: number;
  acceptedFileTypes?: string;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  storageBucket,
  storagePath,
  maxSizeInMB = 5,
  acceptedFileTypes = "image/*",
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    setUploadError(null);
    
    if (!file.type.match(acceptedFileTypes.replace(/\*/g, '.*'))) {
      setUploadError(`File type not accepted. Please upload ${acceptedFileTypes} files.`);
      return false;
    }
    
    if (file.size > maxSizeInBytes) {
      setUploadError(`File too large. Maximum size is ${maxSizeInMB}MB.`);
      return false;
    }
    
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${storagePath}/${fileName}`;

      // Create object URL for preview
      setPreview(URL.createObjectURL(file));
      
      // Upload file
      const { error: uploadError, data } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
      
      toast({
        title: "Upload successful",
        description: "Your file has been uploaded.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file. Please try again.');
      
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFile(e.target.files[0]);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className={className}>
      {!preview ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center",
            isDragging ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-700",
            "transition-all duration-200"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm font-medium mb-1">
            Drag and drop your file here
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {acceptedFileTypes.replace('*', '')} files up to {maxSizeInMB}MB
          </p>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Select File"
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isUploading}
          />
          {uploadError && (
            <p className="mt-2 text-sm text-red-500">{uploadError}</p>
          )}
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="File preview"
            className="w-full h-auto object-cover max-h-64"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              onClick={clearPreview}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Uploading...</p>
              </div>
            </div>
          )}
          {uploadProgress === 100 && !isUploading && (
            <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
