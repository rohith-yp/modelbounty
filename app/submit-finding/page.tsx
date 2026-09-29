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
    <main className="min-h-screen bg-[#0C0D10] text-[#EDEDF0]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Navbar title="Submit Specimen" />

          <div className="mx-auto max-w-4xl p-6 lg:p-8">
            {/* Header Telemetry */}
            <div className="border-b border-[#232732] pb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase">
                  01 // RESEARCHER WORKSPACE // SPECIMEN INGESTION
                </span>
                <span className="inline-block h-1 w-1 rounded-full bg-[#E09F3E]" />
                <span className="font-mono text-[10px] text-zinc-500 uppercase">
                  EVIDENCE ATTESTATION
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Submit Model Vulnerability Specimen
              </h1>

              <p className="mt-1 text-xs text-zinc-400">
                Document reproducible model misclassification or boundary failure to register in the consensus validation pool for peer attestation and escrow release.
              </p>
            </div>

            {submitted ? (
              <div className="mt-8 border border-emerald-500/30 bg-[#13151B] p-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-emerald-500/40 bg-emerald-500/10 font-mono text-emerald-400 text-lg font-bold">
                  ✓
                </div>
                <h2 className="mt-4 text-base font-semibold text-white">
                  Finding Specimen Successfully Registered
                </h2>
                <p className="mt-2 text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  Your finding has been persisted to the consensus ledger under status{" "}
                  <span className="text-[#E09F3E] font-mono font-semibold">PENDING_VALIDATION</span>. Consensus validators will execute inference against the target specification.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3 font-mono text-xs">
                  <Link
                    href="/my-submissions"
                    className="rounded border border-[#E09F3E] bg-[#E09F3E] px-4 py-2 font-semibold text-black hover:bg-[#E09F3E]/90 transition"
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
                    className="rounded border border-[#232732] bg-[#0C0D10] px-4 py-2 text-zinc-300 hover:text-white transition"
                  >
                    Submit Another Specimen
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-6 border border-[#232732] bg-[#13151B] p-6 lg:p-8"
              >
                {errorMessage && (
                  <div className="border border-red-500/30 bg-red-950/20 p-4 font-mono text-xs text-red-300">
                    ERROR: {errorMessage}
                  </div>
                )}

                {/* Section 02: Model & Severity Parameters */}
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase block mb-3">
                    02 // TARGET & SEVERITY PARAMETERS
                  </span>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                        Target Bounty Model
                      </label>
                      <select
                        value={selectedBountyId}
                        onChange={(e) => setSelectedBountyId(e.target.value)}
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2.5 font-mono text-xs text-zinc-200 focus:border-[#E09F3E] focus:outline-none"
                      >
                        {bountyList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.model} — Reward: {b.reward}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                        Severity Tier
                      </label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as Severity)}
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2.5 font-mono text-xs text-zinc-200 focus:border-[#E09F3E] focus:outline-none"
                      >
                        <option value="Low">Low — Minor heuristic drift</option>
                        <option value="Medium">Medium — Reproducible misclassification</option>
                        <option value="High">High — Threshold evasion / false negative</option>
                        <option value="Critical">Critical — Complete pipeline compromise</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 03: Specimen Observation */}
                <div className="border-t border-[#232732] pt-6">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase block mb-3">
                    03 // SPECIMEN TITLE & OBSERVATION
                  </span>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                        Finding Title
                      </label>
                      <input
                        type="text"
                        required
                        value={finding}
                        onChange={(e) => setFinding(e.target.value)}
                        placeholder="Short summary of the bug or misclassification"
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-[#E09F3E] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                        What Happened (Observed Behavior vs Specification)
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={whatHappened}
                        onChange={(e) => setWhatHappened(e.target.value)}
                        placeholder="Describe how the model performed versus its expected behavior..."
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-[#E09F3E] focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 04: Evidence & Reproduction */}
                <div className="border-t border-[#232732] pt-6">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase block mb-3">
                    04 // EVIDENCE VECTOR & REPRODUCTION PROTOCOL
                  </span>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                        Evidence Vector & Payload Parameters
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={evidence}
                        onChange={(e) => setEvidence(e.target.value)}
                        placeholder="Input vectors, API payload parameters, and returned outputs..."
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] p-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-[#E09F3E] focus:outline-none font-mono leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                        Deterministic Reproduction Steps
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={reproductionSteps}
                        onChange={(e) => setReproductionSteps(e.target.value)}
                        placeholder="Deterministic steps for a validator to reproduce this result..."
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] p-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-[#E09F3E] focus:outline-none font-mono leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between border-t border-[#232732] pt-6">
                  <Link
                    href="/research-arena"
                    className="rounded border border-[#232732] bg-[#0C0D10] px-4 py-2 font-mono text-xs text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded border border-[#E09F3E] bg-[#E09F3E] px-5 py-2.5 font-mono text-xs font-semibold text-black transition hover:bg-[#E09F3E]/90 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "TRANSMITTING TO LEDGER..." : "SUBMIT SPECIMEN TO VALIDATORS"}</span>
                    <span>→</span>
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
