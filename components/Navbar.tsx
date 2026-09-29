"use client";

import Link from "next/link";
import WalletButton from "./WalletButton";

export default function Navbar({ title = "Overview" }: { title?: string }) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-white/[0.06] px-6 lg:px-8">
      <div>
        <div className="text-xs text-zinc-600">Workspace</div>
        <h1 className="mt-1 text-lg font-medium text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/documentation"
          className="hidden rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs text-zinc-400 transition hover:border-white/15 hover:text-white sm:block"
        >
          Documentation
        </Link>
        <WalletButton />
      </div>
    </header>
  );
}
