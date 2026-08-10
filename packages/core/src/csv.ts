import { Pence, parseAmount } from './money';
import { categorize } from './categorize';

export type BankFormat = 'amex' | 'revolut' | 'unknown';

export interface ParsedTransaction {
  date: string;    // ISO yyyy-mm-dd
  amount: Pence;   // positive = spend
  merchant: string;
  categoryId: string;
}

export interface CsvParseResult {
  format: BankFormat;
  rows: ParsedTransaction[];
}

// Minimal CSV line splitter that respects double-quoted fields.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(field); field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out.map((f) => f.trim());
}

function toIsoDate(raw: string): string {
  const s = raw.trim();
  // Revolut: "2026-08-09 10:00:00"
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  // Amex: "09/08/2026" (DD/MM/YYYY)
  const ukMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ukMatch) return `${ukMatch[3]}-${ukMatch[2]}-${ukMatch[1]}`;
  return s;
}

export function parseCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { format: 'unknown', rows: [] };
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());

  const isRevolut = header.includes('started date') && header.includes('amount');
  const isAmex = header.includes('date') && header.includes('description') && header.includes('amount') && !isRevolut;
  if (!isRevolut && !isAmex) return { format: 'unknown', rows: [] };

  const col = (name: string) => header.indexOf(name);
  const rows: ParsedTransaction[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const dateRaw = cells[col(isRevolut ? 'started date' : 'date')] ?? '';
    const merchant = cells[col('description')] ?? '';
    const amountRaw = cells[col('amount')] ?? '';
    const signed = parseAmount(amountRaw);

    if (isRevolut) {
      if (signed >= 0) continue; // keep only outflows
      rows.push({ date: toIsoDate(dateRaw), amount: Math.abs(signed), merchant, categoryId: categorize(merchant) });
    } else {
      if (signed <= 0) continue; // Amex charges are positive
      rows.push({ date: toIsoDate(dateRaw), amount: signed, merchant, categoryId: categorize(merchant) });
    }
  }

  return { format: isRevolut ? 'revolut' : 'amex', rows };
}
