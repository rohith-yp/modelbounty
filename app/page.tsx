"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

const stats = [
  {
    label: "Active Bounties",
    value: "12",
    change: "+3 this week",
  },
  {
    label: "Tests Submitted",
    value: "148",
    change: "+24 today",
  },
  {
    label: "Verified Findings",
    value: "37",
    change: "91% verification rate",
  },
  {
    label: "Rewards Distributed",
    value: "2.84 ETH",
    change: "Across 37 findings",
  },
];

const bounties = [
  {
    name: "FraudDetect V1",
    type: "Fraud Detection",
    status: "Testing",
    tests: 48,
    findings: 12,
    reward: "0.50 ETH",
  },
  {
    name: "HealthRisk Classifier",
    type: "Healthcare ML",
    status: "Testing",
    tests: 31,
    findings: 7,
    reward: "0.35 ETH",
  },
  {
    name: "SupportIntent AI",
    type: "NLP",
    status: "Review",
    tests: 19,
    findings: 4,
    reward: "0.20 ETH",
  },
];

const bountySlugMap: Record<string, string> = {
  "FraudDetect V1": "fraud-detect-v1",
  "HealthRisk Classifier": "health-risk-classifier",
  "SupportIntent AI": "support-intent-ai",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main */}
        <section className="min-w-0 flex-1">
          {/* Top bar */}
          <Navbar title="Overview" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            {/* Welcome */}
            <div className="mb-8">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Model Owner
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Your verification overview
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Monitor your AI models, independent tests, verified findings,
                and bounty activity from one place.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5"
                >
                  <div className="text-xs text-zinc-600">{stat.label}</div>

                  <div className="mt-3 text-2xl font-semibold tracking-tight">
                    {stat.value}
                  </div>

                  <div className="mt-2 text-[11px] text-cyan-300/70">
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Bounties */}
            <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.06] bg-[#090c11]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    Active Bounties
                  </h3>
                  <p className="mt-1 text-xs text-zinc-600">
                    Models currently receiving independent tests
                  </p>
                </div>

                <Link
                  href="/create-bounty"
                  className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
                >
                  + Create Bounty
                </Link>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {bounties.map((bounty) => {
                  const bountySlug =
                    bountySlugMap[bounty.name] ||
                    bounty.name.toLowerCase().replace(/\s+/g, "-");

                  return (
                    <Link
                      key={bounty.name}
                      href={`/research-arena?challenge=${bountySlug}`}
                      className="grid gap-4 px-5 py-5 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center cursor-pointer transition hover:bg-white/[0.02] group"
                    >
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                          {bounty.name}
                        </div>
                        <div className="mt-1 text-xs text-zinc-600">
                          {bounty.type}
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

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] ${
                            bounty.status === "Testing"
                              ? "bg-cyan-300/10 text-cyan-300"
                              : "bg-yellow-300/10 text-yellow-300"
                          }`}
                        >
                          {bounty.status}
                        </span>
                        <span className="text-xs text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Workflow */}
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <Link
                href="/create-bounty"
                className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 block transition hover:border-cyan-300/30"
              >
                <div className="font-mono text-xs text-cyan-300">01</div>

                <h3 className="mt-5 text-sm font-medium">
                  Publish your model
                </h3>

                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  Define the model, expected behavior, testing scope, and
                  bounty reward.
                </p>
              </Link>

              <Link
                href="/research-arena"
                className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 block transition hover:border-cyan-300/30"
              >
                <div className="font-mono text-xs text-cyan-300">02</div>

                <h3 className="mt-5 text-sm font-medium">
                  Researchers challenge it
                </h3>

                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  Independent researchers submit inputs designed to expose
                  unexpected model behavior.
                </p>
              </Link>

              <Link
                href="/validator"
                className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 block transition hover:border-cyan-300/30"
              >
                <div className="font-mono text-xs text-cyan-300">03</div>

                <h3 className="mt-5 text-sm font-medium">
                  Findings get verified
                </h3>

                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  Reproduction and independent validation determine whether a
                  submitted finding is legitimate.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
