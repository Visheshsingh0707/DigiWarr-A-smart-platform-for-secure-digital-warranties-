/**
 * Rule-based parser that extracts structured data from OCR text.
 * No external AI APIs — all processing is local.
 */

interface ExtractedData {
  productName: string | null;
  provider: string | null;
  purchaseDate: Date | null;
  expiryDate: Date | null;
  renewalDate: Date | null;
  amount: string | null;
  type: 'WARRANTY' | 'INVOICE' | 'POLICY';
}

// Common date formats
const datePatterns = [
  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g,
  // YYYY-MM-DD
  /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g,
  // Month DD, YYYY
  /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s*(\d{4})/gi,
  // DD Month YYYY
  /(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?),?\s*(\d{4})/gi,
];

const monthMap: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11,
};

function parseDate(text: string): Date | null {
  // Try YYYY-MM-DD format
  const isoMatch = text.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // Try DD/MM/YYYY format
  const ddmmMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (ddmmMatch) {
    const d = new Date(parseInt(ddmmMatch[3]), parseInt(ddmmMatch[2]) - 1, parseInt(ddmmMatch[1]));
    if (!isNaN(d.getTime())) return d;
  }

  // Try Month DD, YYYY
  const monthMatch = text.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (monthMatch) {
    const month = monthMap[monthMatch[1].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(parseInt(monthMatch[3]), month, parseInt(monthMatch[2]));
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

function findAllDates(text: string): Date[] {
  const dates: Date[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    for (const pattern of datePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const parsed = parseDate(match[0]);
        if (parsed && parsed.getFullYear() > 1990 && parsed.getFullYear() < 2100) {
          dates.push(parsed);
        }
      }
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

function extractAmount(text: string): string | null {
  const patterns = [
    /(?:Rs\.?|INR|₹|USD|\$|€|£)\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:Rs\.?|INR|USD)/i,
    /(?:total|amount|price|cost|premium)\s*:?\s*(?:Rs\.?|INR|₹|\$)?\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].replace(/,/g, '');
    }
  }
  return null;
}

function extractProductName(text: string): string | null {
  const patterns = [
    /(?:product|item|model|device|appliance)\s*(?:name|:)?\s*:?\s*(.+)/i,
    /(?:description)\s*:?\s*(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().substring(0, 100);
    }
  }
  return null;
}

function extractProvider(text: string): string | null {
  const patterns = [
    /(?:company|brand|manufacturer|insurer|provider|vendor|seller|issued by|from)\s*:?\s*(.+)/i,
    /(?:policy\s*(?:issued|provided)\s*by)\s*:?\s*(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().substring(0, 100);
    }
  }
  return null;
}

function detectDocumentType(text: string): 'WARRANTY' | 'INVOICE' | 'POLICY' {
  const lower = text.toLowerCase();

  const warrantyKeywords = ['warranty', 'guarantee', 'warranted', 'coverage period'];
  const policyKeywords = ['policy', 'insurance', 'premium', 'insured', 'coverage', 'nominee', 'claim'];
  const invoiceKeywords = ['invoice', 'bill', 'receipt', 'tax invoice', 'purchase'];

  let warrantyScore = warrantyKeywords.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
  let policyScore = policyKeywords.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
  let invoiceScore = invoiceKeywords.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);

  if (policyScore > warrantyScore && policyScore > invoiceScore) return 'POLICY';
  if (warrantyScore > invoiceScore) return 'WARRANTY';
  return 'INVOICE';
}

export function extractDocumentData(ocrText: string): ExtractedData {
  const dates = findAllDates(ocrText);
  const type = detectDocumentType(ocrText);

  // Find dates near keywords
  let purchaseDate: Date | null = null;
  let expiryDate: Date | null = null;
  let renewalDate: Date | null = null;

  const lines = ocrText.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    const lineDate = parseDate(line);

    if (lineDate) {
      if (lower.includes('purchase') || lower.includes('bought') || lower.includes('invoice date') || lower.includes('date of purchase')) {
        purchaseDate = lineDate;
      }
      if (lower.includes('expir') || lower.includes('valid until') || lower.includes('valid till') || lower.includes('warranty end') || lower.includes('coverage end')) {
        expiryDate = lineDate;
      }
      if (lower.includes('renew') || lower.includes('renewal') || lower.includes('next due')) {
        renewalDate = lineDate;
      }
    }
  }

  // Fallback: use earliest date as purchase, latest as expiry
  if (!purchaseDate && dates.length > 0) {
    purchaseDate = dates[0];
  }
  if (!expiryDate && dates.length > 1) {
    expiryDate = dates[dates.length - 1];
  }

  return {
    productName: extractProductName(ocrText),
    provider: extractProvider(ocrText),
    purchaseDate,
    expiryDate,
    renewalDate,
    amount: extractAmount(ocrText),
    type,
  };
}
