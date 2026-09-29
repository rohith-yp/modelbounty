"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const navigationItems = [
  { name: "Overview", href: "/" },
  { name: "My Bounties", href: "/my-bounties" },
  { name: "Create Bounty", href: "/create-bounty" },
  { name: "Research Arena", href: "/research-arena" },
  { name: "My Submissions", href: "/my-submissions" },
  { name: "Validator", href: "/validator" },
  { name: "Hackathon Arena", href: "/hackathon-arena" },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    if (href === "/my-submissions") {
      return (
        pathname === "/my-submissions" ||
        pathname === "/researcher" ||
        pathname.startsWith("/submit-finding")
      );
    }
    if (href === "/hackathon-arena") {
      return (
        pathname === "/hackathon-arena" ||
        pathname === "/hackathon"
      );
    }
    if (href === "/my-bounties") {
      return (
        pathname === "/my-bounties" ||
        pathname.startsWith("/bounties")
      );
    }
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-[#090c11] lg:flex lg:flex-col">
      <div className="flex h-20 items-center border-b border-white/[0.06] px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            MB
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              Model<span className="text-cyan-300">Bounty</span>
            </div>
            <div className="text-[10px] text-zinc-600">
              Verification Network
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-3 py-6">
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Workspace
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-cyan-300/10 text-cyan-200 font-medium"
                    : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-600">
            Network
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            <span className="text-xs text-zinc-300">Testnet Connected</span>
          </div>
          <div className="mt-2 font-mono text-[10px] text-zinc-600">
            Sepolia
          </div>
        </div>
      </div>
    </aside>
  );
}
