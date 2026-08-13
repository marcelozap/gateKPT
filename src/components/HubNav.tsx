"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/gatekpt/content";

export function HubNav({ locale = "en" }: { locale?: Locale }) {
  const pathname = usePathname();
  const isSpanish = locale === "es";
  const links = [
    { href: isSpanish ? "/es" : "/", label: isSpanish ? "Capas de IA" : "AI layers" },
    { href: isSpanish ? "/es/log" : "/log", label: isSpanish ? "Escritura" : "Writing" },
    { href: "/notes/the-mental-time-trap", label: isSpanish ? "Nota 002" : "Note 002" },
  ];

  return (
    <header className="gkh-nav">
      <div className="gkh-inner">
        <div className="gkh-brand-wrap">
          <Link
            href={isSpanish ? "/es" : "/"}
            title="GateKPT home"
            aria-label="GateKPT home"
            className="gkh-brand gki-mono"
          >
            GateKPT
          </Link>
        </div>

        <nav aria-label="Primary" className="gkh-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="gkh-link gki-mono"
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link className="gkh-language gki-mono" href={isSpanish ? "/" : "/es"}>
          {isSpanish ? "EN" : "ES"}
        </Link>
      </div>
    </header>
  );
}
