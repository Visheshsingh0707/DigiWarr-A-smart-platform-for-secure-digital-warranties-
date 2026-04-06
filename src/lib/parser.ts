/**
 * Rule-based parser that extracts structured data from OCR text.
 * No external AI APIs — all processing is local.
 */

export interface ExtractedData {
  productName: string;
  provider: string;
  purchaseDate: string; // YYYY-MM-DD
  expiryDate: string;
  renewalDate: string;
  amount: string;
  type: 'WARRANTY' | 'INVOICE' | 'POLICY';
}

function cleanOcrText(text: string): string {
  let cleaned = text;

  // 1. Remove spaces around slashes and dashes so dates like "12 / 04 / 2023" become "12/04/2023"
  cleaned = cleaned.replace(/\s+([/\-\.])\s+/g, '$1');
  
  // 2. Fix common OCR character confusions in numbers and symbols
  cleaned = cleaned.replace(/\|/g, 'I'); // Pipe to I
  
  // 3. Fix common keyword typos from OCR
  cleaned = cleaned.replace(/tota[l1!]/gi, 'Total');
  cleaned = cleaned.replace(/am[ou]+nt/gi, 'Amount');
  cleaned = cleaned.replace(/pr[i1l]ce/gi, 'Price');
  cleaned = cleaned.replace(/rs[\.,]\s/gi, 'Rs. ');
  cleaned = cleaned.replace(/₹/gi, 'Rs. '); // Standardize

  return cleaned;
}

// More forgiving date patterns
const datePatterns = [
  // YYYY-MM-DD or YYYY/MM/DD
  /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g,
  // DD/MM/YYYY or MM/DD/YYYY
  /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/g, // matches 2-digit or 4-digit years!
  // Month DD, YYYY
  /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(\d{1,2})[,\s]*(\d{2,4})/gi,
  // DD Month YYYY
  /(\d{1,2})[\s\-]+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]*(\d{2,4})/gi,
];

const monthMap: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

function normalizeYear(yearStr: string): number {
  let y = parseInt(yearStr, 10);
  // Expand 2-digit years. E.g., 23 -> 2023, 99 -> 1999
  if (y < 100) {
    if (y > 50) return 1900 + y;
    return 2000 + y;
  }
  return y;
}

function parseDateStrings(text: string): Date | null {
  // YYYY-MM-DD
  const isoMatch = text.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (y > 1990 && y < 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(y, m - 1, d);
    }
  }

  // DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (slashMatch) {
    let part1 = parseInt(slashMatch[1], 10);
    let part2 = parseInt(slashMatch[2], 10);
    let y = normalizeYear(slashMatch[3]);
    
    if (y > 1990 && y < 2100) {
      if (part1 > 12 && part2 <= 12) {
        return new Date(y, part2 - 1, part1);
      } else if (part2 > 12 && part1 <= 12) {
        return new Date(y, part1 - 1, part2);
      } else if (part1 <= 12 && part2 <= 12) {
        return new Date(y, part2 - 1, part1); // assume DD/MM/YYYY
      }
    }
  }

  // Month DD, YYYY
  const monthFirstMatch = text.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(\d{1,2})[,\s]*(\d{2,4})/i);
  if (monthFirstMatch) {
    const month = monthMap[monthFirstMatch[1].toLowerCase()];
    const d = parseInt(monthFirstMatch[2], 10);
    const y = normalizeYear(monthFirstMatch[3]);
    if (month && d >= 1 && d <= 31 && y > 1990 && y < 2100) {
      return new Date(y, month - 1, d);
    }
  }

  // DD Month YYYY
  const dayFirstMatch = text.match(/(\d{1,2})[\s\-]+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]*(\d{2,4})/i);
  if (dayFirstMatch) {
    const d = parseInt(dayFirstMatch[1], 10);
    const month = monthMap[dayFirstMatch[2].toLowerCase()];
    const y = normalizeYear(dayFirstMatch[3]);
    if (month && d >= 1 && d <= 31 && y > 1990 && y < 2100) {
      return new Date(y, month - 1, d);
    }
  }

  return null;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function findAllDates(text: string): Date[] {
  const dates: Date[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    for (const pattern of datePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const parsed = parseDateStrings(match[0]);
        // Deduplicate
        if (parsed && !dates.some(d => d.getTime() === parsed.getTime())) {
          dates.push(parsed);
        }
      }
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

function extractAmount(text: string): string {
  // Regex designed for high noise
  // Look for keywords Total, Net, Amount, etc.
  // Then allow colons, spaces, and currency symbols
  // Finally capture the number sequence (handling O->0 and l->1 implicitly by capturing word chars and fixing them)
  const patterns = [
    /(?:total|amount|price|cost|net|grand|sum)\s*[:;|\-]?\s*(?:rs\.?|inr|usd|eur|gbp|₹|\$|€|£)?\s*([0-9Olo]+[.,]?[0-9Olo]*)/i,
    /(?:rs\.?|inr|₹|usd|\$|€|£)\s*([0-9Olo]+[.,]?[0-9Olo]*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let rawNum = match[1];
      // Fix common OCR math substitutions
      rawNum = rawNum.replace(/[Oo]/g, '0').replace(/[l]/g, '1');
      rawNum = rawNum.replace(/,/g, ''); // remove commas for pure number
      
      // Basic validity check
      if (!isNaN(parseFloat(rawNum))) {
        return parseFloat(rawNum).toString();
      }
    }
  }
  return '';
}

function extractProductName(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  
  // 1. Keyword search
  const patterns = [
    /(?:product|item|model|device|description|particulars)\s*(?:name|no\.?|number|:)?\s*[:;|\-]?\s*(.+)/i,
    /model\s*(?:no\.?|number|:)?\s*([a-z0-9\-]+)/i
  ];

  for (const pattern of patterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match && match[1].length > 2) {
        return match[1].trim().substring(0, 100);
      }
    }
  }

  // 2. Fallback heuristic: large capitalized strings or lines that look like brands
  const strongBrands = ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Bose', 'Whirlpool', 'Panasonic'];
  for (const line of lines) {
    for (const brand of strongBrands) {
      if (line.toLowerCase().includes(brand.toLowerCase())) {
        return line.substring(0, 100);
      }
    }
  }

  return '';
}

