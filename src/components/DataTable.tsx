import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, FileDown } from 'lucide-react';
import { naturalSort } from '@/utils/csvParser';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DataTableProps {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  metadata?: string[];
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

const NUMERIC_COLUMNS = ['Number', 'LowerLimit', 'Value', 'UpperLimit'];

export const DataTable = ({ headers, rows, totalRows, metadata = [] }: DataTableProps) => {
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const stickyScrollRef = useRef<HTMLDivElement>(null);
  const stickyScrollContentRef = useRef<HTMLDivElement>(null);
  
  console.log('DataTable received headers:', headers);
  console.log('DataTable received rows (first row):', rows[0]);

  // Synchronize scroll between table and sticky scrollbar
  useEffect(() => {
    const tableScroll = tableScrollRef.current;
    const stickyScroll = stickyScrollRef.current;
    
    if (!tableScroll || !stickyScroll) return;

    const handleTableScroll = () => {
      if (stickyScroll) {
        stickyScroll.scrollLeft = tableScroll.scrollLeft;
      }
    };

    const handleStickyScroll = () => {
      if (tableScroll) {
        tableScroll.scrollLeft = stickyScroll.scrollLeft;
      }
    };

    // Update sticky scrollbar width to match table
    const updateStickyWidth = () => {
      if (tableScroll && stickyScrollContentRef.current) {
        stickyScrollContentRef.current.style.width = `${tableScroll.scrollWidth}px`;
      }
    };

    tableScroll.addEventListener('scroll', handleTableScroll);
    stickyScroll.addEventListener('scroll', handleStickyScroll);
    
    // Initial width update
    updateStickyWidth();
    
    // Update on window resize
    window.addEventListener('resize', updateStickyWidth);
    
    // Use ResizeObserver to update when table content changes
    const resizeObserver = new ResizeObserver(updateStickyWidth);
    resizeObserver.observe(tableScroll);

    return () => {
      tableScroll.removeEventListener('scroll', handleTableScroll);
      stickyScroll.removeEventListener('scroll', handleStickyScroll);
      window.removeEventListener('resize', updateStickyWidth);
      resizeObserver.disconnect();
    };
  }, []);

  const sortedRows = useMemo(() => {
    if (sortConfigs.length === 0) return rows;

    return [...rows].sort((a, b) => {
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
  }, [rows, sortConfigs]);

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

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    let yPosition = 15;

    // Add metadata
    if (metadata.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('File Metadata:', 14, yPosition);
      yPosition += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      metadata.forEach((line) => {
        doc.text(line, 14, yPosition);
        yPosition += 5;
      });
      
      yPosition += 5;
    }

    // Prepare table data
    const tableData = sortedRows.map(row => 
      headers.map(header => row[header] || '')
    );

    // Generate table
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 14, right: 14 },
    });

    // Save the PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    doc.save(`log-data-${timestamp}.pdf`);
  }, [headers, sortedRows, metadata]);

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
            onClick={exportToPDF}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export to PDF
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

      <div ref={tableScrollRef} className="overflow-x-auto border rounded-lg border-table-border">
        <table className="w-full table-fixed">
          <colgroup>
            {headers.map(header => {
              // Define column widths based on expected content
              const getColumnWidth = () => {
                switch (header) {
                  case 'Number': return 'w-[60px]';
                  case 'StepNumber': return 'w-[90px]';
                  case 'LowerLimit': return 'w-[90px]';
                  case 'Value': return 'w-[100px]';
                  case 'UpperLimit': return 'w-[90px]';
                  case 'Unit': return 'w-[60px]';
                  case 'CompareMode': return 'w-[100px]';
                  case 'Result': return 'w-[70px]';
                  case 'AlternativeText': return 'w-auto';
                  default: return 'w-auto';
                }
              };
              return <col key={header} className={getColumnWidth()} />;
            })}
          </colgroup>
          <thead className="bg-table-header sticky top-0 z-10">
            <tr>
              {headers.map(header => (
                <th
                  key={header}
                  className="px-3 py-3 text-left text-sm font-semibold text-foreground border-b border-table-border"
                >
                  <button
                    onClick={(e) => handleSort(header, e.shiftKey)}
                    className="flex items-center gap-1 hover:text-primary transition-colors w-full whitespace-nowrap"
                    title="Click to sort, Shift+Click for multi-column sort"
                  >
                    <span>{header}</span>
                    {getSortIcon(header)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, index) => {
              const resultVal = String(row['Result'] ?? '').trim().toLowerCase();
              const isFailed = resultVal === 'false' || resultVal === 'failed' || resultVal === 'fail';
              return (
                <tr
                  key={index}
                  className={`hover:bg-table-hover transition-colors border-b border-table-border last:border-b-0 ${
                    isFailed ? 'bg-destructive/10 text-destructive' : ''
                  }`}
                >
                {headers.map(header => {
                  const value = row[header];
                  const isHex = value && value.length > 32 && /^[0-9A-Fa-f\s]+$/.test(value.replace(/\s/g, ''));
                  const isAlternativeText = header === 'AlternativeText';
                  
                  return (
                    <td
                      key={`${index}-${header}`}
                      className={`px-3 py-3 text-sm ${isFailed ? 'text-destructive' : 'text-foreground'} ${isAlternativeText ? '' : 'truncate'}`}
                      title={value}
                    >
                      {isHex ? (
                        <div className="font-mono text-xs break-all leading-relaxed">
                          {value.replace(/\s/g, '').match(/.{1,16}/g)?.join(' ') || value}
                        </div>
                      ) : isAlternativeText ? (
                        <span className="break-words">{value}</span>
                      ) : (
                        <span className="whitespace-nowrap">{value}</span>
                      )}
                    </td>
                  );
                })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sticky horizontal scrollbar */}
      <div 
        ref={stickyScrollRef}
        className="fixed bottom-0 left-0 right-0 overflow-x-auto bg-background/95 backdrop-blur-sm border-t border-border z-50 h-4"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div ref={stickyScrollContentRef} className="h-1" />
      </div>
    </Card>
  );
};
