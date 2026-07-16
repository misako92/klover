export function validateIDU(idu: string): boolean {
  // Typical format: FR123456_01ABCD
  // "FR" prefix, 6 digits, underscore, 2 digits, 4 uppercase letters
  const iduRegex = /^FR\d{6}_\d{2}[A-Z]{4}$/;
  if (!idu) return false;

  // Return true if it matches the pattern
  return iduRegex.test(idu.trim().toUpperCase());
}
