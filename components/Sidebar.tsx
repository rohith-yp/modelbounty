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
    <aside className="hidden w-64 shrink-0 border-r border-[#232732] bg-[#0C0D10] lg:flex lg:flex-col select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-[#232732] px-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-[#353B4A] bg-[#16181F] text-xs font-mono font-semibold text-[#E09F3E] transition group-hover:border-[#E09F3E]/60">
            MB
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wider text-[#EDEDF0] uppercase font-mono">
              MODEL<span className="text-[#E09F3E]">BOUNTY</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.16em] text-[#525866] font-mono">
              Verif. Protocol
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-5">
        <div className="mb-2.5 px-3 text-[10px] font-mono uppercase tracking-[0.16em] text-[#525866]">
          Navigation Ledger
        </div>

        <nav className="space-y-0.5">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded px-3 py-2 text-xs transition ${
                  active
                    ? "bg-[#181B23] text-[#EDEDF0] font-medium border-l-2 border-[#E09F3E] pl-2.5"
                    : "text-[#8C93A4] hover:bg-[#13151B] hover:text-[#EDEDF0]"
                }`}
              >
                <span>{item.name}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E09F3E]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Telemetry / Network Footer */}
      <div className="border-t border-[#232732] p-4 bg-[#090A0C]">
        <div className="rounded border border-[#1C2029] bg-[#13151B] p-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#525866] uppercase tracking-wider">
            <span>Escrow Net</span>
            <span className="text-[9px] text-[#38A169] bg-[#38A169]/10 px-1.5 py-0.2 rounded font-mono">
              Active
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38A169] animate-pulse" />
            <span className="text-xs text-[#EDEDF0] font-medium">Sepolia Testnet</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[#8C93A4]">
            <span className="text-[#525866]">Contract</span>
            <span className="text-[#8C93A4]">0x5FbD...aa</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
