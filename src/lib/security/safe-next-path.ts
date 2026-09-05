const DEFAULT_ADMIN_PATH = "/admin/projects";

function isSafeAdminPath(value: string): boolean {
  if (!value.startsWith("/admin")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  if (/[\\@]/.test(value)) return false;
  if (value.includes("://") || value.includes("//")) return false;
  return true;
}

/**
 * Restrict post-login redirects to same-origin /admin paths.
 */
export function safeAdminNextPath(nextPath: string): string {
  if (!isSafeAdminPath(nextPath)) {
    return DEFAULT_ADMIN_PATH;
  }

  let decoded = nextPath;
  try {
    decoded = decodeURIComponent(nextPath);
  } catch {
    return DEFAULT_ADMIN_PATH;
  }

  if (!isSafeAdminPath(decoded)) {
    return DEFAULT_ADMIN_PATH;
  }

  return nextPath;
}
