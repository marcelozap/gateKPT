"use client";

import Link from "next/link";

const links = [
  { href: "/", label: "Stack" },
  { href: "/log", label: "Field log" },
  { href: "/notes/wall-e", label: "Note 001" },
];

export function HubNav() {
  return (
    <header className="gkh-nav">
      <div className="gkh-inner">
        <Link href="/" title="GateKPT home" aria-label="GateKPT home" className="gkh-brand gki-mono">
          GateKPT
        </Link>

        <nav aria-label="Primary" className="gkh-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="gkh-link gki-mono">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
