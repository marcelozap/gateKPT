"use client";

import { useEffect } from "react";

export function SpanishDocumentGuard() {
  useEffect(() => {
    const root = document.documentElement;
    const previousLang = root.lang;
    const previousTranslate = root.getAttribute("translate");
    const hadNoTranslate = root.classList.contains("notranslate");

    root.lang = "es";
    root.setAttribute("translate", "no");
    root.classList.add("notranslate");

    return () => {
      root.lang = previousLang || "en";

      if (previousTranslate) {
        root.setAttribute("translate", previousTranslate);
      } else {
        root.removeAttribute("translate");
      }

      if (!hadNoTranslate) {
        root.classList.remove("notranslate");
      }
    };
  }, []);

  return null;
}
