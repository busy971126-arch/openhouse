/** Instagram URL → @handle */
export function formatInstagramHandle(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (trimmed.startsWith("@")) return trimmed;

  const match = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  if (match?.[1]) return `@${match[1]}`;

  return trimmed;
}
