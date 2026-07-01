export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
}

export function generateGroupId(name: string): string {
  const base = slugify(name) || "group";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
