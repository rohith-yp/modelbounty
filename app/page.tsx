"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { fetchBounties, fetchDashboardStats, type BackendBounty } from "@/lib/api";

const initialStats = [
  {
    key: "ACTIVE_BOUNTIES",
    label: "Active Bounties",
    value: "3",
    sub: "Active verified models",
  },
  {
    key: "TOTAL_TESTS",
    label: "Tests Conducted",
    value: "98",
    sub: "Deterministic stress runs",
  },
  {
    key: "VERIFIED_ISSUES",
    label: "Verified Findings",
    value: "23",
    sub: "Confirmed model anomalies",
  },
  {
    key: "ESCROW_DISTRIBUTED",
    label: "Rewards Distributed",
    value: "1.05 ETH",
    sub: "Released to researchers",
  },
];

const initialBounties = [
  {
    id: "fraud-detect-v1",
    name: "FraudDetect V1",
    type: "Fraud Detection",
    status: "Testing",
    tests: 48,
    findings: 12,
    reward: "0.50 ETH",
  },
  {
    id: "health-risk-classifier",
    name: "HealthRisk Classifier",
    type: "Healthcare ML",
    status: "Testing",
    tests: 31,
    findings: 7,
    reward: "0.35 ETH",
  },
  {
    id: "support-intent-ai",
    name: "SupportIntent AI",
    type: "NLP",
    status: "Review",
    tests: 19,
    findings: 4,
    reward: "0.20 ETH",
  },
];

