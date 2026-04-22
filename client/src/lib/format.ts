export const formatHeight = (h: number) => `${(h / 10).toFixed(1)} m`;

export const formatWeight = (w: number) => `${(w / 10).toFixed(1)} kg`;

export function capitalize(name: string) {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
