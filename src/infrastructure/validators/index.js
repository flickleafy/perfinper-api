/**
 * Brazilian CNPJ and CPF validation utilities
 * Contains proper validation algorithms for Brazilian business and personal identifiers
 */

/**
 * Validates Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * @param {string} cnpj - CNPJ string to validate
 * @returns {boolean} - True if CNPJ is valid
 */
export function isValidCNPJ(cnpj) {
  if (!cnpj) return false;

  // Remove all non-numeric characters
  cnpj = cnpj.replace(/[^\d]/g, '');

  // CNPJ must have exactly 14 digits
  if (cnpj.length !== 14) return false;

  // Check for known invalid CNPJs (all same digits)
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  // Validate CNPJ using check digits algorithm
  let sum = 0;
  let weight = 2;

  // Calculate first check digit
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  let remainder = sum % 11;
  let firstCheckDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cnpj.charAt(12)) !== firstCheckDigit) return false;

  // Calculate second check digit
  sum = 0;
  weight = 2;

  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  remainder = sum % 11;
  let secondCheckDigit = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(cnpj.charAt(13)) === secondCheckDigit;
}

/**
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas)
 * @param {string} cpf - CPF string to validate
 * @returns {boolean} - True if CPF is valid
 */
export function isValidCPF(cpf) {
  if (!cpf) return false;

  // Remove all non-numeric characters
  cpf = cpf.replace(/[^\d]/g, '');

  // CPF must have exactly 11 digits
  if (cpf.length !== 11) return false;

  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validate CPF using check digits algorithm
  let sum = 0;

  // Calculate first check digit
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }

  let remainder = sum % 11;
  let firstCheckDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cpf.charAt(9)) !== firstCheckDigit) return false;

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }

  remainder = sum % 11;
  let secondCheckDigit = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(cpf.charAt(10)) === secondCheckDigit;
}

/**
 * Determines if a document identifier is a CNPJ, CPF, or invalid
 * @param {string} document - Document string to identify
 * @returns {object} - Object with type ('cnpj', 'cpf', 'invalid') and isValid boolean
 */
export function identifyDocumentType(document) {
  if (!document) {
    return { type: 'invalid', isValid: false };
  }

  // Remove all non-numeric characters
  const cleanDocument = document.replace(/[^\d]/g, '');

  // Check CNPJ (14 digits)
  if (cleanDocument.length === 14) {
    return {
      type: 'cnpj',
      isValid: isValidCNPJ(cleanDocument),
    };
  }

  // Check CPF (11 digits)
  if (cleanDocument.length === 11) {
    return {
      type: 'cpf',
      isValid: isValidCPF(cleanDocument),
    };
  }

  return { type: 'invalid', isValid: false };
}

/**
 * Formats CNPJ with standard Brazilian formatting
 * @param {string} cnpj - CNPJ string to format
 * @returns {string} - Formatted CNPJ (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(cnpj) {
  if (!cnpj) return '';

  const cleanCnpj = cnpj.replace(/[^\d]/g, '');

  if (cleanCnpj.length !== 14) return cnpj;

  return cleanCnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formats CPF with standard Brazilian formatting
 * @param {string} cpf - CPF string to format
 * @returns {string} - Formatted CPF (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf) {
  if (!cpf) return '';

  const cleanCpf = cpf.replace(/[^\d]/g, '');

  if (cleanCpf.length !== 11) return cpf;

  return cleanCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

// Default export with all validation functions
export default {
  isValidCNPJ,
  isValidCPF,
  identifyDocumentType,
  formatCNPJ,
  formatCPF,
};
