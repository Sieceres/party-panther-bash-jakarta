const KEY = "auth_redirect_path";

/** Remember the page a signed-out user was on before hitting /auth */
export function rememberAuthRedirect(path: string) {
  if (!path || path.startsWith("/auth") || path.startsWith("/reset-password")) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* ignore */
  }
}

/** Read & clear the remembered path (falls back to home) */
export function consumeAuthRedirect(): string {
  try {
    const p = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return p || "/";
  } catch {
    return "/";
  }
}
