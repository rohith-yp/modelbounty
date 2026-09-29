"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { fetchBounties, fetchDashboardStats, type BackendBounty, type DashboardStatsData } from "@/lib/api";

const initialBounties = [
  {
    id: "fraud-detect-v1",
    name: "FraudDetect V1",
    category: "Fraud Detection",
    tests: 48,
    findings: 12,
    reward: "0.50 ETH",
    status: "Testing",
  },
  {
    id: "health-risk-classifier",
    name: "HealthRisk Classifier",
    category: "Healthcare ML",
    tests: 31,
    findings: 7,
    reward: "0.35 ETH",
    status: "Testing",
  },
  {
    id: "support-intent-ai",
    name: "SupportIntent AI",
    category: "NLP",
    tests: 19,
    findings: 4,
    reward: "0.20 ETH",
    status: "Review",
  },
];

export default function MyBountiesPage() {
  const [bountyList, setBountyList] = useState(initialBounties);
  const [stats, setStats] = useState<DashboardStatsData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [bountiesData, statsData] = await Promise.all([
          fetchBounties(),
          fetchDashboardStats(),
        ]);

        if (!isMounted) return;

        if (bountiesData && bountiesData.length > 0) {
          const mapped = bountiesData.map((b: BackendBounty) => ({
            id: b.id,
            name: b.title || b.model_name,
            category: b.category,
            tests: b.finding_count ? b.finding_count * 4 : 12,
            findings: b.finding_count || 0,
            reward: b.reward,
            status: b.status === "ACTIVE" ? "Testing" : b.status === "PAUSED" ? "Review" : "Closed",
          }));
          setBountyList(mapped);
        }

        if (statsData) {
          setStats(statsData);
        }
      } catch {
        // Keep fallback data if fetch fails
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeCount = stats?.active_bounties ?? bountyList.filter((b) => b.status === "Testing").length;
  const verifiedFindings = stats?.approved_findings ?? bountyList.reduce((acc, b) => acc + b.findings, 0);
  const totalRewardPool = stats?.total_rewards ?? "1.05 ETH";
  const totalTests = stats?.total_findings ? stats.total_findings * 4 : 98;

  return (
    <main className="min-h-screen bg-[#0C0D10] text-[#EDEDF0]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Navbar title="My Bounties" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            {/* Header Telemetry */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#232732] pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase">
                    01 // MODEL OWNER PORTFOLIO
                  </span>
                  <span className="inline-block h-1 w-1 rounded-full bg-[#E09F3E]" />
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">
                    ESCROW MANAGEMENT
                  </span>
                </div>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Published Model Bounties
                </h1>

                <p className="mt-1 text-xs text-zinc-400">
                  Manage active AI model escrow pools, monitor stress test frequency, and track verified boundary vulnerabilities.
                </p>
              </div>

              <Link
                href="/create-bounty"
                className="self-start sm:self-auto inline-flex items-center gap-2 rounded border border-[#E09F3E] bg-[#E09F3E] px-4 py-2 font-mono text-xs font-semibold text-black transition hover:bg-[#E09F3E]/90"
              >
                <span>+ DEPLOY NEW BOUNTY</span>
              </Link>
            </div>

            {/* Metrics Strip */}
            <div className="mt-6 grid grid-cols-1 gap-px bg-[#232732] sm:grid-cols-2 lg:grid-cols-4 border border-[#232732]">
              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Active Campaigns
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">LIVE</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-white">
                    {activeCount}
                  </span>
                  <span className="text-[11px] text-zinc-500">models in audit</span>
                </div>
              </div>

              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Inference Stress Tests
                  </span>
                  <span className="font-mono text-[10px] text-[#E09F3E]">EXECUTIONS</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-white">
                    {totalTests}
                  </span>
                  <span className="text-[11px] text-zinc-500">payload checks</span>
                </div>
              </div>

              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Verified Findings
                  </span>
                  <span className="font-mono text-[10px] text-[#E09F3E]">ATTESTED</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-white">
                    {verifiedFindings}
                  </span>
                  <span className="text-[11px] text-zinc-500">confirmed anomalies</span>
                </div>
              </div>

              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Total Escrow Funded
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">SECURED</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-[#E09F3E]">
                    {totalRewardPool}
                  </span>
                  <span className="text-[11px] text-zinc-500">locked rewards</span>
                </div>
              </div>
            </div>

            {/* Published Bounties Ledger */}
            <div className="mt-8 border border-[#232732] bg-[#13151B]">
              <div className="flex items-center justify-between border-b border-[#232732] px-6 py-4">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase block">
                    02 // REGISTERED MODEL SPECIMENS
                  </span>
                  <h2 className="text-sm font-semibold text-white mt-0.5">
                    Active Escrow Campaigns
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-zinc-500">
                  {bountyList.length} CAMPAIGNS REGISTERED
                </span>
              </div>

              <div className="divide-y divide-[#232732]">
                {bountyList.map((bounty) => (
                  <div
                    key={bounty.id || bounty.name}
                    className="grid gap-4 p-5 md:grid-cols-[2fr_1fr_1fr_1fr_auto_auto] md:items-center hover:bg-[#0C0D10]/40 transition"
                  >
                    <div>
                      <div className="font-mono text-xs text-white font-medium">
                        {bounty.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                        {bounty.category} • ID: {bounty.id}
                      </div>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                        STRESS TESTS
                      </span>
                      <span className="font-mono text-xs text-zinc-300 font-semibold mt-0.5 block">
                        {bounty.tests}
                      </span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                        VERIFIED FINDINGS
                      </span>
                      <span className="font-mono text-xs text-[#E09F3E] font-semibold mt-0.5 block">
                        {bounty.findings}
                      </span>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                        ESCROW ALLOCATION
                      </span>
                      <span className="font-mono text-xs text-white font-bold mt-0.5 block">
                        {bounty.reward}
                      </span>
                    </div>

                    <div>
                      <span
                        className={`inline-block border px-2 py-0.5 font-mono text-[10px] uppercase ${
                          bounty.status === "Testing"
                            ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                            : "border-amber-500/30 bg-amber-950/20 text-amber-400"
                        }`}
                      >
                        {bounty.status === "Testing" ? "ACTIVE AUDIT" : "IN REVIEW"}
                      </span>
                    </div>

                    <div>
                      <Link
                        href={`/research-arena?challenge=${bounty.id}`}
                        className="inline-flex items-center gap-1.5 rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-1.5 font-mono text-xs text-zinc-200 transition hover:border-[#E09F3E] hover:text-white"
                      >
                        <span>Challenge Specimen</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
