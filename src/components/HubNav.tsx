"use client";

import Link from "next/link";

const links = [
  { href: "/", label: "Landing" },
  { href: "/#pricing", label: "Offer" },
  { href: "/#videos", label: "Videos" },
  { href: "/#early-access", label: "Early Access" },
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
          title="GateKPT music home"
          aria-label="GateKPT music home"
          className="flex items-center gap-1.5 rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-[#e37b45]/50"
        >
          <span className="text-sm font-semibold tracking-tight text-white">GateKPT</span>
          <span className="text-[11px] text-apple-label3">/</span>
          <span className="text-[11px] font-medium text-apple-label2">Music</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-white/60 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e37b45]/40"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
