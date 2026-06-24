const MIN_DIGITS = 8;
const MAX_DIGITS = 13;
const COUNTRY_CODE = '55';
const LOCAL_LENGTH_WITHOUT_NINTH = 10;
const DDD_LENGTH = 2;

export const NORMALIZED_PHONE_REGEX = /^55\d{10,11}$/;

// Normaliza para o formato 55 + DDD + número (com nono dígito).
// Retorna '' quando o valor não é um telefone brasileiro válido.
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return '';
  const withCountry = digits.startsWith(COUNTRY_CODE) ? digits : `${COUNTRY_CODE}${digits}`;
  const afterCountry = withCountry.slice(COUNTRY_CODE.length);
  if (afterCountry.length === LOCAL_LENGTH_WITHOUT_NINTH) {
    const ddd = afterCountry.slice(0, DDD_LENGTH);
    const rest = afterCountry.slice(DDD_LENGTH);
    return `${COUNTRY_CODE}${ddd}9${rest}`;
  }
  return withCountry;
}
