/**
 * Monetary Value Utility Functions
 * Handles normalization and parsing of monetary values across the application.
 * 
 * Standard format: "1500,00" (comma as decimal separator, no thousand separators)
 */

/**
 * Normalize monetary value to standard comma format (e.g., "1500,00")
 * Handles both period and comma decimal formats.
 * Removes thousand separators and negative signs.
 * 
 * @param {string|number} value - The monetary value to normalize
 * @returns {string} Normalized value in format "1500,00"
 */
export function normalizeMonetaryValue(value) {
  if (value === null || value === undefined || value === '') {
    return '0,00';
  }
  
  // If already a number, convert to string with comma
  if (typeof value === 'number') {
    return Math.abs(value).toFixed(2).replace('.', ',');
  }
  
  let strValue = String(value).trim();
  
  // Remove currency symbols and whitespace
  strValue = strValue.replace(/[R$\s]/g, '');
  
  // Remove negative sign (we'll handle type separately)
  strValue = strValue.replace('-', '');
  
  // Detect format: if has comma after period, comma is thousand separator
  // e.g., "1.500,00" vs "1,500.00"
  const lastComma = strValue.lastIndexOf(',');
  const lastPeriod = strValue.lastIndexOf('.');
  
  if (lastComma > lastPeriod) {
    // Comma is decimal separator: "1.500,00" or "1500,00"
    // Remove thousand separator (period)
    strValue = strValue.replace(/\./g, '');
  } else if (lastPeriod > lastComma) {
    // Period is decimal separator: "1,500.00" or "1500.00"
    // Remove thousand separator (comma) and convert period to comma
    strValue = strValue.replace(/,/g, '').replace('.', ',');
  }
  // If no decimal separator found, or only one type, assume comma format
  
  // Parse to ensure valid number and format to 2 decimal places
  const numValue = parseFloat(strValue.replace(',', '.')) || 0;
  return Math.abs(numValue).toFixed(2).replace('.', ',');
}

/**
 * Parse monetary value from string to number
 * Handles both comma and period decimal formats.
 * 
 * @param {string|number} value - The monetary value to parse
 * @returns {number} Parsed numeric value (always positive)
 */
export function parseMonetaryValue(value) {
  if (typeof value === 'number') {
    return Math.abs(value);
  }
  
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  // Normalize first, then parse
  const normalized = normalizeMonetaryValue(value);
  return parseFloat(normalized.replace(',', '.')) || 0;
}

/**
 * Format monetary value for display
 * 
 * @param {string|number} value - The monetary value to format
 * @param {boolean} includeSymbol - Whether to include R$ symbol
 * @returns {string} Formatted value like "R$ 1.500,00"
 */
export function formatMonetaryDisplay(value, includeSymbol = true) {
  const numValue = parseMonetaryValue(value);
  
  // Format with thousand separators
  const parts = numValue.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatted = `${intPart},${parts[1]}`;
  
  return includeSymbol ? `R$ ${formatted}` : formatted;
}
