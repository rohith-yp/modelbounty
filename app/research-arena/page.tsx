"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { bounties as staticBounties, type Bounty, type Severity, type Submission } from "@/lib/data";
import { addSubmission } from "@/lib/store";
import {
  fetchBounties,
  submitFinding,
  predictFraud,
  type BackendBounty,
  type FraudPredictionResult,
} from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

function ResearchArenaContent() {
  const searchParams = useSearchParams();
  const challengeQuery = searchParams.get("challenge");

  const [bountyList, setBountyList] = useState<Bounty[]>(staticBounties);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Live Playground State
  const [playgroundInput, setPlaygroundInput] = useState({
    amount: 98500.0,
    frequency_24h: 12,
    account_age_days: 10,
    ip_risk_score: 0.92,
    device_risk_score: 0.88,
    new_ip: 1,
    international: 1,
  });
  const [playgroundResult, setPlaygroundResult] = useState<FraudPredictionResult | null>(null);
  const [playgroundLatency, setPlaygroundLatency] = useState<number | null>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundError, setPlaygroundError] = useState("");

  const categories = [
    "All",
    "Fraud Detection",
    "Healthcare ML",
    "NLP",
    "Machine Learning",
    "Computer Vision",
  ];

  useEffect(() => {
    let isMounted = true;
    fetchBounties()
      .then((data: BackendBounty[]) => {
        if (isMounted && data && data.length > 0) {
          const mapped: Bounty[] = data.map((b) => ({
            id: b.id,
            model: b.title || b.model_name,
            category: b.category,
            description: b.description,
            tests: b.finding_count ? b.finding_count * 4 : 20,
            findings: b.finding_count || 0,
            reward: b.reward,
            status: (b.status === "ACTIVE"
              ? "Testing"
              : b.status === "PAUSED"
              ? "Review"
              : "Closed") as "Testing" | "Review" | "Closed",
            expectedBehaviour:
              b.expected_behavior ||
              "Expected normal model output under benchmark test conditions",
            testingRequirements: b.testing_requirements
              ? b.testing_requirements.split("\n")
              : [],
          }));
          setBountyList(mapped);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (challengeQuery) {
      const found = bountyList.find(
        (b) =>
          b.id === challengeQuery ||
          b.model.toLowerCase().replace(/\s+/g, "-") ===
            challengeQuery.toLowerCase()
      );
      if (found) {
        setSelectedBounty(found);
      }
    }
  }, [challengeQuery, bountyList]);

  const filteredBounties = bountyList.filter((b) => {
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

  async function runPlaygroundInference() {
    setPlaygroundLoading(true);
    setPlaygroundError("");
    const startTime = performance.now();
    try {
      const res = await predictFraud(playgroundInput, "fraud-detect-v1");
      const elapsed = Math.round(performance.now() - startTime);
      setPlaygroundResult(res);
      setPlaygroundLatency(elapsed);
    } catch (err: unknown) {
      setPlaygroundError(
        err instanceof Error ? err.message : "Inference execution failed"
      );
    } finally {
      setPlaygroundLoading(false);
    }
  }

  function exportPlaygroundToModal(bounty: Bounty) {
    setSelectedBounty(bounty);
    setFindingTitle(`Fraud classification anomaly on amount ${playgroundInput.amount}`);
    setSeverity("High");
    const obs = playgroundResult
      ? `Model returned prediction '${playgroundResult.prediction}' with probability ${(
          playgroundResult.fraud_probability * 100
        ).toFixed(1)}% on an edge-case high-risk transaction.`
      : "Model produced abnormal confidence score on high-risk payload.";
    setWhatHappened(obs);
    setEvidence(JSON.stringify(playgroundInput, null, 2));
    setReproductionSteps(
      `1. Send payload with amount=${playgroundInput.amount}, freq=${playgroundInput.frequency_24h}, ip_risk=${playgroundInput.ip_risk_score}.\n2. Execute scikit-learn model inference.\n3. Compare returned fraud_probability with expected security threshold.`
    );
    setSubmittedSuccess(false);
    setFormError("");
  }

  async function handleFindingSubmit(e: React.FormEvent) {
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

    setIsSubmitting(true);
    setFormError("");

    try {
      const createdFinding = await submitFinding({
        bounty_id: selectedBounty.id,
        researcher_id: "user-researcher",
        finding_title: findingTitle.trim(),
        severity: severity.toUpperCase(),
        what_happened: whatHappened.trim(),
        evidence: evidence.trim(),
        reproduction_steps: reproductionSteps.trim(),
        expected_behavior: selectedBounty.expectedBehaviour,
        actual_behavior: whatHappened.trim(),
        reward: selectedBounty.reward,
      });

      const newSubmission: Submission = {
        id: createdFinding.id || `submission-${Date.now().toString().slice(-4)}`,
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
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to record finding to backend.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0C0D10] text-[#EDEDF0]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Navbar title="Research Arena" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-8">
            {/* Header / Dispatch Info */}
            <div className="border border-[#232732] bg-[#13151B] p-6 lg:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E09F3E]" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#E09F3E]">
                      TARGET_INDEX // LIVE_AUDIT_ARENA
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-mono font-medium tracking-tight text-[#EDEDF0]">
                    Adversarial Testing Ground
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-xs text-[#8C93A4] leading-relaxed">
                    Select an active machine learning target, formulate boundary payloads in the live testing workbench, and submit deterministic failure traces to claim escrow rewards.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/my-submissions"
                    className="inline-flex items-center gap-2 rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2 text-xs font-mono text-[#8C93A4] transition hover:border-[#3D4454] hover:text-[#EDEDF0]"
                  >
                    <span>MY_SUBMISSIONS</span>
                    <span className="text-[#525866]">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Live Model Testing Workbench (Interactive Playground) */}
            <div className="border border-[#232732] bg-[#13151B]">
              <div className="flex flex-wrap items-center justify-between border-b border-[#232732] px-5 py-3 bg-[#0F1116] gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#38A169] animate-pulse" />
                  <span className="text-xs font-mono font-medium text-[#EDEDF0] uppercase tracking-wider">
                    LIVE_INFERENCE_PLAYGROUND
                  </span>
                  <span className="text-[10px] font-mono text-[#E09F3E] bg-[#E09F3E]/10 px-2 py-0.5 rounded border border-[#E09F3E]/20">
                    TARGET: FraudDetect V1 (scikit-learn)
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#525866]">
                  WEIGHTS: ml/models/fraud_model.joblib
                </div>
              </div>

              <div className="p-5 grid gap-6 lg:grid-cols-2">
                {/* Inputs Pane */}
                <div className="space-y-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#525866]">
                    Feature Vector Parameters
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-[#8C93A4] block mb-1">
                        AMOUNT ($)
                      </label>
                      <input
                        type="number"
                        value={playgroundInput.amount}
                        onChange={(e) =>
                          setPlaygroundInput((prev) => ({
                            ...prev,
                            amount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3 py-1.5 text-xs font-mono text-[#EDEDF0] focus:border-[#E09F3E] focus:outline-none num-tabular"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8C93A4] block mb-1">
                        FREQ_24H (TX COUNT)
                      </label>
                      <input
                        type="number"
                        value={playgroundInput.frequency_24h}
                        onChange={(e) =>
                          setPlaygroundInput((prev) => ({
                            ...prev,
                            frequency_24h: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3 py-1.5 text-xs font-mono text-[#EDEDF0] focus:border-[#E09F3E] focus:outline-none num-tabular"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8C93A4] block mb-1">
                        IP_RISK_SCORE (0.00-1.00)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={playgroundInput.ip_risk_score}
                        onChange={(e) =>
                          setPlaygroundInput((prev) => ({
                            ...prev,
                            ip_risk_score: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3 py-1.5 text-xs font-mono text-[#EDEDF0] focus:border-[#E09F3E] focus:outline-none num-tabular"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8C93A4] block mb-1">
                        DEVICE_RISK (0.00-1.00)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={playgroundInput.device_risk_score}
                        onChange={(e) =>
                          setPlaygroundInput((prev) => ({
                            ...prev,
                            device_risk_score: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3 py-1.5 text-xs font-mono text-[#EDEDF0] focus:border-[#E09F3E] focus:outline-none num-tabular"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={runPlaygroundInference}
                      disabled={playgroundLoading}
                      className="rounded border border-[#E09F3E]/40 bg-[#E09F3E] px-4 py-2 text-xs font-mono font-semibold text-[#0C0D10] transition hover:bg-[#EBB052] disabled:opacity-50"
                    >
                      {playgroundLoading ? "EXECUTING_INFERENCE..." : "RUN_LIVE_INFERENCE →"}
                    </button>
                    {playgroundResult && (
                      <button
                        onClick={() => {
                          const fraudBounty =
                            bountyList.find((b) => b.id === "fraud-detect-v1") ||
                            bountyList[0];
                          exportPlaygroundToModal(fraudBounty);
                        }}
                        className="rounded border border-[#232732] bg-[#0C0D10] px-3 py-2 text-xs font-mono text-[#E09F3E] hover:border-[#E09F3E]/40 transition"
                      >
                        EXPORT_TO_REPORT
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Output Telemetry */}
                <div className="rounded border border-[#1C2029] bg-[#0C0D10] p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#525866] uppercase">
                      <span>Inference Telemetry</span>
                      {playgroundLatency !== null && (
                        <span className="text-[#38A169] num-tabular">
                          LATENCY: {playgroundLatency}ms
                        </span>
                      )}
                    </div>

                    {playgroundError && (
                      <div className="mt-3 rounded border border-[#D9534F]/30 bg-[#D9534F]/10 p-2.5 text-xs font-mono text-[#D9534F]">
                        {playgroundError}
                      </div>
                    )}

                    {playgroundResult ? (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-baseline justify-between border-b border-[#1C2029] pb-3">
                          <span className="text-xs font-mono text-[#8C93A4]">Classification</span>
                          <span
                            className={`font-mono text-sm font-semibold px-2 py-0.5 rounded ${
                              playgroundResult.prediction === "FRAUD"
                                ? "bg-[#D9534F]/10 text-[#D9534F] border border-[#D9534F]/20"
                                : "bg-[#38A169]/10 text-[#38A169] border border-[#38A169]/20"
                            }`}
                          >
                            {playgroundResult.prediction}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between border-b border-[#1C2029] pb-3 text-xs font-mono">
                          <span className="text-[#8C93A4]">Fraud Probability</span>
                          <span className="text-[#EDEDF0] font-medium num-tabular">
                            {(playgroundResult.fraud_probability * 100).toFixed(2)}%
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between text-xs font-mono">
                          <span className="text-[#8C93A4]">Raw Signal Value</span>
                          <span className="text-[#525866] num-tabular">
                            {playgroundResult.prediction_value}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs font-mono text-[#525866]">
                        Trigger payload inference to inspect deterministic label, probability distribution, and execution latency.
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#1C2029] text-[9px] font-mono text-[#525866] flex justify-between">
                    <span>HOST: 127.0.0.1:8000 (INTERNAL)</span>
                    <span>FRAMEWORK: SCIKIT-LEARN</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded px-2.5 py-1 text-xs font-mono transition ${
                      selectedCategory === cat
                        ? "border border-[#E09F3E]/40 bg-[#E09F3E] text-[#0C0D10] font-semibold"
                        : "border border-[#232732] bg-[#13151B] text-[#8C93A4] hover:border-[#3D4454] hover:text-[#EDEDF0]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="SEARCH_TARGETS..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded border border-[#232732] bg-[#13151B] px-3 py-1.5 text-xs font-mono text-[#EDEDF0] placeholder-[#525866] focus:border-[#E09F3E] focus:outline-none"
                />
              </div>
            </div>

            {/* Targets Ledger Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="flex flex-col rounded border border-[#232732] bg-[#13151B] p-5 transition hover:border-[#3D4454] group"
                >
                  <div className="flex items-center justify-between border-b border-[#1C2029] pb-3">
                    <span className="rounded border border-[#232732] bg-[#0C0D10] px-2 py-0.5 text-[10px] font-mono text-[#8C93A4]">
                      {bounty.category}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#E09F3E] num-tabular">
                      {bounty.reward}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-mono font-medium text-[#EDEDF0] group-hover:text-[#E09F3E] transition-colors">
                    {bounty.model}
                  </h3>

                  <p className="mt-1.5 text-xs text-[#8C93A4] leading-relaxed flex-1">
                    {bounty.description}
                  </p>

                  <div className="mt-3 rounded border border-[#1C2029] bg-[#0C0D10] p-2.5 text-[11px] text-[#8C93A4]">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#525866] mb-1">
                      EXPECTED_BEHAVIOR:
                    </div>
                    {bounty.expectedBehaviour}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#1C2029] pt-3 text-[10px] font-mono text-[#525866]">
                    <span>{bounty.tests} TESTS LOGGED</span>
                    <span>{bounty.findings} ANOMALIES</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => openChallengeModal(bounty)}
                      className="w-full rounded border border-[#E09F3E]/40 bg-[#E09F3E] py-2 text-xs font-mono font-semibold text-[#0C0D10] transition hover:bg-[#EBB052]"
                    >
                      CHALLENGE_TARGET →
                    </button>
                    <Link
                      href={`/bounties/${bounty.id}`}
                      className="rounded border border-[#232732] bg-[#0C0D10] px-3 py-2 text-xs font-mono text-[#8C93A4] hover:border-[#3D4454] hover:text-[#EDEDF0] transition"
                    >
                      SPEC
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded border border-[#232732] bg-[#13151B] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232732] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#E09F3E]">
                  SPECIMEN_SUBMISSION_DISPATCH
                </span>
                <h3 className="text-sm font-mono font-semibold text-[#EDEDF0] mt-1">
                  TARGET: {selectedBounty.model} ({selectedBounty.category})
                </h3>
              </div>
              <button
                onClick={() => setSelectedBounty(null)}
                className="text-xs font-mono text-[#525866] hover:text-[#EDEDF0]"
              >
                [ESC]
              </button>
            </div>

            {submittedSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#38A169]/10 text-[#38A169] text-base font-bold border border-[#38A169]/30">
                  ✓
                </div>
                <h4 className="text-sm font-mono font-semibold text-[#EDEDF0]">
                  FINDING DISPATCHED TO VALIDATOR CONSENSUS
                </h4>
                <p className="text-xs text-[#8C93A4] max-w-md mx-auto leading-relaxed">
                  Your finding has been registered under status{" "}
                  <span className="text-[#E09F3E] font-mono">PENDING_VALIDATION</span>. Independent validators will execute scikit-learn reproduction and Groq AI triage to release the {selectedBounty.reward} escrow pool.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Link
                    href="/my-submissions"
                    className="rounded border border-[#E09F3E]/40 bg-[#E09F3E] px-4 py-2 text-xs font-mono font-semibold text-[#0C0D10] hover:bg-[#EBB052] transition"
                  >
                    VIEW_IN_SUBMISSIONS →
                  </Link>
                  <button
                    onClick={() => setSelectedBounty(null)}
                    className="rounded border border-[#232732] px-4 py-2 text-xs font-mono text-[#8C93A4] hover:text-[#EDEDF0]"
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFindingSubmit} className="py-4 space-y-4">
                {formError && (
                  <div className="rounded border border-[#D9534F]/30 bg-[#D9534F]/10 p-3 text-xs font-mono text-[#D9534F]">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8C93A4] mb-1">
                    Finding Title (Observed Defect)
                  </label>
                  <input
                    type="text"
                    required
                    value={findingTitle}
                    onChange={(e) => setFindingTitle(e.target.value)}
                    placeholder="e.g. Model outputs false legitimate confidence on high-value cluster"
                    className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3 py-2 text-xs font-mono text-[#EDEDF0] placeholder-[#525866] focus:border-[#E09F3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8C93A4] mb-1">
                    Severity Classification
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Severity)}
                    className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3 py-2 text-xs font-mono text-[#EDEDF0] focus:border-[#E09F3E] focus:outline-none"
                  >
                    <option value="Low">Low — Edge case fluctuation</option>
                    <option value="Medium">Medium — Boundary inconsistency</option>
                    <option value="High">High — Critical misclassification</option>
                    <option value="Critical">Critical — Complete filter bypass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8C93A4] mb-1">
                    What Happened (Failure Description)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={whatHappened}
                    onChange={(e) => setWhatHappened(e.target.value)}
                    placeholder="Document how the model deviated from its declared behavior specification..."
                    className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3 py-2 text-xs text-[#EDEDF0] placeholder-[#525866] focus:border-[#E09F3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8C93A4] mb-1">
                    Evidence & Payload Vectors
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Paste parameter payload, feature vectors, or output trace..."
                    className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3 py-2 text-xs font-mono text-[#EDEDF0] placeholder-[#525866] focus:border-[#E09F3E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8C93A4] mb-1">
                    Deterministic Reproduction Sequence
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reproductionSteps}
                    onChange={(e) => setReproductionSteps(e.target.value)}
                    placeholder="1. Inject feature vector into target model&#10;2. Record prediction score and latency&#10;3. Confirm boundary deviation against baseline"
                    className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3 py-2 text-xs font-mono text-[#EDEDF0] placeholder-[#525866] focus:border-[#E09F3E] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[#232732] pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedBounty(null)}
                    className="rounded border border-[#232732] px-4 py-2 text-xs font-mono text-[#8C93A4] hover:text-[#EDEDF0]"
                  >
                    ABORT
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded border border-[#E09F3E]/40 bg-[#E09F3E] px-4 py-2 text-xs font-mono font-semibold text-[#0C0D10] transition hover:bg-[#EBB052] disabled:opacity-50"
                  >
                    {isSubmitting ? "DISPATCHING..." : "COMMIT_REPORT →"}
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
        <div className="min-h-screen bg-[#0C0D10] text-[#EDEDF0] flex items-center justify-center text-xs font-mono text-[#525866]">
          INITIALIZING_RESEARCH_ARENA...
        </div>
      }
    >
      <ResearchArenaContent />
    </Suspense>
  );
}
