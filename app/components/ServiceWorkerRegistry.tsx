"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistry() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" || window.location.hostname === "localhost")
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Immediately check for worker updates on page load
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.debug("SW registration info:", err);
        });
    }
  }, []);

  return null;
}
