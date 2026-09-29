"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { createBounty } from "@/lib/api";

export default function CreateBountyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    modelName: "",
    modelType: "Machine Learning",
    description: "",
    expectedBehavior: "",
    testingScope: "",
    reward: "",
    duration: "7 days",
  });

  function updateField(field: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const rewardFormatted = form.reward.trim().toUpperCase().endsWith("ETH")
        ? form.reward.trim()
        : `${form.reward.trim()} ETH`;

      await createBounty({
        title: form.modelName.trim(),
        model_name: form.modelName.trim(),
        model_version: "1.0.0",
        category: form.modelType,
        reward: rewardFormatted,
        description: form.description.trim(),
        expected_behavior: form.expectedBehavior.trim(),
        testing_requirements: form.testingScope.trim(),
        owner_id: "user-owner",
      });

      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to publish bounty. Please ensure the backend is connected.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0C0D10] text-[#EDEDF0]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Navbar title="Create Bounty" />

          <div className="mx-auto max-w-4xl p-6 lg:p-8">
            {/* Header Telemetry */}
            <div className="border-b border-[#232732] pb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase">
                  01 // MODEL OWNER PORTAL // ESCROW VAULT CREATION
                </span>
                <span className="inline-block h-1 w-1 rounded-full bg-[#E09F3E]" />
                <span className="font-mono text-[10px] text-zinc-500 uppercase">
                  SMART ESCROW ATTESTATION
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Publish Model Bounty Campaign
              </h1>

              <p className="mt-1 text-xs text-zinc-400">
                Register an AI model, define the verification boundaries and ground-truth invariants, and lock a cryptographic bounty reward for security researchers.
              </p>
            </div>

            {submitted ? (
              <div className="mt-8 border border-emerald-500/30 bg-[#13151B] p-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-emerald-500/40 bg-emerald-500/10 font-mono text-emerald-400 text-lg font-bold">
                  ✓
                </div>
                <h2 className="mt-4 text-base font-semibold text-white">
                  Bounty Vault Successfully Initialized
                </h2>
                <p className="mt-2 text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  Your bounty campaign for <span className="text-white font-medium">{form.modelName || "New Model"}</span> has been recorded on the consensus ledger. Security researchers can now examine the specimen in the Research Arena.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3 font-mono text-xs">
                  <Link
                    href="/my-bounties"
                    className="rounded border border-[#E09F3E] bg-[#E09F3E] px-4 py-2 font-semibold text-black hover:bg-[#E09F3E]/90 transition"
                  >
                    View My Bounties →
                  </Link>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({
                        modelName: "",
                        modelType: "Machine Learning",
                        description: "",
                        expectedBehavior: "",
                        testingScope: "",
                        reward: "",
                        duration: "7 days",
                      });
                    }}
                    className="rounded border border-[#232732] bg-[#0C0D10] px-4 py-2 text-zinc-300 hover:text-white transition"
                  >
                    Deploy Another Bounty
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-6 border border-[#232732] bg-[#13151B] p-6 lg:p-8"
              >
                {errorMsg && (
                  <div className="border border-red-500/30 bg-red-950/20 p-4 font-mono text-xs text-red-300">
                    ERROR: {errorMsg}
                  </div>
                )}

                {/* Section 02: Model Specs & Reward Pool */}
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase block mb-3">
                    02 // MODEL REGISTRATION & REWARD POOL
                  </span>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                        Model Name / Identifier
                      </label>
                      <input
                        type="text"
                        required
                        value={form.modelName}
                        onChange={(e) => updateField("modelName", e.target.value)}
                        placeholder="e.g. FraudDetect V2"
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2.5 font-mono text-xs text-white placeholder-zinc-600 focus:border-[#E09F3E] focus:outline-none"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                          Domain Category
                        </label>
                        <select
                          value={form.modelType}
                          onChange={(e) => updateField("modelType", e.target.value)}
                          className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2.5 font-mono text-xs text-zinc-200 focus:border-[#E09F3E] focus:outline-none"
                        >
                          <option value="Machine Learning">Machine Learning</option>
                          <option value="Fraud Detection">Fraud Detection</option>
                          <option value="Healthcare ML">Healthcare ML</option>
                          <option value="NLP">NLP</option>
                          <option value="Computer Vision">Computer Vision</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                          Escrow Bounty Reward (ETH)
                        </label>
                        <input
                          type="text"
                          required
                          value={form.reward}
                          onChange={(e) => updateField("reward", e.target.value)}
                          placeholder="e.g. 0.50 ETH"
                          className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2.5 font-mono text-xs text-white placeholder-zinc-600 focus:border-[#E09F3E] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 03: Description & Behavior */}
                <div className="border-t border-[#232732] pt-6">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase block mb-3">
                    03 // MODEL OVERVIEW & GROUND-TRUTH INVARIANTS
                  </span>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                        Operational Description & Context
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={form.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        placeholder="Describe what the model does, its operational domain, feature space, and architecture..."
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-[#E09F3E] focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                        Expected Ground-Truth Behavior (Invariants)
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={form.expectedBehavior}
                        onChange={(e) =>
                          updateField("expectedBehavior", e.target.value)
                        }
                        placeholder="Describe how the model must perform under boundary inputs and edge conditions..."
                        className="w-full rounded border border-[#232732] bg-[#0C0D10] px-3.5 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-[#E09F3E] focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 04: Testing Scope */}
                <div className="border-t border-[#232732] pt-6">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#E09F3E] uppercase block mb-3">
                    04 // RESEARCH SCOPE & VERIFICATION GUIDELINES
                  </span>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                      Adversarial Scope & Target Vectors
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={form.testingScope}
                      onChange={(e) =>
                        updateField("testingScope", e.target.value)
                      }
                      placeholder="List specific edge cases, perturbation boundaries, payload limits, or out-of-scope conditions..."
                      className="w-full rounded border border-[#232732] bg-[#0C0D10] p-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-[#E09F3E] focus:outline-none font-mono leading-relaxed"
                    />
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between border-t border-[#232732] pt-6">
                  <Link
                    href="/my-bounties"
                    className="rounded border border-[#232732] bg-[#0C0D10] px-4 py-2 font-mono text-xs text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded border border-[#E09F3E] bg-[#E09F3E] px-5 py-2.5 font-mono text-xs font-semibold text-black transition hover:bg-[#E09F3E]/90 disabled:opacity-50"
                  >
                    <span>{loading ? "INITIALIZING ESCROW VAULT..." : "INITIALIZE BOUNTY CAMPAIGN"}</span>
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
