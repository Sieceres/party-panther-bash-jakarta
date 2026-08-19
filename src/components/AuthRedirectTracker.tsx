import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { rememberAuthRedirect } from "@/lib/auth-redirect";

/** Keeps track of the last visited page so /auth can send users back after login */
export const AuthRedirectTracker = () => {
  const location = useLocation();

  useEffect(() => {
    rememberAuthRedirect(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
};
