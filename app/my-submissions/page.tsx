"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Submission } from "@/lib/data";
import { getStoredSubmissions } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  function loadSubmissions() {
    setSubmissions(getStoredSubmissions());
  }

  useEffect(() => {
    loadSubmissions();

    const handleUpdate = () => {
      loadSubmissions();
    };

    window.addEventListener("modelbounty-submissions-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
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
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <section className="min-w-0 flex-1">
          <Navbar title="My Submissions" />

          <div className="mx-auto max-w-6xl p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Researcher Portal
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  My Submissions
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Track your submitted model findings, validation status, and rewards.
                </p>
              </div>

              <Link
                href="/research-arena"
                className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
              >
                + New Finding (Research Arena)
              </Link>
            </div>

            {/* Counters */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                  PENDING
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{pending}</p>
                <p className="mt-2 text-xs text-yellow-400">
                  Awaiting validator review
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                  APPROVED
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{approved}</p>
                <p className="mt-2 text-xs text-emerald-400">
                  Verified model failure findings
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                  REJECTED
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{rejected}</p>
                <p className="mt-2 text-xs text-red-400">
                  Unreproducible or invalid findings
                </p>
              </div>
            </div>

            {/* List */}
            <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6">
              <div className="mb-6 border-b border-white/[0.06] pb-4">
                <h3 className="text-base font-semibold text-white">
                  Submission History
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  All findings submitted through the researcher workflow
                </p>
              </div>

              {submissions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-zinc-400">
                    No submissions recorded yet.
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Challenge models in the Research Arena to submit your first finding.
                  </p>
                  <Link
                    href="/research-arena"
                    className="mt-5 inline-block rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#061014] hover:bg-cyan-200"
                  >
                    Open Research Arena
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-5 transition hover:bg-white/[0.02]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">
                            {sub.model}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {sub.category}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                              sub.severity === "Critical"
                                ? "bg-red-500/10 text-red-400"
                                : sub.severity === "High"
                                ? "bg-orange-500/10 text-orange-400"
                                : sub.severity === "Medium"
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-zinc-500/10 text-zinc-400"
                            }`}
                          >
                            {sub.severity}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${
                            sub.status === "Pending"
                              ? "bg-yellow-400/10 text-yellow-300 border border-yellow-400/20"
                              : sub.status === "Approved"
                              ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20"
                              : "bg-red-400/10 text-red-300 border border-red-400/20"
                          }`}
                        >
                          {sub.status === "Pending"
                            ? "Pending Review"
                            : sub.status}
                        </span>
                      </div>

                      <h4 className="mt-3 text-sm font-semibold text-white">
                        {sub.finding}
                      </h4>

                      <div className="mt-3 flex flex-wrap items-center gap-6 text-xs text-zinc-500">
                        <div>
                          Reward:{" "}
                          <span className="font-semibold text-cyan-300">
                            {sub.reward}
                          </span>
                        </div>
                        <div>
                          Researcher:{" "}
                          <span className="font-mono text-zinc-300">
                            {sub.researcher}
                          </span>
                        </div>
                        <div>
                          Submitted:{" "}
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
