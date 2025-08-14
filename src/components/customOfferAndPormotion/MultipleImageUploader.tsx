import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { UploadCloud, X, Loader2, Clipboard } from 'lucide-react'; // Import Clipboard icon

// --- HELPER FUNCTION: SIMULATES UPLOADING TO YOUR IMAGE DB ---
const uploadFileToImageDB = (file: File): Promise<{ file: File; dbUrl: string }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) {
        const dbUrl = `https://my-image-db.com/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        console.log(`Uploaded ${file.name} to ${dbUrl}`);
        resolve({ file, dbUrl });
      } else {
        console.error(`Failed to upload ${file.name}`);
        reject(new Error(`Failed to upload ${file.name}`));
      }
    }, 1000 + Math.random() * 2000);
  });
};

interface MultipleImageUploaderProps {
  setImageUrls: (urls: string[]) => void;
  maxImages?: number;
}

export const MultipleImageUploader: React.FC<MultipleImageUploaderProps> = ({
  setImageUrls,
  maxImages = 6,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleNewFiles(selectedFiles);
    event.target.value = ''; // Reset input
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = Array.from(event.clipboardData?.items || []);
    const pastedFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          pastedFiles.push(file);
        }
      }
    }

    if (pastedFiles.length > 0) {
      handleNewFiles(pastedFiles);
      toast.info(`Pasted ${pastedFiles.length} image(s).`);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    handleNewFiles(droppedFiles);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleNewFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > maxImages) {
      toast.error(`You can only upload a maximum of ${maxImages} images.`);
      return;
    }

    const validImageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    const invalidFilesCount = newFiles.length - validImageFiles.length;

    if (invalidFilesCount > 0) {
      toast.warning(`Ignored ${invalidFilesCount} non-image file(s).`);
    }

    const filteredNewFiles = validImageFiles.filter(file => !files.some(f => f.name === file.name && f.size === file.size && f.type === file.type));

    setFiles(prev => [...prev, ...filteredNewFiles]);
    const newPreviews = filteredNewFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    URL.revokeObjectURL(previews.splice(indexToRemove, 1)[0]);
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.info('Please select or paste images to upload.');
      return;
    }

    setIsLoading(true);
    const uploadToast = toast.loading(`Uploading ${files.length} image(s)...`);

    try {
      const uploadPromises = files.map(uploadFileToImageDB);
      const results = await Promise.all(uploadPromises);
      const uploadedUrls = results.map(result => result.dbUrl);

      setImageUrls(uploadedUrls);

      toast.success('All images uploaded successfully!', { id: uploadToast });

      setFiles([]);
      setPreviews([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(errorMessage, { id: uploadToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={dropAreaRef}
      className="w-full max-w-2xl mx-auto p-4 space-y-6"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <UploadCloud className="w-10 h-10 mb-4 text-gray-500" />
          <p className="mb-2 text-sm text-center text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span>, drag and drop, or paste
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG, GIF (MAX. {maxImages} images)
          </p>
          <div className="absolute top-2 right-2">
            <Clipboard className="w-5 h-5 text-gray-400" name="Paste Image (Ctrl+V or Cmd+V)" />
          </div>
        </label>
        <Input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading || files.length >= maxImages}
        />
      </div>

      {previews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-center">Image Previews ({previews.length}/{maxImages})</h3>
          <div className="grid grid-cols-2 gap-4">
            {previews.map((preview, index) => (
              <Card key={index} className="relative group">
                <CardContent className="p-0">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="object-cover w-full h-full rounded-lg aspect-square"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={handleUpload} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} Image(s)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
};