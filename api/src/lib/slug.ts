const SLUG_MAX = 80;

export function slugifyCafeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 5);
}

export async function generateUniqueCafeSlug(
  baseName: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let base = slugifyCafeName(baseName);
  if (!base) base = "cafe";

  if (!(await exists(base))) return base;

  for (let i = 0; i < 10; i++) {
    const candidate = `${base}-${randomSlugSuffix()}`.slice(0, SLUG_MAX);
    if (!(await exists(candidate))) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`.slice(0, SLUG_MAX);
}
