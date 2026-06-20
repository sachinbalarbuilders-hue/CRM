/**
 * Utility: mask a phone number showing only last 4 digits
 * e.g. 917048875020 → ••••••••5020
 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return phone;
  const visible = digits.slice(-4);
  const masked = "•".repeat(digits.length - 4);
  return masked + visible;
}
