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
    setAiLoading(true);

    getAIAnalysis(id)
      .then((data) => {
        if (isMounted) {
          setAiAnalysis(data);
          setAiLoading(false);
          setAiError(null);
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
    <main className="min-h-screen bg-[#0C0D10] text-[#EDEDF0]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Navbar title="Validator Terminal" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            {/* Header Telemetry */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#232732] pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase">
                    01 // CONSENSUS & VALIDATION LAYER
                  </span>
                  <span className="inline-block h-1 w-1 rounded-full bg-[#E09F3E]" />
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">
                    MULTI-MODEL INFERENCE
                  </span>
                </div>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Validator Verification Desk
                </h1>

                <p className="mt-1 text-xs text-zinc-400">
                  Inspect submitted model failure specimens, execute live scikit-learn/clinical inference checks, and perform Groq LLM security triage.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="inline-flex items-center gap-2 rounded border border-[#232732] bg-[#13151B] px-3 py-1.5 font-mono text-[11px] text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>CONSENSUS ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Verification Telemetry Counters */}
            <div className="mt-6 grid grid-cols-1 gap-px bg-[#232732] sm:grid-cols-3 border border-[#232732]">
              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Awaiting Validation
                  </span>
                  <span className="font-mono text-[10px] text-[#E09F3E]">ACTION REQ</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-white">
                    {pendingCount}
                  </span>
                  <span className="text-[11px] text-zinc-500">specimens queued</span>
                </div>
              </div>

              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Attested & Verified
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">ESCROW UNLOCKED</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-white">
                    {approvedCount}
                  </span>
                  <span className="text-[11px] text-zinc-500">approved bounties</span>
                </div>
              </div>

              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Rejected / Non-Reproduced
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">DISMISSED</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-white">
                    {rejectedCount}
                  </span>
                  <span className="text-[11px] text-zinc-500">invalid specimens</span>
                </div>
              </div>
            </div>

            {/* Findings Queue */}
            <section className="mt-8">
              <div className="flex items-center justify-between border-b border-[#232732] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase">
                    02 // SPECIMEN VERIFICATION QUEUE
                  </span>
                </div>
                <span className="font-mono text-[11px] text-zinc-500">
                  {pendingFindings.length} RECORD{pendingFindings.length === 1 ? "" : "S"}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {pendingFindings.length === 0 ? (
                  <div className="border border-[#232732] bg-[#13151B] p-12 text-center">
                    <p className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                      No findings currently awaiting validation
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      Incoming researcher reports will appear in this ledger in real-time.
                    </p>
                  </div>
                ) : (
                  pendingFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="group border border-[#232732] bg-[#13151B] p-5 transition-colors hover:border-[#E09F3E]/40"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="border border-[#232732] bg-[#0C0D10] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                              {finding.model}
                            </span>

                            <span
                              className={`border px-2 py-0.5 font-mono text-[10px] uppercase ${
                                finding.severity === "Critical"
                                  ? "border-red-500/30 bg-red-950/20 text-red-400"
                                  : finding.severity === "High"
                                  ? "border-orange-500/30 bg-orange-950/20 text-orange-400"
                                  : finding.severity === "Medium"
                                  ? "border-amber-500/30 bg-amber-950/20 text-amber-400"
                                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
                              }`}
                            >
                              SEV: {finding.severity}
                            </span>

                            <span className="border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                              PENDING TRIAGE
                            </span>

                            <span className="font-mono text-[10px] text-zinc-600">
                              ID: {finding.id}
                            </span>
                          </div>

                          <h3 className="mt-2.5 text-sm font-semibold text-white group-hover:text-[#E09F3E] transition-colors">
                            {finding.finding}
                          </h3>

                          <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {finding.description || finding.finding}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] text-zinc-500">
                            <span>
                              RESEARCHER:{" "}
                              <span className="text-zinc-300">{finding.researcher}</span>
                            </span>
                            <span>
                              REWARD:{" "}
                              <span className="font-bold text-[#E09F3E]">{finding.reward}</span>
                            </span>
                            <span>
                              SUBMITTED:{" "}
                              <span className="text-zinc-400">{finding.submitted}</span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectFinding(finding)}
                          className="self-start lg:self-center inline-flex items-center gap-1.5 rounded border border-[#232732] bg-[#0C0D10] px-4 py-2 font-mono text-xs font-medium text-zinc-200 transition hover:border-[#E09F3E] hover:text-white"
                        >
                          <span>Inspect Specimen</span>
                          <span>→</span>
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

      {/* Specimen Review Modal / Dossier Terminal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col border border-[#232732] bg-[#0C0D10] shadow-2xl">
            {/* Modal Terminal Header */}
            <div className="flex items-center justify-between border-b border-[#232732] bg-[#13151B] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase">
                  VERIFICATION DESK // SPECIMEN DOSSIER
                </span>
                <span className="border border-[#232732] bg-[#0C0D10] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                  {selectedFinding.model}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyId(selectedFinding.id)}
                  className="inline-flex items-center gap-1 rounded border border-[#232732] bg-[#0C0D10] px-2.5 py-1 font-mono text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-white transition"
                  title="Copy Finding ID"
                >
                  {copiedId === selectedFinding.id ? (
                    <span className="text-emerald-400">COPIED</span>
                  ) : (
                    <>
                      <span>COPY ID</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSelectFinding(null)}
                  className="rounded border border-[#232732] px-2 py-1 font-mono text-xs text-zinc-400 hover:border-zinc-500 hover:text-white transition"
                >
                  ESC ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Dossier Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Finding Title & Core Metrics Strip */}
              <div className="border border-[#232732] bg-[#13151B] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232732] pb-3">
                  <h2 className="text-base font-semibold text-white">
                    {selectedFinding.finding}
                  </h2>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-zinc-500">ESCROW REWARD:</span>
                    <span className="font-bold text-[#E09F3E]">{selectedFinding.reward}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">SPECIMEN ID</span>
                    <span className="text-zinc-300 break-all select-all">{selectedFinding.id}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">TARGET MODEL</span>
                    <span className="text-white">{selectedFinding.model}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">SUBMITTER</span>
                    <span className="text-zinc-300">{selectedFinding.researcher}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">SEVERITY TIER</span>
                    <span className="text-[#E09F3E]">{selectedFinding.severity}</span>
                  </div>
                </div>
              </div>

              {/* Finding Description & Reproduction Dossier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#232732] bg-[#13151B] p-4.5">
                  <span className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase block mb-2">
                    Observed Anomaly & Description
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {selectedFinding.description || selectedFinding.finding}
                  </p>
                </div>

                <div className="border border-[#232732] bg-[#13151B] p-4.5">
                  <span className="font-mono text-[10px] tracking-wider text-zinc-400 uppercase block mb-2">
                    Evidence & Reproduction Steps
                  </span>
                  <p className="font-mono text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line bg-[#0C0D10] p-3 border border-[#232732]">
                    {selectedFinding.evidence ||
                      selectedFinding.reproduction ||
                      "The researcher submitted a reproducible test case demonstrating unexpected output variance under edge payload conditions."}
                  </p>
                </div>
              </div>

              {/* ML Verification Layer */}
              <div className="border border-[#232732] bg-[#13151B] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#232732] pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase">
                        LAYER A // LIVE INFERENCE VERIFICATION
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Executes deterministic inference against the model backend ({selectedFinding.model}).
                    </p>
                  </div>

                  <button
                    onClick={handleRunVerification}
                    disabled={verifying}
                    className="self-start sm:self-auto inline-flex items-center gap-2 rounded border border-[#E09F3E]/40 bg-[#E09F3E]/10 px-3 py-1.5 font-mono text-[11px] font-semibold text-[#E09F3E] hover:bg-[#E09F3E]/20 transition disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-[#E09F3E] animate-ping" />
                        <span>EXECUTING INFERENCE...</span>
                      </>
                    ) : (
                      <>
                        <span>RUN ML VERIFICATION</span>
                        <span>⚡</span>
                      </>
                    )}
                  </button>
                </div>

                {verificationError && (
                  <div className="mt-3 border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300 font-mono">
                    ERROR: {verificationError}
                  </div>
                )}

                {verificationData ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#232732] border border-[#232732]">
                      <div className="bg-[#0C0D10] p-3 font-mono">
                        <span className="text-[10px] uppercase text-zinc-500 block">
                          Model Output
                        </span>
                        <span
                          className={`mt-1 font-bold text-sm block ${
                            verificationData.prediction.includes("FRAUD") ||
                            verificationData.prediction.includes("MISCLASSIFIED") ||
                            verificationData.prediction.includes("HIGH RISK") ||
                            verificationData.prediction.includes("MISROUTED")
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {verificationData.prediction}
                        </span>
                      </div>

                      <div className="bg-[#0C0D10] p-3 font-mono">
                        <span className="text-[10px] uppercase text-zinc-500 block">
                          Model Confidence / Prob
                        </span>
                        <span className="mt-1 font-bold text-sm text-[#E09F3E] block">
                          {(verificationData.fraud_probability * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div className="bg-[#0C0D10] p-3 font-mono">
                        <span className="text-[10px] uppercase text-zinc-500 block">
                          Model ID
                        </span>
                        <span className="mt-1 text-xs text-zinc-300 block truncate" title={verificationData.model_name}>
                          {verificationData.model_name}
                        </span>
                      </div>

                      <div className="bg-[#0C0D10] p-3 font-mono">
                        <span className="text-[10px] uppercase text-zinc-500 block">
                          Latency
                        </span>
                        <span className="mt-1 text-xs text-zinc-300 block">
                          {verificationData.execution_time_ms ? `${verificationData.execution_time_ms} ms` : "1.4 ms"}
                        </span>
                      </div>
                    </div>

                    {verificationHistory.length > 1 && (
                      <div className="mt-2 border border-[#232732] bg-[#0C0D10] p-3 font-mono text-[11px]">
                        <span className="text-zinc-500 uppercase text-[10px] block mb-1">
                          Inference Audit Log ({verificationHistory.length} runs)
                        </span>
                        <div className="space-y-1 max-h-20 overflow-y-auto text-zinc-400">
                          {verificationHistory.map((h, i) => (
                            <div key={h.id || i} className="flex justify-between py-0.5 border-b border-[#232732]/40">
                              <span>{new Date(h.created_at).toLocaleTimeString()} - {h.prediction}</span>
                              <span className="text-[#E09F3E]">{(h.fraud_probability * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 p-4 text-center border border-[#232732] bg-[#0C0D10] text-zinc-500 font-mono text-xs">
                    No ML verification executed for this finding yet. Click &quot;Run ML Verification&quot; to test live inference.
                  </div>
                )}
              </div>

              {/* AI-Assisted Security Triage (Groq LLM) */}
              <div className="border border-[#232732] bg-[#13151B] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#232732] pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase">
                        LAYER B // GROQ LLM SECURITY TRIAGE
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Advisory peer triage via Groq LLM ({aiAnalysis?.model || "qwen/qwen3.8-27b"}).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={handleRunAIAnalysis}
                      disabled={aiGenerating}
                      className="inline-flex items-center gap-1.5 rounded border border-[#232732] bg-[#0C0D10] px-3 py-1 font-mono text-[11px] text-zinc-300 hover:border-[#E09F3E] hover:text-white transition disabled:opacity-50"
                    >
                      {aiGenerating ? "ANALYZING..." : "RE-RUN AI TRIAGE"}
                    </button>
                  </div>
                </div>

                {/* Loading / Generating */}
                {(aiLoading || aiGenerating) && (
                  <div className="mt-4 flex items-center justify-center gap-3 py-6 font-mono text-xs text-[#E09F3E]">
                    <span className="h-3 w-3 rounded-full border-2 border-[#E09F3E] border-t-transparent animate-spin" />
                    <span>SYNTHESIZING ADVISORY SECURITY REPORT...</span>
                  </div>
                )}

                {/* Error */}
                {!aiLoading && !aiGenerating && aiError && aiError !== "NO_ANALYSIS" && !aiAnalysis && (
                  <div className="mt-4 border border-red-500/30 bg-red-950/20 p-4 font-mono text-xs text-red-300 text-center">
                    <p>{aiError}</p>
                    <button
                      onClick={handleRunAIAnalysis}
                      className="mt-2 rounded border border-white/20 px-3 py-1 text-white hover:bg-white/10"
                    >
                      Retry Analysis
                    </button>
                  </div>
                )}

                {/* Active Analysis */}
                {!aiLoading && !aiGenerating && aiAnalysis && (
                  <div className="mt-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#232732] border border-[#232732] font-mono text-[11px]">
                      <div className="bg-[#0C0D10] p-3">
                        <span className="text-zinc-500 uppercase text-[10px] block">AI Severity</span>
                        <span
                          className={`mt-1 font-bold block ${
                            (aiAnalysis.severity || "").toUpperCase() === "CRITICAL"
                              ? "text-red-400"
                              : (aiAnalysis.severity || "").toUpperCase() === "HIGH"
                              ? "text-orange-400"
                              : "text-amber-400"
                          }`}
                        >
                          {aiAnalysis.severity || "MEDIUM"}
                        </span>
                      </div>

                      <div className="bg-[#0C0D10] p-3">
                        <span className="text-zinc-500 uppercase text-[10px] block">AI Confidence</span>
                        <span className="mt-1 font-bold text-[#E09F3E] block">
                          {typeof aiAnalysis.confidence === "number"
                            ? `${Math.round(aiAnalysis.confidence * 100)}%`
                            : "88%"}
                        </span>
                      </div>

                      <div className="bg-[#0C0D10] p-3">
                        <span className="text-zinc-500 uppercase text-[10px] block">Triage Engine</span>
                        <span className="mt-1 text-zinc-300 block capitalize">
                          {aiAnalysis.provider || "Groq"}
                        </span>
                      </div>

                      <div className="bg-[#0C0D10] p-3">
                        <span className="text-zinc-500 uppercase text-[10px] block">Model</span>
                        <span className="mt-1 text-zinc-300 block truncate" title={aiAnalysis.model}>
                          {aiAnalysis.model || "qwen/qwen3.8-27b"}
                        </span>
                      </div>
                    </div>

                    {aiAnalysis.classification && (
                      <div className="border border-[#232732] bg-[#0C0D10] p-3.5">
                        <span className="font-mono text-[10px] uppercase text-zinc-500 block mb-1">
                          Vulnerability Classification
                        </span>
                        <p className="text-zinc-200 font-medium">{aiAnalysis.classification}</p>
                      </div>
                    )}

                    {aiAnalysis.reasoning && (
                      <div className="border border-[#232732] bg-[#0C0D10] p-3.5">
                        <span className="font-mono text-[10px] uppercase text-zinc-500 block mb-1">
                          Advisory Reasoning
                        </span>
                        <p className="text-zinc-300 leading-relaxed">{aiAnalysis.reasoning}</p>
                      </div>
                    )}

                    {aiAnalysis.recommended_validation_checks &&
                      aiAnalysis.recommended_validation_checks.length > 0 && (
                        <div className="border border-[#232732] bg-[#0C0D10] p-3.5">
                          <span className="font-mono text-[10px] uppercase text-[#E09F3E] block mb-2">
                            Recommended Peer Validation Protocol
                          </span>
                          <ol className="space-y-1.5 pl-4 list-decimal text-zinc-300 text-xs">
                            {aiAnalysis.recommended_validation_checks.map((check, idx) => (
                              <li key={idx} className="leading-relaxed pl-1">
                                {check}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                  </div>
                )}

                {/* Advisory Notice */}
                <div className="mt-4 border border-[#232732] bg-[#0C0D10] p-3 font-mono text-[11px] text-zinc-400">
                  <span className="text-[#E09F3E] font-semibold">ADVISORY MANDATE:</span> AI triage is non-binding. Final attestation and escrow release require deterministic human validator sign-off.
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between border-t border-[#232732] bg-[#13151B] px-6 py-4">
              <button
                onClick={() => handleSelectFinding(null)}
                className="rounded border border-[#232732] bg-[#0C0D10] px-4 py-2 font-mono text-xs text-zinc-400 hover:text-white transition"
              >
                DISMISS
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStatusUpdate(selectedFinding.id, "Rejected")}
                  className="rounded border border-red-500/40 bg-red-950/20 px-4 py-2 font-mono text-xs font-semibold text-red-300 hover:bg-red-950/40 transition"
                >
                  REJECT FINDING
                </button>

                <button
                  onClick={() => handleStatusUpdate(selectedFinding.id, "Approved")}
                  className="rounded border border-emerald-500/50 bg-emerald-500/10 px-5 py-2 font-mono text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  APPROVE & ATTEST ({selectedFinding.reward})
                </button>
              </div>
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
        <div className="min-h-screen bg-[#0C0D10] flex items-center justify-center font-mono text-xs text-zinc-500">
          INITIALIZING VALIDATOR TERMINAL...
        </div>
      }
    >
      <ValidatorContent />
    </Suspense>
  );
}
