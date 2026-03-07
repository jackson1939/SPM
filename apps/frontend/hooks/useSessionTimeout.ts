// hooks/useSessionTimeout.ts — cierre de sesión automático por inactividad (17 min)
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";

const INACTIVITY_MINUTES = 17;
const INACTIVITY_MS = INACTIVITY_MINUTES * 60 * 1000;

const PUBLIC_PATHS = ["/", "/login", "/404"];

export function useSessionTimeout() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    localStorage.removeItem("role");
    window.location.href = "/login?timeout=1";
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(logout, INACTIVITY_MS);
  }, [logout]);

  useEffect(() => {
    const path = router.pathname || "";
    if (PUBLIC_PATHS.some((p) => path === p)) return;

    resetTimer();
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [router.pathname, resetTimer]);
}
