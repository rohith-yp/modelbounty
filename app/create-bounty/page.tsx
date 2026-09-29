"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function CreateBountyPage() {
  const [submitted, setSubmitted] = useState(false);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Navbar title="Create Bounty" />

          <div className="mx-auto max-w-4xl p-6 lg:p-8">
            <div className="mb-8">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Model Owner Portal
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Publish a New Model Bounty
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Register an AI model, define the verification boundaries, and fund a reward pool for independent researchers.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  ✓
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">
                  Bounty Successfully Published
                </h3>
                <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
                  Your bounty campaign for <span className="text-white font-medium">{form.modelName || "New Model"}</span> has been recorded. Independent researchers can now inspect the model in the Research Arena.
                </p>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <Link
                    href="/my-bounties"
                    className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#061014] hover:bg-cyan-200 transition"
                  >
                    View My Bounties
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
                    className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 hover:text-white transition"
                  >
                    Create Another Bounty
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-2xl border border-white/[0.06] bg-[#090c11] p-6 lg:p-8"
              >
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                    Model Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.modelName}
                    onChange={(e) => updateField("modelName", e.target.value)}
                    placeholder="e.g. FraudDetect V2"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                      Model Category
                    </label>
                    <select
                      value={form.modelType}
                      onChange={(e) => updateField("modelType", e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0d1219] px-4 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                    >
                      <option value="Machine Learning">Machine Learning</option>
                      <option value="Fraud Detection">Fraud Detection</option>
                      <option value="Healthcare ML">Healthcare ML</option>
                      <option value="NLP">NLP</option>
                      <option value="Computer Vision">Computer Vision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                      Reward Pool (ETH)
                    </label>
                    <input
                      type="text"
                      required
                      value={form.reward}
                      onChange={(e) => updateField("reward", e.target.value)}
                      placeholder="e.g. 0.50 ETH"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe what the model does, its operational domain, and context..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                    Expected Behavior Specification
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={form.expectedBehavior}
                    onChange={(e) =>
                      updateField("expectedBehavior", e.target.value)
                    }
                    placeholder="Describe how the model is expected to behave under normal and boundary conditions..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                    Testing Scope & Verification Guidelines
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.testingScope}
                    onChange={(e) =>
                      updateField("testingScope", e.target.value)
                    }
                    placeholder="List specific edge cases, adversarial vectors, or invalid scenarios researchers should test..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-6">
                  <Link
                    href="/my-bounties"
                    className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    className="rounded-lg bg-cyan-300 px-5 py-2.5 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
                  >
                    Deploy Bounty Campaign →
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
