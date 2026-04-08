export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function ensureUniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>
): Promise<string> {
  const normalized = slugify(base) || "item";
  let attempt = normalized;
  let suffix = 2;
  while (await exists(attempt)) {
    attempt = `${normalized}-${suffix}`;
    suffix += 1;
  }
  return attempt;
}
