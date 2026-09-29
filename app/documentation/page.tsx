"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

const sections = [
  { id: "overview", title: "1. ModelBounty Overview" },
  { id: "owner-workflow", title: "2. Model Owner Workflow" },
  { id: "researcher-workflow", title: "3. Researcher Workflow" },
  { id: "validator-workflow", title: "4. Validator Workflow" },
  { id: "lifecycle", title: "5. Bounty Lifecycle" },
  { id: "submission", title: "6. Finding Submission" },
  { id: "validation", title: "7. Finding Validation" },
  { id: "reward-flow", title: "8. Reward Flow" },
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <section className="min-w-0 flex-1">
          <Navbar title="Documentation" />

          <div className="mx-auto max-w-4xl p-6 lg:p-10 space-y-10">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Documentation & Architecture
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                ModelBounty Verification Protocol
              </h1>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                ModelBounty is a decentralized AI evaluation and red-teaming network.
                Model owners post bounties, independent security and ML researchers stress-test
                models for edge cases and failures, and peer validators verify reproducibility.
              </p>
            </div>

            {/* Table of contents quick jumps */}
            <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={() => setActiveSection(s.id)}
                    className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5 text-xs text-zinc-400 hover:text-cyan-300 hover:border-cyan-400/30 transition block"
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </div>

            {/* 1. Overview */}
            <section id="overview" className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-cyan-300 font-mono text-sm">01</span>
                ModelBounty Overview
              </h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  As machine learning models become critical infrastructure in financial fraud detection,
                  healthcare risk stratification, and automated reasoning, traditional unit testing is
                  insufficient. Adversarial edge cases and distributional shifts often pass standard benchmarks.
                </p>
                <p>
                  ModelBounty provides an open, incentive-aligned platform where model owners define
                  evaluation boundaries and lock bounty rewards. Independent researchers probe the models
                  for failures, while an independent validator network inspects submitted evidence before rewards unlock.
                </p>
              </div>
            </section>

            {/* 2. Model Owner Workflow */}
            <section id="owner-workflow" className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-cyan-300 font-mono text-sm">02</span>
                Model Owner Workflow
              </h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  1. <strong className="text-zinc-200">Publish Bounty:</strong> The model owner specifies the model name, category,
                  expected behavioral invariant, and testing scope at <code>/create-bounty</code>.
                </p>
                <p>
                  2. <strong className="text-zinc-200">Fund Bounty Pool:</strong> The owner specifies reward amounts (e.g. 0.50 ETH)
                  allocated for verified high-impact findings.
                </p>
                <p>
                  3. <strong className="text-zinc-200">Monitor Tests:</strong> The owner tracks incoming tests, submitted findings,
                  and validation outcomes from the unified Overview and My Bounties dashboards.
                </p>
              </div>
            </section>

            {/* 3. Researcher Workflow */}
            <section id="researcher-workflow" className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-cyan-300 font-mono text-sm">03</span>
                Researcher Workflow
              </h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  1. <strong className="text-zinc-200">Explore Challenges:</strong> Browse published models in the Research Arena (<code>/research-arena</code>) by
                  category (Fraud Detection, Healthcare ML, NLP) or search keywords.
                </p>
                <p>
                  2. <strong className="text-zinc-200">Stress Test:</strong> Review the model&apos;s expected behaviour and probe
                  with boundary inputs, subtle perturbation patterns, or adversarial payloads.
                </p>
                <p>
                  3. <strong className="text-zinc-200">Submit Finding:</strong> Document the unexpected classification,
                  evidence trace, and step-by-step reproduction instructions.
                </p>
              </div>
            </section>

            {/* 4. Validator Workflow */}
            <section id="validator-workflow" className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-cyan-300 font-mono text-sm">04</span>
                Validator Workflow
              </h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  1. <strong className="text-zinc-200">Inspect Queue:</strong> Validators monitor the &ldquo;Findings Awaiting Validation&rdquo; queue in the Validator portal (<code>/validator</code>).
                </p>
                <p>
                  2. <strong className="text-zinc-200">Review Evidence:</strong> Open the Finding Review modal to inspect the researcher&apos;s
                  reported failure, input data, and reproduction steps.
                </p>
                <p>
                  3. <strong className="text-zinc-200">Attestation:</strong> The validator executes the reproduction steps against the model.
                  If the failure is reproducible and violates the stated policy, the finding is approved; otherwise, it is rejected.
                </p>
              </div>
            </section>

            {/* 5. Bounty Lifecycle */}
            <section id="lifecycle" className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-cyan-300 font-mono text-sm">05</span>
                Bounty Lifecycle
              </h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  • <strong className="text-cyan-300">Testing:</strong> The bounty is active and accepting test submissions from all registered researchers.
                </p>
                <p>
                  • <strong className="text-yellow-300">Review:</strong> Active testing has completed or high-severity findings are being validated.
                </p>
                <p>
                  • <strong className="text-zinc-400">Closed:</strong> All findings have been audited and rewards distributed.
                </p>
              </div>
            </section>

            {/* 6. Finding Submission */}
            <section id="submission" className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-cyan-300 font-mono text-sm">06</span>
                Finding Submission
              </h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  Findings can be submitted directly from the Research Arena challenge modal or the dedicated submission workflow. Each submission requires:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  <li>Selected model challenge</li>
                  <li>Finding title & summary</li>
                  <li>Severity tier (Low, Medium, High, Critical)</li>
                  <li>Observed vs expected outcome</li>
                  <li>Evidence payload / log trace</li>
                  <li>Deterministic reproduction steps</li>
                </ul>
              </div>
            </section>

            {/* 7. Finding Validation */}
            <section id="validation" className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-cyan-300 font-mono text-sm">07</span>
                Finding Validation
              </h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  The validation process protects model owners from spam while ensuring researchers receive fair bounties.
                  Only submissions marked <code>Pending</code> are present in the validation queue.
                  Once verified, the finding moves to <code>Approved</code> or <code>Rejected</code>, which updates all validator and researcher counters in real time.
                </p>
              </div>
            </section>

            {/* 8. Reward Flow */}
            <section id="reward-flow" className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-cyan-300 font-mono text-sm">08</span>
                Reward Flow
              </h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  When a finding is approved by validators, the designated bounty reward (e.g. 0.50 ETH) is credited
                  to the researcher&apos;s address. In demo mode, this is simulated through reactive local state.
                  Upon Web3 integration, rewards will be distributed trustlessly via smart contract escrow.
                </p>
              </div>
            </section>

            {/* CTA */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#090c11] p-6">
              <div>
                <div className="text-sm font-medium text-white">
                  Ready to explore ModelBounty?
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Start testing challenges in the Research Arena or review findings as a Validator.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/research-arena"
                  className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
                >
                  Research Arena
                </Link>
                <Link
                  href="/validator"
                  className="rounded-lg border border-cyan-300/30 bg-cyan-300/5 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-300/10"
                >
                  Open Validator
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
