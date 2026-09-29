"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Submission } from "@/lib/data";
import {
  getStoredSubmissions,
  updateSubmissionStatus,
} from "@/lib/store";
import {
  getAIAnalysis,
  runAIAnalysis,
  getBackendFindings,
  getVerification,
  getVerificationHistory,
  verifyFinding,
  approveFinding,
  rejectFinding,
  type AIAnalysisResponse,
  type VerificationData,
} from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

function ValidatorContent() {
  const searchParams = useSearchParams();
  const queryFindingId = searchParams.get("id") || searchParams.get("finding");

  const [findings, setFindings] = useState<Submission[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Submission | null>(null);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ML Verification state
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<VerificationData[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  function handleSelectFinding(f: Submission | null) {
    setSelectedFinding(f);
    setAiAnalysis(null);
    setAiError(null);
    setVerificationData(null);
    setVerificationHistory([]);
    setVerificationError(null);
  }

  // Copy ID feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleCopyId(id: string) {
    if (!id) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(id)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(() => {
          fallbackCopy(id);
        });
    } else {
      fallbackCopy(id);
    }
  }

  function fallbackCopy(text: string) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  }

  async function loadFindings() {
    const local = getStoredSubmissions();

    try {
      const backendFindings = await getBackendFindings();
      if (backendFindings && backendFindings.length > 0) {
        const mappedBackend: Submission[] = backendFindings.map((bf) => {
          let status: "Pending" | "Approved" | "Rejected" = "Pending";
          const s = (bf.status || "").toUpperCase();
          if (s === "APPROVED") status = "Approved";
          else if (s === "REJECTED") status = "Rejected";

          let severity: "Low" | "Medium" | "High" | "Critical" = "High";
          const sev = (bf.severity || "").toLowerCase();
          if (sev === "critical") severity = "Critical";
          else if (sev === "high") severity = "High";
          else if (sev === "medium") severity = "Medium";
          else if (sev === "low") severity = "Low";

          return {
            id: bf.id,
            bountyId: bf.bounty_id,
            model: bf.model_name || bf.bounty_title || "FraudDetect V1",
            finding: bf.finding_title,
            category: "Model Vulnerability",
            severity,
            status,
            reward: bf.reward || "0.50 ETH",
            researcher: bf.researcher_name || "0x7A...91F2",
            submitted: "Recent",
            title: bf.finding_title,
            description: bf.what_happened,
            evidence: bf.evidence,
            reproduction: bf.reproduction_steps,
          };
        });

        const localOnly = local.filter(
          (l) => !mappedBackend.some((b) => b.id === l.id)
        );
        const combined = [...mappedBackend, ...localOnly];
        setFindings(combined);
        return combined;
      }
    } catch {
      // Backend unavailable; fall back to local storage
    }

    setFindings(local);
    return local;
  }

  useEffect(() => {
    loadFindings();

    const handleUpdate = () => {
      loadFindings();
    };

    window.addEventListener("modelbounty-submissions-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("modelbounty-submissions-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Handle URL query parameter selection
  useEffect(() => {
    if (!queryFindingId || findings.length === 0) return;

    const matched = findings.find((f) => f.id === queryFindingId);
    if (matched) {
      setSelectedFinding(matched);
    }
  }, [queryFindingId, findings]);

  // Fetch AI analysis and ML verification when a finding is selected
  useEffect(() => {
    const id = selectedFinding?.id;
    if (!id) return;

    let isMounted = true;

    getAIAnalysis(id)
      .then((data) => {
        if (isMounted) {
          setAiAnalysis(data);
          setAiLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setAiLoading(false);
          const errorObj = err as { status?: number; message?: string };
          if (
            errorObj?.status === 404 ||
            errorObj?.message?.toLowerCase().includes("no ai analysis")
          ) {
            setAiError("NO_ANALYSIS");
          } else {
            setAiError(
              errorObj?.message || "AI analysis is not available for this finding."
            );
          }
        }
      });

    getVerification(id)
      .then((v) => {
        if (isMounted) setVerificationData(v);
      })
      .catch(() => {});

    getVerificationHistory(id)
      .then((hist) => {
        if (isMounted) setVerificationHistory(hist);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedFinding?.id]);

  async function handleRunAIAnalysis() {
    if (!selectedFinding || aiGenerating) return;
    setAiGenerating(true);
    setAiError(null);

    try {
      const generated = await runAIAnalysis(selectedFinding.id);
      setAiAnalysis(generated);
      setAiError(null);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      if (errorObj?.status === 404) {
        setAiError("Finding record not found on backend server.");
      } else {
        setAiError(
          errorObj?.message || "AI analysis could not be generated. Please try again."
        );
      }
    } finally {
      setAiGenerating(false);
    }
  }

  const pendingFindings = findings.filter(
    (finding) =>
      finding.status === "Pending" &&
      Boolean(finding.model && finding.finding)
  );

  const pendingCount = findings.filter(
    (finding) => finding.status === "Pending"
  ).length;

  const approvedCount = findings.filter(
    (finding) => finding.status === "Approved"
  ).length;

  const rejectedCount = findings.filter(
    (finding) => finding.status === "Rejected"
  ).length;

  async function handleRunVerification() {
    if (!selectedFinding || verifying) return;
    setVerifying(true);
    setVerificationError(null);

    try {
      const v = await verifyFinding(selectedFinding.id);
      setVerificationData(v);
      setVerificationHistory((prev) => [v, ...prev.filter((p) => p.id !== v.id)]);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setVerificationError(errorObj?.message || "Model verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleStatusUpdate(
    id: string,
    status: "Approved" | "Rejected"
  ) {
    updateSubmissionStatus(id, status);

    try {
      if (status === "Approved") {
        await approveFinding(id, "user-validator", "Approved by human validator");
      } else {
        await rejectFinding(id, "user-validator", "Rejected by human validator");
      }
    } catch (e) {
      console.warn("Backend status update error:", e);
    }

    handleSelectFinding(null);
    loadFindings();
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <section className="min-w-0 flex-1">
          <Navbar title="Validator" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Verification Network
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Validator Dashboard
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  Review researcher findings, inspect evidence, and decide
                  whether reported model failures are valid.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-zinc-400">
                  Validator Consensus Active
                </span>
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Pending Review
                </p>

                <p className="mt-4 text-3xl font-bold text-white">
                  {pendingCount}
                </p>

                <p className="mt-2 text-xs text-yellow-400">
                  Requires validation
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Approved
                </p>

                <p className="mt-4 text-3xl font-bold text-white">
                  {approvedCount}
                </p>

                <p className="mt-2 text-xs text-emerald-400">
                  Valid findings attested
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Rejected
                </p>

                <p className="mt-4 text-3xl font-bold text-white">
                  {rejectedCount}
                </p>

                <p className="mt-2 text-xs text-red-400">
                  Invalid / non-reproducible
                </p>
              </div>
            </div>

            {/* Findings */}
            <section className="mt-8">
              <div className="mb-6">
                <h3 className="text-base font-semibold text-white">
                  Findings Awaiting Validation
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Independent researcher submissions requiring verification
                </p>
              </div>

              <div className="space-y-4">
                {pendingFindings.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-8 text-center">
                    <p className="text-sm text-zinc-400">
                      No findings are currently awaiting validation.
                    </p>
                  </div>
                ) : (
                  pendingFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6"
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-400">
                              {finding.model}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs ${
                                finding.severity === "Critical"
                                  ? "bg-red-500/10 text-red-400"
                                  : finding.severity === "High"
                                  ? "bg-orange-500/10 text-orange-400"
                                  : finding.severity === "Medium"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-slate-500/10 text-slate-400"
                              }`}
                            >
                              {finding.severity}
                            </span>

                            <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                              Pending Review
                            </span>
                          </div>

                          <h4 className="mt-4 text-base font-semibold text-white">
                            {finding.finding}
                          </h4>

                          <p className="mt-2 max-w-4xl text-xs leading-5 text-zinc-400">
                            Researcher submitted a finding for review under
                            the {finding.model} challenge.
                          </p>

                          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs text-zinc-500">
                            <span>
                              Researcher:{" "}
                              <span className="font-mono text-zinc-300">
                                {finding.researcher}
                              </span>
                            </span>

                            <span>
                              Category:{" "}
                              <span className="text-zinc-300">
                                {finding.category}
                              </span>
                            </span>

                            <span>
                              Reward:{" "}
                              <span className="font-bold text-cyan-400">
                                {finding.reward}
                              </span>
                            </span>

                            <span>
                              Submitted:{" "}
                              <span className="text-zinc-300">
                                {finding.submitted}
                              </span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectFinding(finding)}
                          className="rounded-lg border border-white/10 px-5 py-2.5 text-xs font-medium text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
                        >
                          Review Finding
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      </div>

      {/* Review Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#090d13] p-6 sm:p-7 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-cyan-400">
                  FINDING REVIEW
                </p>

                <h3 className="mt-2 text-xl font-bold text-white">
                  {selectedFinding.finding}
                </h3>
              </div>

              <button
                onClick={() => handleSelectFinding(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="mt-5 space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              {/* Finding ID Section */}
              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    FINDING ID
                  </p>

                  <button
                    type="button"
                    onClick={() => handleCopyId(selectedFinding.id)}
                    className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:border-cyan-500/40 hover:text-white transition"
                    title="Copy Finding ID to clipboard"
                  >
                    {copiedId === selectedFinding.id ? (
                      <span className="font-semibold text-emerald-400">Copied</span>
                    ) : (
                      <>
                        <svg
                          className="h-3 w-3 text-zinc-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-2 font-mono text-xs text-cyan-300 break-all select-all">
                  {selectedFinding.id}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">
                  Model
                </p>
                <p className="mt-1 text-sm text-white">
                  {selectedFinding.model}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">
                  Researcher
                </p>
                <p className="mt-1 font-mono text-sm text-cyan-300">
                  {selectedFinding.researcher}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">
                  Severity Tier & Reward
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-sm font-medium text-white">
                    {selectedFinding.severity}
                  </span>
                  <span className="text-sm font-bold text-cyan-400">
                    {selectedFinding.reward}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">
                  Reported Finding Details
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                  {selectedFinding.description || selectedFinding.finding}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">
                  Evidence & Reproduction
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400 whitespace-pre-line">
                  {selectedFinding.evidence ||
                    selectedFinding.reproduction ||
                    "The researcher submitted a reproducible test case showing unexpected model behaviour under the specified challenge conditions. Peer validation tests the input against the live model."}
                </p>
              </div>

              {/* AI-Assisted Analysis Section */}
              <div className="rounded-xl border border-cyan-500/20 bg-[#070b10] p-4.5 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/10 text-cyan-400">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      AI-ASSISTED ANALYSIS
                    </h4>
                  </div>

                  {aiAnalysis && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-400">
                        {aiAnalysis.provider ? aiAnalysis.provider.toUpperCase() : "GROQ"} : {aiAnalysis.model || "qwen/qwen3.8-27b"}
                      </span>
                      <button
                        onClick={handleRunAIAnalysis}
                        disabled={aiGenerating}
                        className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white hover:border-cyan-500/40 disabled:opacity-50 transition"
                      >
                        {aiGenerating ? "Analyzing finding..." : "Re-run AI Analysis"}
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Advisory Disclaimer */}
                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-relaxed text-amber-200/90">
                  AI analysis is advisory. Final validation decisions are made by the human validator.
                </div>

                {/* Loading State */}
                {aiLoading && (
                  <div className="mt-4 flex items-center justify-center gap-3 py-6 text-xs text-zinc-400">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    <span>Loading AI analysis...</span>
                  </div>
                )}

                {/* Generating State */}
                {aiGenerating && (
                  <div className="mt-4 flex items-center justify-center gap-3 py-6 text-xs text-cyan-300">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    <span>Analyzing finding...</span>
                  </div>
                )}

                {/* No Analysis State */}
                {!aiLoading && !aiGenerating && aiError === "NO_ANALYSIS" && (
                  <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/20 p-5 text-center">
                    <p className="text-xs text-zinc-400">
                      No AI analysis is available for this finding yet.
                    </p>
                    <button
                      onClick={handleRunAIAnalysis}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition"
                    >
                      Run AI Analysis
                    </button>
                  </div>
                )}

                {/* Generic/Network Error State */}
                {!aiLoading && !aiGenerating && aiError && aiError !== "NO_ANALYSIS" && (
                  <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
                    <p className="text-xs text-red-300">{aiError}</p>
                    <button
                      onClick={handleRunAIAnalysis}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Active Analysis Result */}
                {!aiLoading && !aiGenerating && aiAnalysis && (
                  <div className="mt-4 space-y-3.5 text-xs">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          AI Severity
                        </p>
                        <p
                          className={`mt-1 font-semibold ${
                            (aiAnalysis.severity || "").toUpperCase() === "CRITICAL"
                              ? "text-red-400"
                              : (aiAnalysis.severity || "").toUpperCase() === "HIGH"
                              ? "text-orange-400"
                              : (aiAnalysis.severity || "").toUpperCase() === "MEDIUM"
                              ? "text-yellow-400"
                              : "text-slate-300"
                          }`}
                        >
                          {aiAnalysis.severity || "MEDIUM"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          AI Confidence
                        </p>
                        <p className="mt-1 font-semibold text-cyan-300">
                          {typeof aiAnalysis.confidence === "number"
                            ? `${Math.round(aiAnalysis.confidence * 100)}% (${aiAnalysis.confidence.toFixed(2)})`
                            : "N/A"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Provider
                        </p>
                        <p className="mt-1 font-medium text-zinc-300 capitalize">
                          {aiAnalysis.provider || "Groq"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Model
                        </p>
                        <p
                          className="mt-1 font-mono text-[11px] text-zinc-300 truncate"
                          title={aiAnalysis.model}
                        >
                          {aiAnalysis.model || "qwen/qwen3.8-27b"}
                        </p>
                      </div>
                    </div>

                    {/* Classification */}
                    {aiAnalysis.classification && (
                      <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Classification
                        </p>
                        <p className="mt-1 font-medium text-white">
                          {aiAnalysis.classification}
                        </p>
                      </div>
                    )}

                    {/* Summary */}
                    {aiAnalysis.summary && (
                      <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Summary
                        </p>
                        <p className="mt-1 leading-relaxed text-zinc-300">
                          {aiAnalysis.summary}
                        </p>
                      </div>
                    )}

                    {/* Evidence Assessment */}
                    {aiAnalysis.evidence_assessment && (
                      <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Evidence Assessment
                        </p>
                        <p className="mt-1 leading-relaxed text-zinc-300">
                          {aiAnalysis.evidence_assessment}
                        </p>
                      </div>
                    )}

                    {/* Reproduction Assessment */}
                    {aiAnalysis.reproduction_assessment && (
                      <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Reproduction Assessment
                        </p>
                        <p className="mt-1 leading-relaxed text-zinc-300">
                          {aiAnalysis.reproduction_assessment}
                        </p>
                      </div>
                    )}

                    {/* Potential Impact */}
                    {aiAnalysis.potential_impact && (
                      <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Potential Impact
                        </p>
                        <p className="mt-1 leading-relaxed text-zinc-300">
                          {aiAnalysis.potential_impact}
                        </p>
                      </div>
                    )}

                    {/* Reasoning */}
                    {aiAnalysis.reasoning && (
                      <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Reasoning
                        </p>
                        <p className="mt-1 leading-relaxed text-zinc-300">
                          {aiAnalysis.reasoning}
                        </p>
                      </div>
                    )}

                    {/* Recommended Validation Checks */}
                    {aiAnalysis.recommended_validation_checks &&
                      aiAnalysis.recommended_validation_checks.length > 0 && (
                        <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3">
                          <p className="text-[10px] font-semibold uppercase text-cyan-300">
                            Recommended Validation Checks
                          </p>
                          <ol className="mt-2 space-y-1.5 pl-4 list-decimal text-zinc-300 text-xs">
                            {aiAnalysis.recommended_validation_checks.map(
                              (check, idx) => (
                                <li key={idx} className="leading-relaxed pl-1">
                                  {check}
                                </li>
                              )
                            )}
                          </ol>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Human Validator Advisory Notice */}
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-200/90 flex items-start gap-2.5">
                <span className="text-sm">⚠️</span>
                <div>
                  <strong className="font-semibold text-amber-300">Advisory Notice:</strong> AI analysis is advisory. Final validation decisions are made by the human validator. Status is never changed automatically.
                </div>
              </div>

              {/* ML Model Verification Section */}
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                      ML Verification Layer
                    </span>
                    <h4 className="text-sm font-semibold text-white mt-0.5">
                      Model Inference Verification
                    </h4>
                  </div>

                  <button
                    onClick={handleRunVerification}
                    disabled={verifying}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>Verifying Against Model...</span>
                      </>
                    ) : (
                      <span>Run ML Verification</span>
                    )}
                  </button>
                </div>

                {/* Verification error state */}
                {verificationError && (
                  <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                    ⚠️ {verificationError}
                  </div>
                )}

                {/* Verification result display */}
                {verificationData ? (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          ML Prediction
                        </p>
                        <p
                          className={`mt-1 font-semibold ${
                            verificationData.prediction === "FRAUD"
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {verificationData.prediction} ({verificationData.prediction_value})
                        </p>
                      </div>

                      <div className="rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Fraud Probability
                        </p>
                        <p className="mt-1 font-semibold text-cyan-300 font-mono">
                          {(verificationData.fraud_probability * 100).toFixed(1)}%
                        </p>
                      </div>

                      <div className="rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Model
                        </p>
                        <p className="mt-1 font-medium text-white truncate">
                          {verificationData.model_name}
                        </p>
                      </div>

                      <div className="rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500">
                          Execution Time
                        </p>
                        <p className="mt-1 font-medium text-zinc-300 font-mono">
                          {verificationData.execution_time_ms ? `${verificationData.execution_time_ms} ms` : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Verification History list */}
                    {verificationHistory.length > 1 && (
                      <div className="mt-2 rounded-lg border border-white/[0.04] bg-black/30 p-2.5">
                        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1.5">
                          Verification History ({verificationHistory.length} runs)
                        </p>
                        <div className="space-y-1 max-h-24 overflow-y-auto text-[11px] font-mono text-zinc-400">
                          {verificationHistory.map((h, i) => (
                            <div key={h.id || i} className="flex items-center justify-between py-0.5 border-b border-white/[0.02]">
                              <span>{new Date(h.created_at).toLocaleTimeString()} - {h.prediction}</span>
                              <span className="text-cyan-300">{(h.fraud_probability * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 py-3 text-center text-xs text-zinc-500">
                    No ML verification performed yet for this finding. Click &quot;Run ML Verification&quot; to execute real inference.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex gap-3 border-t border-white/[0.08] pt-4">
              <button
                onClick={() => handleSelectFinding(null)}
                className="rounded-lg border border-white/[0.08] px-4 py-2.5 text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>

              <button
                onClick={() =>
                  handleStatusUpdate(selectedFinding.id, "Approved")
                }
                className="flex-1 rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-emerald-300"
              >
                Approve Finding
              </button>

              <button
                onClick={() =>
                  handleStatusUpdate(selectedFinding.id, "Rejected")
                }
                className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                Reject Finding
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ValidatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090d] flex items-center justify-center text-zinc-400 text-sm">
          Loading Validator Dashboard...
        </div>
      }
    >
      <ValidatorContent />
    </Suspense>
  );
}
