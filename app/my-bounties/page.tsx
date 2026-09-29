"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

const bounties = [
  {
    name: "FraudDetect V1",
    category: "Fraud Detection",
    tests: 48,
    findings: 12,
    reward: "0.50 ETH",
    status: "Testing",
  },
  {
    name: "HealthRisk Classifier",
    category: "Healthcare ML",
    tests: 31,
    findings: 7,
    reward: "0.35 ETH",
    status: "Testing",
  },
  {
    name: "SupportIntent AI",
    category: "NLP",
    tests: 19,
    findings: 4,
    reward: "0.20 ETH",
    status: "Review",
  },
];

const bountySlugMap: Record<string, string> = {
  "FraudDetect V1": "fraud-detect-v1",
  "HealthRisk Classifier": "health-risk-classifier",
  "SupportIntent AI": "support-intent-ai",
};

export default function MyBountiesPage() {
  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <section className="min-w-0 flex-1">
          <Navbar title="My Bounties" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Model Owner
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  My Bounties
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Manage your published models and monitor independent verification.
                </p>
              </div>

              <Link
                href="/create-bounty"
                className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
              >
                + Create Bounty
              </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-600">Active Bounties</div>
                <div className="mt-3 text-2xl font-semibold">3</div>
                <div className="mt-2 text-[11px] text-cyan-300/70">
                  Published models
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-600">Total Tests</div>
                <div className="mt-3 text-2xl font-semibold">98</div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  Stress tests run
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-600">Verified Findings</div>
                <div className="mt-3 text-2xl font-semibold">23</div>
                <div className="mt-2 text-[11px] text-emerald-400">
                  Confirmed model issues
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-600">Bounty Rewards</div>
                <div className="mt-3 text-2xl font-semibold text-cyan-300">
                  1.05 ETH
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  Allocated pool
                </div>
              </div>
            </div>

            {/* Published Bounties List */}
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#090c11]">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h3 className="text-sm font-medium text-white">
                  Published Bounties
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Models currently available for independent testing
                </p>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {bounties.map((bounty) => {
                  const slug =
                    bountySlugMap[bounty.name] ||
                    bounty.name.toLowerCase().replace(/\s+/g, "-");

                  return (
                    <div
                      key={bounty.name}
                      className="grid gap-4 px-5 py-5 md:grid-cols-[2fr_1fr_1fr_1fr_auto_auto] md:items-center"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">
                          {bounty.name}
                        </div>
                        <div className="mt-1 text-xs text-zinc-600">
                          {bounty.category}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                          Tests
                        </div>
                        <div className="mt-1 text-sm text-zinc-300">
                          {bounty.tests}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                          Findings
                        </div>
                        <div className="mt-1 text-sm text-zinc-300">
                          {bounty.findings}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                          Reward
                        </div>
                        <div className="mt-1 text-sm text-zinc-300">
                          {bounty.reward}
                        </div>
                      </div>

                      <div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] ${
                            bounty.status === "Testing"
                              ? "bg-cyan-300/10 text-cyan-300"
                              : "bg-yellow-300/10 text-yellow-300"
                          }`}
                        >
                          {bounty.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/research-arena?challenge=${slug}`}
                          className="rounded-lg bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
                        >
                          Challenge Model →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
