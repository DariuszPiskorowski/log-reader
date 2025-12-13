import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { MetadataDisplay } from '@/components/MetadataDisplay';
import { DataTable } from '@/components/DataTable';
import { parseCSV, ParsedData } from '@/utils/csvParser';
import { useToast } from '@/hooks/use-toast';
import { FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    try {
      const content = await file.text();
      const data = parseCSV(content);
      
      setParsedData(data);
      
      if (data.errors.length > 0) {
        toast({
          title: "Parsing completed with warnings",
          description: data.errors.join(', '),
          variant: "destructive",
        });
      } else {
        toast({
          title: "File parsed successfully",
          description: `Loaded ${data.totalRows} rows with non-empty StepNumber`,
        });
      }
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Log Data Analyzer
            </h1>
          </div>
          <p className="text-muted-foreground">
            Upload and analyse log files from Testman
          </p>
        </header>

        {!parsedData ? (
          <FileUpload onFileSelect={handleFileSelect} />
        ) : (
          <div className="space-y-6">
            {parsedData.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {parsedData.errors.join(', ')}
                </AlertDescription>
              </Alert>
            )}
            
            <MetadataDisplay metadata={parsedData.metadata} />
            
            {parsedData.rows.length > 0 ? (
              <DataTable
                headers={parsedData.headers}
                rows={parsedData.rows}
                totalRows={parsedData.totalRows}
                metadata={parsedData.metadata}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No valid data rows found in the file
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => setParsedData(null)}
                className="text-sm text-primary hover:underline"
              >
                Upload a different file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
