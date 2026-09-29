"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { bounties as staticBounties, type Bounty } from "@/lib/data";
import { fetchBountyById, fetchBounties, type BackendBounty } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function BountyDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadBounty() {
      // 1. Check static data first for fast load
      const staticFound = staticBounties.find(
        (b) =>
          b.id === id ||
          b.model.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase()
      );
      if (staticFound && isMounted) {
        setBounty(staticFound);
      }

      // 2. Fetch from backend API
      try {
        const backendBounty: BackendBounty | null = await fetchBountyById(id);
        if (backendBounty && isMounted) {
          const mapped: Bounty = {
            id: backendBounty.id,
            model: backendBounty.title || backendBounty.model_name,
            category: backendBounty.category,
            description: backendBounty.description,
            tests: backendBounty.finding_count ? backendBounty.finding_count * 4 : 20,
            findings: backendBounty.finding_count || 0,
            reward: backendBounty.reward,
            status: (backendBounty.status === "ACTIVE" ? "Testing" : backendBounty.status === "PAUSED" ? "Review" : "Closed") as "Testing" | "Review" | "Closed",
            expectedBehaviour: backendBounty.expected_behavior || "Expected normal model behavior",
            testingRequirements: backendBounty.testing_requirements ? backendBounty.testing_requirements.split("\n") : [
              "Test boundary parameters and edge cases.",
              "Document reproducible evidence of misbehavior."
            ],
          };
          setBounty(mapped);
          setLoading(false);
          return;
        }

        // 3. If not found by direct ID, search all backend bounties
        const allBounties = await fetchBounties();
        const foundInAll = allBounties.find(
          (b) =>
            b.id === id ||
            (b.title && b.title.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase()) ||
            (b.model_name && b.model_name.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase())
        );

        if (foundInAll && isMounted) {
          const mapped: Bounty = {
            id: foundInAll.id,
            model: foundInAll.title || foundInAll.model_name,
            category: foundInAll.category,
            description: foundInAll.description,
            tests: foundInAll.finding_count ? foundInAll.finding_count * 4 : 20,
            findings: foundInAll.finding_count || 0,
            reward: foundInAll.reward,
            status: (foundInAll.status === "ACTIVE" ? "Testing" : foundInAll.status === "PAUSED" ? "Review" : "Closed") as "Testing" | "Review" | "Closed",
            expectedBehaviour: foundInAll.expected_behavior || "Expected normal model behavior",
            testingRequirements: foundInAll.testing_requirements ? foundInAll.testing_requirements.split("\n") : [
              "Test boundary parameters and edge cases.",
              "Document reproducible evidence of misbehavior."
            ],
          };
          setBounty(mapped);
        }
      } catch {
        // Fallback already assigned
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBounty();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!bounty && !loading) {
    return (
      <main className="min-h-screen bg-[#07090d] text-white flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-white/[0.06] bg-[#090c11] p-8 text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            ModelBounty
          </div>
          <h1 className="mt-3 text-2xl font-bold">Bounty Not Found</h1>
          <p className="mt-2 text-sm text-zinc-500">
            The requested bounty challenge could not be found or has been moved.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
            >
              ← Back to Overview
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!bounty) {
    return (
      <main className="min-h-screen bg-[#07090d] text-white flex items-center justify-center p-6">
        <div className="text-xs text-zinc-500">Loading bounty details...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <section className="min-w-0 flex-1">
          <Navbar title={`Bounty / ${bounty.model}`} />

          <div className="mx-auto max-w-5xl p-6 lg:p-8">
            {/* Header info */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    {bounty.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                      bounty.status === "Testing"
                        ? "bg-cyan-300/10 text-cyan-300 border border-cyan-400/20"
                        : "bg-yellow-300/10 text-yellow-300 border border-yellow-400/20"
                    }`}
                  >
                    {bounty.status}
                  </span>
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  {bounty.model}
                </h1>
                <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
                  {bounty.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                <Link
                  href={`/research-arena?challenge=${bounty.id}`}
                  className="rounded-lg bg-cyan-300 px-5 py-2.5 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
                >
                  Challenge Model →
                </Link>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">
                  Category
                </div>
                <div className="mt-2 text-base font-semibold text-white">
                  {bounty.category}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">
                  Tests Conducted
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {bounty.tests}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">
                  Verified Findings
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {bounty.findings}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-5">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">
                  Bounty Reward
                </div>
                <div className="mt-2 text-2xl font-bold text-cyan-300">
                  {bounty.reward}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="mt-8 space-y-6">
              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                  Expected Behaviour
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  {bounty.expectedBehaviour}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#090c11] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                  Testing Requirements & Scope
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {bounty.testingRequirements.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-zinc-300"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-[10px] font-semibold text-cyan-300">
                        {index + 1}
                      </span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#090c11] p-6">
                <div>
                  <div className="text-sm font-medium text-white">
                    Ready to challenge {bounty.model}?
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Open testing arena to submit reproducible evidence of unexpected behavior.
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/research-arena?challenge=${bounty.id}`}
                    className="rounded-lg bg-cyan-300 px-5 py-2.5 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
                  >
                    Challenge Model in Arena →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
