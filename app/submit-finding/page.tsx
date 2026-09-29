"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { Severity } from "@/lib/data";
import { bounties as initialStaticBounties } from "@/lib/data";
import { addSubmission } from "@/lib/store";
import { fetchBounties, submitFinding, type BackendBounty } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function SubmitFindingPage() {
  const [bountyList, setBountyList] = useState(initialStaticBounties);
  const [selectedBountyId, setSelectedBountyId] = useState("fraud-detect-v1");

  const [finding, setFinding] = useState(
    "Fraudulent transaction missed under unusual amount pattern"
  );

  const [severity, setSeverity] = useState<Severity>("High");

  const [whatHappened, setWhatHappened] = useState(
    "The FraudDetect V1 model classified a transaction as legitimate even though the transaction contained an unusually high amount pattern that should have triggered fraud detection. The model failed to identify the transaction as potentially fraudulent."
  );

  const [evidence, setEvidence] = useState(
    "A test transaction with an unusually high transaction amount was provided to the model. The model returned a legitimate classification even though the input matched the challenge conditions for an unusual amount pattern. Repeated testing with the same input produced the same incorrect classification."
  );

  const [reproductionSteps, setReproductionSteps] = useState(
    "1. Prepare a transaction containing an unusually high transaction amount.\n2. Submit the transaction to FraudDetect V1.\n3. Record the model prediction.\n4. Observe that the model classifies the transaction as legitimate.\n5. Compare the prediction with the expected fraud-detection behaviour.\n6. Repeat the test to confirm that the behaviour is reproducible."
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchBounties().then((data: BackendBounty[]) => {
      if (isMounted && data && data.length > 0) {
        const mapped = data.map((b) => ({
          id: b.id,
          model: b.title || b.model_name,
          category: b.category,
          description: b.description,
          tests: b.finding_count ? b.finding_count * 4 : 20,
          findings: b.finding_count || 0,
          reward: b.reward,
          status: (b.status === "ACTIVE" ? "Testing" : b.status === "PAUSED" ? "Review" : "Closed") as "Testing" | "Review" | "Closed",
          expectedBehaviour: b.expected_behavior || "Expected normal model behavior",
          testingRequirements: b.testing_requirements ? b.testing_requirements.split("\n") : [],
        }));
        setBountyList(mapped);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedBounty =
    bountyList.find((bounty) => bounty.id === selectedBountyId) ??
    bountyList[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!finding.trim()) {
      setErrorMessage("Please enter a finding title.");
      return;
    }

    if (!whatHappened.trim()) {
      setErrorMessage("Please describe what happened.");
      return;
    }

    if (!evidence.trim()) {
      setErrorMessage("Please provide evidence.");
      return;
    }

    if (!reproductionSteps.trim()) {
      setErrorMessage("Please provide reproduction steps.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const createdFinding = await submitFinding({
        bounty_id: selectedBounty.id,
        researcher_id: "user-researcher",
        finding_title: finding.trim(),
        severity: severity.toUpperCase(),
        what_happened: whatHappened.trim(),
        evidence: evidence.trim(),
        reproduction_steps: reproductionSteps.trim(),
        expected_behavior: selectedBounty.expectedBehaviour,
        actual_behavior: whatHappened.trim(),
        reward: selectedBounty.reward,
      });

      const newSubmission = {
        id: createdFinding.id || `submission-${Date.now().toString().slice(-4)}`,
        bountyId: selectedBounty.id,
        model: selectedBounty.model,
        finding: finding.trim(),
        title: finding.trim(),
        description: whatHappened.trim(),
        evidence: evidence.trim(),
        reproduction: reproductionSteps.trim(),
        category: selectedBounty.category,
        severity,
        status: "Pending" as const,
        reward: selectedBounty.reward,
        researcher: "0x7A...91F2",
        submitted: "Just now",
      };

      addSubmission(newSubmission);
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to submit finding to backend. Please check network.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Navbar title="Submit Finding" />

          <div className="mx-auto max-w-4xl p-6 lg:p-8">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Researcher Workspace
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Submit Independent Finding
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Document reproducible model misclassification or boundary failure to submit to the validation pool.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xl font-bold">
                  ✓
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">
                  Finding Successfully Submitted
                </h3>
                <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
                  Your finding has been registered under status{" "}
                  <span className="text-yellow-400 font-semibold">Pending Validation</span>. Validators will review the execution trace against expected specifications.
                </p>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <Link
                    href="/my-submissions"
                    className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#061014] hover:bg-cyan-200 transition"
                  >
                    View My Submissions →
                  </Link>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFinding("");
                      setWhatHappened("");
                      setEvidence("");
                      setReproductionSteps("");
                    }}
                    className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 hover:text-white transition"
                  >
                    Submit Another Finding
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-2xl border border-white/[0.06] bg-[#090c11] p-6 lg:p-8"
              >
                {errorMessage && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
                    {errorMessage}
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                      Target Bounty Model
                    </label>
                    <select
                      value={selectedBountyId}
                      onChange={(e) => setSelectedBountyId(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0d1219] px-4 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                    >
                      {bountyList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.model} ({b.reward})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                      Severity Tier
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as Severity)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0d1219] px-4 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                    Finding Title
                  </label>
                  <input
                    type="text"
                    required
                    value={finding}
                    onChange={(e) => setFinding(e.target.value)}
                    placeholder="Short summary of the bug or misclassification"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                    What Happened (Observed Behavior)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={whatHappened}
                    onChange={(e) => setWhatHappened(e.target.value)}
                    placeholder="Describe how the model performed versus its expected behavior..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                    Evidence & Payload
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Input vectors, API payload parameters, and returned outputs..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                    Reproduction Steps
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reproductionSteps}
                    onChange={(e) => setReproductionSteps(e.target.value)}
                    placeholder="Deterministic steps for a validator to reproduce this result..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-6">
                  <Link
                    href="/research-arena"
                    className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-cyan-300 px-5 py-2.5 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Finding to Validators →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
