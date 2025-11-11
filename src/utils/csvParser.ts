export interface ParsedData {
  metadata: string[];
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  filteredRows: number;
  errors: string[];
}

const REQUIRED_COLUMNS = [
  'Number',
  'StepNumber',
  'LowerLimit',
  'Value',
  'UpperLimit',
  'Unit',
  'CompareMode',
  'Result',
  'AlternativeText'
];

export function parseCSV(content: string): ParsedData {
  const lines = content.split('\n');
  const errors: string[] = [];
  
  // Extract metadata (first two lines)
  const metadata = [lines[0]?.trim() || '', lines[1]?.trim() || ''];
  
  // Find header line (third line after metadata)
  const headerLine = lines[2];
  if (!headerLine) {
    errors.push('No header line found');
    return { metadata, headers: [], rows: [], totalRows: 0, filteredRows: 0, errors };
  }
  
  // Parse header
  const allHeaders = parseCSVLine(headerLine);
  
  // Create column index map
  const columnMap: Record<string, number> = {};
  allHeaders.forEach((header, index) => {
    columnMap[header] = index;
  });
  
  // Validate required columns exist
  const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in columnMap));
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    return { metadata, headers: REQUIRED_COLUMNS, rows: [], totalRows: 0, filteredRows: 0, errors };
  }
  
  // Parse data rows
  const rows: Record<string, string>[] = [];
  let totalRows = 0;
  
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    
    // Skip if wrong number of columns
    if (values.length !== allHeaders.length) continue;
    
    // Check if StepNumber is non-empty
    const stepNumber = values[columnMap['StepNumber']] || '';
    if (!stepNumber) continue;
    
    totalRows++;
    
    // Extract only required columns
    const row: Record<string, string> = {};
    REQUIRED_COLUMNS.forEach(col => {
      row[col] = values[columnMap[col]] || '';
    });
    
    rows.push(row);
  }
  
  return {
    metadata,
    headers: REQUIRED_COLUMNS,
    rows,
    totalRows: rows.length,
    filteredRows: rows.length,
    errors
  };
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current);
  
  return values;
}

export function normalizeNumber(value: string): number {
  // Remove spaces and convert comma to dot
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

export function naturalSort(a: string, b: string, isNumeric: boolean = false): number {
  if (isNumeric) {
    return normalizeNumber(a) - normalizeNumber(b);
  }
  
  // Natural sort for StepNumber (e.g., "135.014")
  const aParts = a.split('.').map(p => parseFloat(p) || 0);
  const bParts = b.split('.').map(p => parseFloat(p) || 0);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal !== bVal) return aVal - bVal;
  }
  
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
