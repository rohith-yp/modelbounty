"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { bounties, type Bounty, type Severity, type Submission } from "@/lib/data";
import { addSubmission } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

function ResearchArenaContent() {
  const searchParams = useSearchParams();
  const challengeQuery = searchParams.get("challenge");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);

  // Finding form state inside modal
  const [findingTitle, setFindingTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("High");
  const [whatHappened, setWhatHappened] = useState("");
  const [evidence, setEvidence] = useState("");
  const [reproductionSteps, setReproductionSteps] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const categories = ["All", "Fraud Detection", "Healthcare ML", "NLP"];

  useEffect(() => {
    if (challengeQuery) {
      const found = bounties.find(
        (b) =>
          b.id === challengeQuery ||
          b.model.toLowerCase().replace(/\s+/g, "-") ===
            challengeQuery.toLowerCase()
      );
      if (found) {
        setSelectedBounty(found);
      }
    }
  }, [challengeQuery]);

  const filteredBounties = bounties.filter((b) => {
    const matchesSearch =
      b.model.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === "All" || b.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  function openChallengeModal(bounty: Bounty) {
    setSelectedBounty(bounty);
    setFindingTitle("");
    setSeverity("High");
    setWhatHappened("");
    setEvidence("");
    setReproductionSteps("");
    setSubmittedSuccess(false);
    setFormError("");
  }

  function handleFindingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBounty) return;

    if (!findingTitle.trim()) {
      setFormError("Please enter a finding title.");
      return;
    }
    if (!whatHappened.trim()) {
      setFormError("Please explain what happened.");
      return;
    }
    if (!evidence.trim()) {
      setFormError("Please provide supporting evidence or payload data.");
      return;
    }
    if (!reproductionSteps.trim()) {
      setFormError("Please detail the reproduction steps.");
      return;
    }

    const newSubmission: Submission = {
      id: `submission-${Date.now().toString().slice(-4)}`,
      bountyId: selectedBounty.id,
      model: selectedBounty.model,
      finding: findingTitle.trim(),
      title: findingTitle.trim(),
      description: whatHappened.trim(),
      evidence: evidence.trim(),
      reproduction: reproductionSteps.trim(),
      category: selectedBounty.category,
      severity,
      status: "Pending",
      reward: selectedBounty.reward,
      researcher: "0x7A...91F2",
      submitted: "Just now",
    };

    addSubmission(newSubmission);
    setSubmittedSuccess(true);
    setFormError("");
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Navbar title="Research Arena" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Independent Verification
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Research Arena
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  Select an AI model, craft adversarial test payloads, and expose boundary anomalies to claim bounty rewards.
                </p>
              </div>

              <Link
                href="/my-submissions"
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2.5 text-xs text-zinc-300 hover:border-white/15 hover:text-white transition self-start sm:self-auto"
              >
                View My Submissions →
              </Link>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs transition ${
                      selectedCategory === cat
                        ? "bg-cyan-300 text-[#061014] font-semibold"
                        : "border border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search challenges..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="flex flex-col rounded-2xl border border-white/[0.06] bg-[#090c11] p-6 transition hover:border-cyan-300/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-zinc-400 border border-white/[0.08]">
                      {bounty.category}
                    </span>
                    <span className="text-xs font-semibold text-cyan-300">
                      {bounty.reward}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-white">
                    {bounty.model}
                  </h3>

                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed flex-1">
                    {bounty.description}
                  </p>

                  <div className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-[11px] text-zinc-400">
                    <div className="font-semibold text-zinc-300 mb-1">
                      Expected Behavior:
                    </div>
                    {bounty.expectedBehaviour}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-zinc-500">
                    <span>{bounty.tests} tests executed</span>
                    <span>{bounty.findings} verified</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => openChallengeModal(bounty)}
                      className="w-full rounded-lg bg-cyan-300 py-2 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
                    >
                      Challenge Model →
                    </button>
                    <Link
                      href={`/bounties/${bounty.id}`}
                      className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-400 hover:text-white transition"
                    >
                      Spec
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Challenge / Submit Finding Modal */}
      {selectedBounty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#090d13] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">
                  Submit Verification Finding
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedBounty.model} ({selectedBounty.category})
                </h3>
              </div>
              <button
                onClick={() => setSelectedBounty(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {submittedSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xl font-bold">
                  ✓
                </div>
                <h4 className="mt-4 text-lg font-bold text-white">
                  Finding Submitted to Validator Queue
                </h4>
                <p className="mt-2 text-xs text-zinc-400 max-w-md mx-auto">
                  Your finding has been registered under status{" "}
                  <span className="text-yellow-400 font-semibold">Pending</span>. Validators will reproduce the bug trace and disburse the {selectedBounty.reward} reward upon confirmation.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Link
                    href="/my-submissions"
                    className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#061014] hover:bg-cyan-200 transition"
                  >
                    View in My Submissions →
                  </Link>
                  <button
                    onClick={() => setSelectedBounty(null)}
                    className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFindingSubmit} className="py-4 space-y-4">
                {formError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Finding Title
                  </label>
                  <input
                    type="text"
                    required
                    value={findingTitle}
                    onChange={(e) => setFindingTitle(e.target.value)}
                    placeholder="e.g. Model outputs erroneous confidence on boundary inputs"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Severity Tier
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Severity)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0d1219] px-3.5 py-2 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    What Happened (Failure Description)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={whatHappened}
                    onChange={(e) => setWhatHappened(e.target.value)}
                    placeholder="Describe how the model deviated from its documented expected behaviour..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Evidence & Payloads
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Paste the test payload, inputs, parameters, and observed outputs..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Reproduction Steps
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reproductionSteps}
                    onChange={(e) => setReproductionSteps(e.target.value)}
                    placeholder="1. Send payload to endpoint&#10;2. Observe return code or label&#10;3. Compare with benchmark specification"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedBounty(null)}
                    className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-cyan-300 px-5 py-2 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
                  >
                    Submit Finding →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function ResearchArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090d] text-white flex items-center justify-center text-xs text-zinc-500">
          Loading Research Arena...
        </div>
      }
    >
      <ResearchArenaContent />
    </Suspense>
  );
}