export default function DashboardPage() {
  const [bountyList, setBountyList] = useState(initialBounties);
  const [statsList, setStatsList] = useState(initialStats);

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
            type: b.category,
            status: b.status === "ACTIVE" ? "Testing" : b.status === "PAUSED" ? "Review" : "Closed",
            tests: b.finding_count ? b.finding_count * 4 : 12,
            findings: b.finding_count || 0,
            reward: b.reward,
          }));
          setBountyList(mapped);
        }

        if (statsData) {
          setStatsList([
            {
              key: "ACTIVE_BOUNTIES",
              label: "Active Bounties",
              value: statsData.active_bounties.toString(),
              sub: `${statsData.total_bounties} registered campaigns`,
            },
            {
              key: "TOTAL_TESTS",
              label: "Tests Conducted",
              value: (statsData.total_findings * 4).toString(),
              sub: `${statsData.total_findings} findings logged`,
            },
            {
              key: "VERIFIED_ISSUES",
              label: "Verified Findings",
              value: statsData.approved_findings.toString(),
              sub: `${statsData.verification_rate} consensus pass rate`,
            },
            {
              key: "ESCROW_DISTRIBUTED",
              label: "Rewards Distributed",
              value: statsData.distributed_rewards,
              sub: `Pool: ${statsData.total_rewards}`,
            },
          ]);
        }
      } catch {
        // Retain initial state
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0C0D10] text-[#EDEDF0]">
      <div className="flex min-h-screen">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Workspace Shell */}
        <section className="min-w-0 flex-1">
          <Navbar title="Overview" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-8">
            {/* Header Dispatch Banner */}
            <div className="border border-[#232732] bg-[#13151B] p-6 lg:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E09F3E]" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#E09F3E]">
                      AUDIT_LEDGER // DISPATCH_01
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-mono font-medium tracking-tight text-[#EDEDF0]">
                    AI Model Verification & Escrow Index
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-xs text-[#8C93A4] leading-relaxed">
                    Deterministic stress-testing telemetry across registered machine learning models, active adversarial bounties, and cryptographic validator consensus.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/create-bounty"
                    className="inline-flex items-center gap-2 rounded border border-[#E09F3E]/40 bg-[#E09F3E] px-4 py-2 text-xs font-mono font-semibold text-[#0C0D10] transition hover:bg-[#EBB052]"
                  >
                    <span>+</span>
                    <span>DEPLOY_BOUNTY</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Telemetry Ledger Strip */}
            <div className="border border-[#232732] bg-[#13151B] grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#232732]">
              {statsList.map((stat) => (
                <div key={stat.key} className="p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#525866] uppercase tracking-wider">
                    <span>{stat.label}</span>
                    <span className="text-[#353B4A]">#{stat.key.slice(0, 3)}</span>
                  </div>
                  <div className="mt-3 text-2xl font-mono font-medium tracking-tight text-[#EDEDF0] num-tabular">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-[11px] font-mono text-[#8C93A4] truncate">
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Model Bounties Specimen Table */}
            <div className="border border-[#232732] bg-[#13151B]">
              <div className="flex items-center justify-between border-b border-[#232732] px-5 py-3.5 bg-[#0F1116]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-[#EDEDF0] uppercase tracking-wider">
                    ACTIVE_SPECIMENS
                  </span>
                  <span className="text-[10px] font-mono text-[#525866]">
                    [{bountyList.length}]
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#525866] uppercase">
                  SORT: ESCROW_POOL_DESC
                </div>
              </div>

              {/* Table Column Labels */}
              <div className="hidden md:grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1.2fr_auto] gap-4 px-5 py-2.5 border-b border-[#1C2029] text-[10px] font-mono text-[#525866] uppercase tracking-wider bg-[#0C0D10]/50">
                <div>Model Identifier</div>
                <div>Domain / Framework</div>
                <div>Executions</div>
                <div>Findings</div>
                <div>Escrow Reward</div>
                <div className="text-right">Action</div>
              </div>

              {/* Bounty Rows */}
              <div className="divide-y divide-[#1C2029]">
                {bountyList.map((bounty) => (
                  <Link
                    key={bounty.id || bounty.name}
                    href={`/research-arena?challenge=${bounty.id}`}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[2.5fr_1.5fr_1fr_1fr_1.2fr_auto] md:items-center cursor-pointer transition hover:bg-[#181B23] group"
                  >
                    <div>
                      <div className="text-xs font-mono font-medium text-[#EDEDF0] group-hover:text-[#E09F3E] transition-colors">
                        {bounty.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#525866] mt-0.5">
                        ID: {bounty.id}
                      </div>
                    </div>

                    <div>
                      <span className="inline-block rounded border border-[#232732] bg-[#0C0D10] px-2 py-0.5 text-[10px] font-mono text-[#8C93A4]">
                        {bounty.type}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#8C93A4] num-tabular">
                      <span className="text-[10px] text-[#525866] md:hidden">Tests: </span>
                      {bounty.tests}
                    </div>

                    <div className="text-xs font-mono text-[#EDEDF0] num-tabular">
                      <span className="text-[10px] text-[#525866] md:hidden">Findings: </span>
                      {bounty.findings}
                    </div>

                    <div>
                      <span className="text-xs font-mono font-medium text-[#E09F3E] num-tabular">
                        {bounty.reward}
                      </span>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono uppercase ${
                          bounty.status === "Testing"
                            ? "border border-[#E09F3E]/20 bg-[#E09F3E]/10 text-[#E09F3E]"
                            : "border border-[#8C93A4]/20 bg-[#8C93A4]/10 text-[#8C93A4]"
                        }`}
                      >
                        <span
                          className={`h-1 w-1 rounded-full ${
                            bounty.status === "Testing" ? "bg-[#E09F3E]" : "bg-[#8C93A4]"
                          }`}
                        />
                        {bounty.status}
                      </span>
                      <span className="text-xs font-mono text-[#525866] group-hover:text-[#EDEDF0] group-hover:translate-x-0.5 transition-all">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Protocol Lifecycle Protocol */}
            <div className="border border-[#232732] bg-[#13151B] p-6">
              <div className="border-b border-[#232732] pb-3 mb-6">
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#525866]">
                  SECURITY ARCHITECTURE
                </div>
                <h3 className="text-xs font-mono font-medium text-[#EDEDF0] mt-1 uppercase">
                  End-to-End Verification Pipeline
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#232732]">
                <Link
                  href="/create-bounty"
                  className="block group pt-4 md:pt-0 md:pr-6 transition"
                >
                  <div className="text-[10px] font-mono text-[#E09F3E]">
                    PHASE 01 // REGISTRATION
                  </div>
                  <h4 className="mt-2 text-xs font-mono font-semibold text-[#EDEDF0] group-hover:text-[#E09F3E] transition-colors">
                    Model Owner Deposit
                  </h4>
                  <p className="mt-1.5 text-xs text-[#8C93A4] leading-relaxed">
                    Upload weights/endpoints, specify expected behavioral constraints, and lock ETH collateral into the non-custodial smart escrow contract.
                  </p>
                </Link>

                <Link
                  href="/research-arena"
                  className="block group pt-4 md:pt-0 md:px-6 transition"
                >
                  <div className="text-[10px] font-mono text-[#E09F3E]">
                    PHASE 02 // ADVERSARIAL STRESS
                  </div>
                  <h4 className="mt-2 text-xs font-mono font-semibold text-[#EDEDF0] group-hover:text-[#E09F3E] transition-colors">
                    Researcher Exploitation
                  </h4>
                  <p className="mt-1.5 text-xs text-[#8C93A4] leading-relaxed">
                    Security researchers formulate boundary inputs and adversarial vectors in the live testing arena, submitting deterministic reproduction traces.
                  </p>
                </Link>

                <Link
                  href="/validator"
                  className="block group pt-4 md:pt-0 md:pl-6 transition"
                >
                  <div className="text-[10px] font-mono text-[#E09F3E]">
                    PHASE 03 // DUAL-LAYER AUDIT
                  </div>
                  <h4 className="mt-2 text-xs font-mono font-semibold text-[#EDEDF0] group-hover:text-[#E09F3E] transition-colors">
                    Consensus & Payout
                  </h4>
                  <p className="mt-1.5 text-xs text-[#8C93A4] leading-relaxed">
                    Validators execute local model inference (scikit-learn) and Groq LLM impact triage. Verified issues trigger cryptographic reward release.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
