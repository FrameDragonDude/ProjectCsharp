export function resolveAssetUrl(maybeUrl?: string | null): string | undefined {
  if (!maybeUrl) return undefined;
  // If absolute, return as-is
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;

  // Otherwise treat as a backend-relative path and prepend backend base
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
  const backendBase = apiBase.replace(/\/api\/?$/, '');

  let path = maybeUrl;
  if (!path.startsWith('/')) path = `/${path}`;
  return `${backendBase}${path}`;
}
