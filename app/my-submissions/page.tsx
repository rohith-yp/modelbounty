"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Severity, Submission, SubmissionStatus } from "@/lib/data";
import { getStoredSubmissions } from "@/lib/store";
import { getBackendFindings, type BackendFinding } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

function formatSeverity(sev: string): Severity {
  const s = (sev || "").toUpperCase();
  if (s === "CRITICAL") return "Critical";
  if (s === "HIGH") return "High";
  if (s === "LOW") return "Low";
  return "Medium";
}

function formatStatus(stat: string): SubmissionStatus {
  const s = (stat || "").toUpperCase();
  if (s === "APPROVED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  return "Pending";
}

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadAllSubmissions() {
      const localSubs = getStoredSubmissions();
      try {
        const backendFindings = await getBackendFindings();
        if (!isMounted) return;

        if (backendFindings && backendFindings.length > 0) {
          const mapped: Submission[] = backendFindings.map((bf: BackendFinding) => ({
            id: bf.id,
            bountyId: bf.bounty_id,
            model: bf.model_name || bf.bounty_title || "FraudDetect V1",
            finding: bf.finding_title,
            title: bf.finding_title,
            category: bf.bounty_title?.toLowerCase().includes("health")
              ? "Healthcare ML"
              : bf.bounty_title?.toLowerCase().includes("support")
              ? "NLP"
              : "Fraud Detection",
            severity: formatSeverity(bf.severity),
            status: formatStatus(bf.status),
            reward: bf.reward || "0.50 ETH",
            researcher: bf.researcher_name || "0x7A...91F2",
            submitted: bf.created_at ? new Date(bf.created_at).toLocaleDateString() : "Recently",
            description: bf.what_happened,
            evidence: bf.evidence,
            reproduction: bf.reproduction_steps,
          }));

          // Merge backend findings with any recent local submissions (deduping by id)
          const seenIds = new Set(mapped.map((m) => m.id));
          const uniqueLocal = localSubs.filter((l) => !seenIds.has(l.id));
          setSubmissions([...uniqueLocal, ...mapped]);
          return;
        }
      } catch {
        // Fall back to local
      }

      if (isMounted) {
        setSubmissions(localSubs);
      }
    }

    loadAllSubmissions();

    const handleUpdate = () => {
      loadAllSubmissions();
    };

    window.addEventListener("modelbounty-submissions-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("modelbounty-submissions-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const pending = submissions.filter(
    (submission) => submission.status === "Pending"
  ).length;

  const approved = submissions.filter(
    (submission) => submission.status === "Approved"
  ).length;

  const rejected = submissions.filter(
    (submission) => submission.status === "Rejected"
  ).length;

  return (
    <main className="min-h-screen bg-[#0C0D10] text-[#EDEDF0]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Navbar title="My Submissions" />

          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            {/* Header Telemetry */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#232732] pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase">
                    01 // RESEARCHER FIELD FINDINGS
                  </span>
                  <span className="inline-block h-1 w-1 rounded-full bg-[#E09F3E]" />
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">
                    SPECIMEN ATTESTATION LOG
                  </span>
                </div>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  My Submitted Findings
                </h1>

                <p className="mt-1 text-xs text-zinc-400">
                  Track your model failure specimens, consensus peer reviews, and verified cryptographic reward payouts.
                </p>
              </div>

              <Link
                href="/research-arena"
                className="self-start sm:self-auto inline-flex items-center gap-2 rounded border border-[#E09F3E] bg-[#E09F3E] px-4 py-2 font-mono text-xs font-semibold text-black transition hover:bg-[#E09F3E]/90"
              >
                <span>+ CHALLENGE SPECIMEN (ARENA)</span>
              </Link>
            </div>

            {/* Counters Strip */}
            <div className="mt-6 grid grid-cols-1 gap-px bg-[#232732] sm:grid-cols-3 border border-[#232732]">
              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Pending Validation
                  </span>
                  <span className="font-mono text-[10px] text-amber-400">IN REVIEW</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-white">
                    {pending}
                  </span>
                  <span className="text-[11px] text-zinc-500">specimens queued</span>
                </div>
              </div>

              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Attested & Approved
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">BOUNTY WON</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-white">
                    {approved}
                  </span>
                  <span className="text-[11px] text-zinc-500">verified findings</span>
                </div>
              </div>

              <div className="bg-[#13151B] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Rejected / Inconclusive
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">DISMISSED</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tracking-tight text-white">
                    {rejected}
                  </span>
                  <span className="text-[11px] text-zinc-500">unreproduced specimens</span>
                </div>
              </div>
            </div>

            {/* Submissions Ledger */}
            <div className="mt-8 border border-[#232732] bg-[#13151B]">
              <div className="flex items-center justify-between border-b border-[#232732] px-6 py-4">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase block">
                    02 // SPECIMEN AUDIT LOG
                  </span>
                  <h2 className="text-sm font-semibold text-white mt-0.5">
                    Field Submissions History
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-zinc-500">
                  {submissions.length} SPECIMEN{submissions.length === 1 ? "" : "S"} RECORDED
                </span>
              </div>

              {submissions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                    No submissions recorded yet
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Execute adversarial tests in the Research Arena to submit your first model vulnerability finding.
                  </p>
                  <Link
                    href="/research-arena"
                    className="mt-4 inline-flex items-center gap-1.5 rounded border border-[#E09F3E] bg-[#E09F3E] px-4 py-2 font-mono text-xs font-semibold text-black hover:bg-[#E09F3E]/90 transition"
                  >
                    Open Research Arena →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#232732]">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-5 hover:bg-[#0C0D10]/40 transition space-y-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="border border-[#232732] bg-[#0C0D10] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                            {sub.model}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-500">
                            {sub.category}
                          </span>
                          <span
                            className={`border px-2 py-0.5 font-mono text-[10px] uppercase ${
                              sub.severity === "Critical"
                                ? "border-red-500/30 bg-red-950/20 text-red-400"
                                : sub.severity === "High"
                                ? "border-orange-500/30 bg-orange-950/20 text-orange-400"
                                : sub.severity === "Medium"
                                ? "border-amber-500/30 bg-amber-950/20 text-amber-400"
                                : "border-zinc-700 bg-zinc-900 text-zinc-400"
                            }`}
                          >
                            SEV: {sub.severity}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-600">
                            ID: {sub.id}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-block border px-2.5 py-0.5 font-mono text-[10px] uppercase ${
                              sub.status === "Pending"
                                ? "border-amber-500/30 bg-amber-950/20 text-amber-300"
                                : sub.status === "Approved"
                                ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                                : "border-red-500/30 bg-red-950/20 text-red-300"
                            }`}
                          >
                            {sub.status === "Pending" ? "AWAITING CONSENSUS" : sub.status === "Approved" ? "ATTESTED & APPROVED" : "REJECTED"}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-white">
                        {sub.finding}
                      </h3>

                      {sub.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {sub.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] text-zinc-500 pt-1">
                        <div>
                          BOUNTY REWARD:{" "}
                          <span className="font-bold text-[#E09F3E]">
                            {sub.reward}
                          </span>
                        </div>
                        <div>
                          RESEARCHER:{" "}
                          <span className="text-zinc-300">
                            {sub.researcher}
                          </span>
                        </div>
                        <div>
                          SUBMITTED:{" "}
                          <span className="text-zinc-400">{sub.submitted}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
