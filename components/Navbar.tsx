"use client";

import Link from "next/link";
import WalletButton from "./WalletButton";

export default function Navbar({ title = "Overview" }: { title?: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#232732] bg-[#0C0D10]/80 backdrop-blur-md px-6 lg:px-8 select-none">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#525866]">
          LEDGER
        </span>
        <span className="text-xs text-[#353B4A]">/</span>
        <h1 className="text-xs font-mono font-medium tracking-wide text-[#EDEDF0] uppercase">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/documentation"
          className="hidden rounded border border-[#232732] bg-[#13151B] px-3 py-1.5 text-xs font-mono text-[#8C93A4] transition hover:border-[#3D4454] hover:text-[#EDEDF0] sm:block"
        >
          DOCS_SPEC
        </Link>
        <WalletButton />
      </div>
    </header>
  );
}
