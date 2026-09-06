export const vendor_query_max_length = 64;
export const vendor_query_max_words = 4;

const vendor_query_pattern = /^[\p{L}\p{N}][\p{L}\p{N} .\-_&+/]*$/u;

export function normaliseVendorQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isValidVendorQuery(raw: string): boolean {
  const v = normaliseVendorQuery(raw);
  if (v.length === 0 || v.length > vendor_query_max_length) return false;
  if (v.split(" ").length > vendor_query_max_words) return false;
  return vendor_query_pattern.test(v);
}
