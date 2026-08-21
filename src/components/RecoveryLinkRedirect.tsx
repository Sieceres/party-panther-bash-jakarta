import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Safety net for password recovery links.
 * If Supabase falls back to the Site URL (root) instead of /reset-password,
 * detect the recovery tokens in the URL and forward the user to /reset-password
 * with the tokens intact.
 */
export const RecoveryLinkRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/reset-password") return;

    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const isRecovery =
      search.get("type") === "recovery" ||
      hash.get("type") === "recovery" ||
      (!!hash.get("access_token") && hash.get("type") === "recovery");

    if (!isRecovery) return;

    navigate(
      `/reset-password${window.location.search}${window.location.hash}`,
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);

  return null;
};
