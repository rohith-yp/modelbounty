"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface Hackathon {
  id: string;
  title: string;
  category: string;
  status: "Active" | "Upcoming" | "Completed";
  prizePool: string;
  deadline: string;
  teams: number;
  description: string;
  rules: string[];
}

const hackathons: Hackathon[] = [
  {
    id: "hackathon-1",
    title: "Adversarial Prompting Sprint",
    category: "NLP & Alignment",
    status: "Active",
    prizePool: "2.50 ETH",
    deadline: "3 days remaining",
    teams: 42,
    description:
      "Stress-test conversational and intent classification models against adversarial prompt injections, jailbreaks, and ambiguous phrasing.",
    rules: [
      "Target model: SupportIntent AI and associated NLP endpoints.",
      "Inputs must trigger misclassification or policy circumvention.",
      "Submit detailed reproducible prompt chains.",
      "All findings subject to independent validator review.",
    ],
  },
  {
    id: "hackathon-2",
    title: "Financial Edge-Case Blitz",
    category: "Fraud Detection",
    status: "Active",
    prizePool: "3.00 ETH",
    deadline: "5 days remaining",
    teams: 68,
    description:
      "Discover adversarial transaction amount patterns, temporal anomalies, and structured payloads that bypass financial fraud detection systems.",
    rules: [
      "Target model: FraudDetect V1.",
      "Focus on boundary amounts and deceptive feature combinations.",
      "Provide step-by-step transaction recreation payloads.",
      "Bounties distributed according to severity tier.",
    ],
  },
  {
    id: "hackathon-3",
    title: "Healthcare Boundary Challenge",
    category: "Healthcare ML",
    status: "Active",
    prizePool: "1.80 ETH",
    deadline: "24 hours remaining",
    teams: 29,
    description:
      "Identify anomalous classification boundary flips in high-stakes clinical risk estimation models when slight feature perturbations occur.",
    rules: [
      "Target model: HealthRisk Classifier.",
      "Perturbations must be mathematically minimal yet induce decision changes.",
      "Provide evidence graphs or feature delta matrices.",
      "Validators independently attest reproducibility.",
    ],
  },
];

export default function HackathonPage() {
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(
    null
  );
  const [joinedHackathons, setJoinedHackathons] = useState<Record<string, boolean>>({});

  function handleJoin(id: string) {
    setJoinedHackathons((prev) => ({
      ...prev,
      [id]: true,
    }));
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <section className="min-w-0 flex-1">
          <Navbar title="Hackathon Arena" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            {/* Heading */}
            <div className="mb-8">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Time-Limited Sprints
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Model Red-Teaming Hackathons
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Join live competitive model-breaking challenges. Researchers collaborate to stress-test specific model classes under strict sprint rules.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-600">Active Hackathons</div>
                <div className="mt-3 text-2xl font-semibold">3</div>
                <div className="mt-2 text-[11px] text-cyan-300/70">
                  Live competition
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-600">Total Prize Pool</div>
                <div className="mt-3 text-2xl font-semibold text-cyan-300">
                  7.30 ETH
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  Guaranteed rewards
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-600">Active Teams</div>
                <div className="mt-3 text-2xl font-semibold">139</div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  Researchers participating
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-600">Validated Bugs</div>
                <div className="mt-3 text-2xl font-semibold">24</div>
                <div className="mt-2 text-[11px] text-emerald-400">
                  Attested by validators
                </div>
              </div>
            </div>

            {/* Hackathon Cards */}
            <div className="space-y-4">
              {hackathons.map((h) => {
                const isJoined = joinedHackathons[h.id];
                return (
                  <div
                    key={h.id}
                    className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6 transition hover:border-white/10"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-xs text-cyan-300">
                            {h.category}
                          </span>
                          <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs text-emerald-400">
                            {h.status}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            {h.deadline}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-white">
                          {h.title}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-400 max-w-3xl">
                          {h.description}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-zinc-500">
                          <div>
                            <span className="text-zinc-600 uppercase">Prize: </span>
                            <span className="font-semibold text-cyan-300">
                              {h.prizePool}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-600 uppercase">Teams: </span>
                            <span className="font-semibold text-zinc-300">
                              {h.teams + (isJoined ? 1 : 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedHackathon(h)}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          View Sprint
                        </button>

                        <button
                          onClick={() => handleJoin(h.id)}
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                            isJoined
                              ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/30"
                              : "bg-cyan-300 text-[#061014] hover:bg-cyan-200"
                          }`}
                        >
                          {isJoined ? "Registered ✓" : "Join Hackathon"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Modal */}
      {selectedHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#090d13] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs text-cyan-300">
                    {selectedHackathon.category}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {selectedHackathon.deadline}
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {selectedHackathon.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedHackathon(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Sprint Overview
                </div>
                <p className="mt-1 text-sm text-zinc-300 leading-relaxed">
                  {selectedHackathon.description}
                </p>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Rules & Evaluation
                </div>
                <ul className="mt-2 space-y-2">
                  {selectedHackathon.rules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-zinc-400"
                    >
                      <span className="text-cyan-400 font-mono">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#070a0e] p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500">Prize Pool</div>
                  <div className="text-lg font-bold text-cyan-300">
                    {selectedHackathon.prizePool}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Registered Teams</div>
                  <div className="text-lg font-bold text-white">
                    {selectedHackathon.teams +
                      (joinedHackathons[selectedHackathon.id] ? 1 : 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
              <button
                onClick={() => setSelectedHackathon(null)}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>

              <button
                onClick={() => {
                  handleJoin(selectedHackathon.id);
                  setSelectedHackathon(null);
                }}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  joinedHackathons[selectedHackathon.id]
                    ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/30"
                    : "bg-cyan-300 text-[#061014] hover:bg-cyan-200"
                }`}
              >
                {joinedHackathons[selectedHackathon.id]
                  ? "Already Registered ✓"
                  : "Join Hackathon Sprint"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
