"use client";

import Link from "next/link";

const links = [
  { href: "/log", label: "Notes" },
  { href: "/#map", label: "Map" },
  { href: "/es", label: "ES" },
  { href: "https://marcelozapata.dev", label: "Marcelo", external: true },
];

export function HubNav() {
  return (
    <header
      className="sticky top-0 z-[100] material-ultra-thin"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto flex h-11 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          title="GateKPT AI learning hub"
          aria-label="GateKPT AI learning hub"
          className="flex items-center gap-1.5 rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50"
        >
          <span className="text-sm font-semibold tracking-tight text-white">GateKPT</span>
          <span className="hidden text-[11px] text-apple-label3 sm:inline">/</span>
          <span className="hidden text-[11px] font-medium text-apple-label2 sm:inline">AI, from the ground up</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className="rounded-lg px-2 py-1.5 text-[12px] font-medium text-white/60 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:px-3 sm:text-[13px]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