function extractProvider(text: string): string {
  const patterns = [
    /(?:company|brand|manufacturer|insurer|provider|vendor|merchant|seller|issued by|from|store|shop)\s*[:;|\-]?\s*(.+)/i,
    /(?:authorized|authorised)\s*(?:dealer|retailer)\s*[:;|\-]?\s*(.+)/i,
  ];

  const lines = text.split('\n').map(l => l.trim());

  for (const pattern of patterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match && match[1].length > 2) {
        return match[1].trim().substring(0, 100);
      }
    }
  }

  // Provider is usually at the very top of receipts
  if (lines.length > 0) {
    // Return first non-trivial line as a guess
    const firstGoodLine = lines.find(l => l.length > 4 && !l.match(/^[0-9\W]+$/));
    if (firstGoodLine) return firstGoodLine.substring(0, 100);
  }

  return '';
}

function detectDocumentType(text: string): 'WARRANTY' | 'INVOICE' | 'POLICY' {
  const lower = text.toLowerCase();

  const warrantyKeywords = ['warranty', 'guarantee', 'warranted', 'coverage period'];
  const policyKeywords = ['policy', 'insurance', 'premium', 'insured', 'nominee', 'claim', 'renewal'];
  const invoiceKeywords = ['invoice', 'bill', 'receipt', 'tax invoice', 'purchase', 'total amount', 'cash'];

  let warrantyScore = warrantyKeywords.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
  let policyScore = policyKeywords.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
  let invoiceScore = invoiceKeywords.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);

  if (policyScore > warrantyScore && policyScore > invoiceScore) return 'POLICY';
  if (warrantyScore > invoiceScore) return 'WARRANTY';
  return 'INVOICE';
}

export function extractDocumentData(rawText: string): ExtractedData {
  const ocrText = cleanOcrText(rawText);
  const dates = findAllDates(ocrText);
  const type = detectDocumentType(ocrText);

  let purchaseDateStr = '';
  let expiryDateStr = '';
  let renewalDateStr = '';

  const lines = ocrText.split('\n');
  let purchaseDateVal: Date | null = null;
  let expiryDateVal: Date | null = null;
  let renewalDateVal: Date | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Look for dates on this line OR the immediate next line
    const availableDates = findAllDates(line + ' ' + (lines[i + 1] || ''));

    if (availableDates.length > 0) {
      if (lower.includes('purchase') || lower.includes('invoice') || lower.includes('date: ') || lower.includes('bill date') || lower.includes('order date')) {
        if (!purchaseDateVal) purchaseDateVal = availableDates[0];
      }
      if (lower.includes('expir') || lower.includes('valid until') || lower.includes('valid till') || lower.includes('end') || lower.includes('coverage to')) {
        if (!expiryDateVal) expiryDateVal = availableDates[0];
      }
      if (lower.includes('renew') || lower.includes('next due')) {
        if (!renewalDateVal) renewalDateVal = availableDates[0];
      }
    }
  }

  // Fallback heuristic: use earliest date as purchase, latest as expiry
  if (!purchaseDateVal && dates.length > 0) {
    purchaseDateVal = dates[0];
  }
  if (!expiryDateVal && dates.length > 1) {
    // Ensure we don't accidentally pick up birth dates or old structural dates
    const futureDates = dates.filter(d => d > (purchaseDateVal || new Date(2000, 0, 1)));
    if (futureDates.length > 0) {
      expiryDateVal = futureDates[futureDates.length - 1];
    }
  }

  // Logic check: expiry cannot be before purchase trivially
  if (purchaseDateVal && expiryDateVal && expiryDateVal < purchaseDateVal) {
    const temp = expiryDateVal;
    expiryDateVal = purchaseDateVal;
    purchaseDateVal = temp;
  }

  if (purchaseDateVal) purchaseDateStr = formatDate(purchaseDateVal);
  if (expiryDateVal) expiryDateStr = formatDate(expiryDateVal);
  if (renewalDateVal) renewalDateStr = formatDate(renewalDateVal);

  return {
    productName: extractProductName(ocrText),
    provider: extractProvider(ocrText),
    purchaseDate: purchaseDateStr,
    expiryDate: expiryDateStr,
    renewalDate: renewalDateStr,
    amount: extractAmount(ocrText),
    type,
  };
}
