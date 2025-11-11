import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface MetadataDisplayProps {
  metadata: string[];
}

export const MetadataDisplay = ({ metadata }: MetadataDisplayProps) => {
  return (
    <Card className="p-4 bg-card">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-card-foreground mb-2">File Metadata</h3>
          <pre className="text-sm text-muted-foreground font-mono whitespace-pre-wrap break-words">
            {metadata.join('\n')}
          </pre>
        </div>
      </div>
    </Card>
  );
};
