import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
      onFileSelect(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a .txt file",
        variant: "destructive",
      });
    }
  }, [onFileSelect, toast]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <Card
      className="p-12 border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer bg-card"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 rounded-full bg-primary/10">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Upload Log File</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop or click to select a .txt file
          </p>
        </div>
        <input
          id="file-input"
          type="file"
          accept=".txt"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    </Card>
  );
};
