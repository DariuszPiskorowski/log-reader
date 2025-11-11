import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, X, RotateCcw } from 'lucide-react';
import { naturalSort } from '@/utils/csvParser';

interface DataTableProps {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

const NUMERIC_COLUMNS = ['Number', 'LowerLimit', 'Value', 'UpperLimit'];

export const DataTable = ({ headers, rows, totalRows }: DataTableProps) => {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      return Object.entries(filters).every(([column, filterValue]) => {
        if (!filterValue) return true;
        const cellValue = row[column]?.toLowerCase() || '';
        const filter = filterValue.toLowerCase();
        return cellValue.includes(filter);
      });
    });
  }, [rows, filters]);

  const sortedRows = useMemo(() => {
    if (sortConfigs.length === 0) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      for (const { column, direction } of sortConfigs) {
        const aVal = a[column] || '';
        const bVal = b[column] || '';
        
        let comparison = 0;
        if (NUMERIC_COLUMNS.includes(column)) {
          comparison = naturalSort(aVal, bVal, true);
        } else if (column === 'StepNumber') {
          comparison = naturalSort(aVal, bVal, false);
        } else {
          comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        }

        if (comparison !== 0) {
          return direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }, [filteredRows, sortConfigs]);

  const handleSort = useCallback((column: string, shiftKey: boolean) => {
    setSortConfigs(prev => {
      if (!shiftKey) {
        // Single column sort
        const existing = prev.find(s => s.column === column);
        if (existing) {
          if (existing.direction === 'desc') {
            return [];
          }
          return [{ column, direction: 'desc' }];
        }
        return [{ column, direction: 'asc' }];
      } else {
        // Multi-column sort
        const existing = prev.find(s => s.column === column);
        if (existing) {
          if (existing.direction === 'desc') {
            return prev.filter(s => s.column !== column);
          }
          return prev.map(s => 
            s.column === column ? { ...s, direction: 'desc' as const } : s
          );
        }
        return [...prev, { column, direction: 'asc' }];
      }
    });
  }, []);

  const handleFilterChange = useCallback((column: string, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const resetSort = useCallback(() => {
    setSortConfigs([]);
  }, []);

  const getSortIcon = (column: string) => {
    const sortIndex = sortConfigs.findIndex(s => s.column === column);
    if (sortIndex === -1) return <ArrowUpDown className="w-4 h-4" />;
    
    const sort = sortConfigs[sortIndex];
    const Icon = sort.direction === 'asc' ? ArrowUp : ArrowDown;
    
    return (
      <div className="flex items-center gap-1">
        <Icon className="w-4 h-4" />
        {sortConfigs.length > 1 && (
          <span className="text-xs font-bold">{sortIndex + 1}</span>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6 bg-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{sortedRows.length}</span> of{' '}
          <span className="font-semibold text-foreground">{totalRows}</span> rows
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={Object.values(filters).every(f => !f)}
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetSort}
            disabled={sortConfigs.length === 0}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Sort
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg border-table-border">
        <table className="w-full">
          <thead className="bg-table-header sticky top-0 z-10">
            <tr>
              {headers.map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-table-border"
                >
                  <button
                    onClick={(e) => handleSort(header, e.shiftKey)}
                    className="flex items-center gap-2 hover:text-primary transition-colors w-full"
                    title="Click to sort, Shift+Click for multi-column sort"
                  >
                    <span>{header}</span>
                    {getSortIcon(header)}
                  </button>
                </th>
              ))}
            </tr>
            <tr>
              {headers.map(header => (
                <th key={`filter-${header}`} className="px-4 py-2 border-b border-table-border">
                  <Input
                    placeholder={`Filter ${header}...`}
                    value={filters[header] || ''}
                    onChange={(e) => handleFilterChange(header, e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-table-hover transition-colors border-b border-table-border last:border-b-0"
              >
                {headers.map(header => (
                  <td
                    key={`${index}-${header}`}
                    className="px-4 py-3 text-sm text-foreground whitespace-nowrap"
                  >
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedRows.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No rows match the current filters
        </div>
      )}
    </Card>
  );
};
