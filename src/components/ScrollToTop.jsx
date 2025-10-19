import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Prüfe ob scrollTo verfügbar ist (z.B. in Test-Umgebung)
    if (typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}