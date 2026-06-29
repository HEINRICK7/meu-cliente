export function normalizeFirestoreId(value: string | null | undefined, fallback = '') {
  return (value ?? fallback).trim();
}
