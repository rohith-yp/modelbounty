"use client";

import type { Submission, SubmissionStatus } from "./data";
import { submissions as initialSubmissions } from "./data";

const STORAGE_KEY = "modelbounty-submissions";

function cloneInitialSubmissions(): Submission[] {
  return initialSubmissions.map((submission) => ({ ...submission }));
}

export function getStoredSubmissions(): Submission[] {
  if (typeof window === "undefined") {
    return cloneInitialSubmissions();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      const initial = cloneInitialSubmissions();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return cloneInitialSubmissions();
  } catch {
    return cloneInitialSubmissions();
  }
}

export function saveSubmissions(submissions: Submission[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(submissions)
  );

  window.dispatchEvent(new Event("modelbounty-submissions-updated"));
}

export function addSubmission(
  submission: Submission
): Submission {
  const current = getStoredSubmissions();

  const newSubmission = {
    ...submission,
  };

  saveSubmissions([...current, newSubmission]);

  return newSubmission;
}

export function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  reward?: string
): Submission | null {
  const current = getStoredSubmissions();

  let updatedSubmission: Submission | null = null;

  const updated = current.map((submission) => {
    if (submission.id !== submissionId) {
      return submission;
    }

    updatedSubmission = {
      ...submission,
      status,
      reward:
        reward !== undefined
          ? reward
          : status === "Rejected"
            ? "0.00 ETH"
            : submission.reward,
    };

    return updatedSubmission;
  });

  saveSubmissions(updated);

  return updatedSubmission;
}

export function getSubmissionById(
  submissionId: string
): Submission | undefined {
  return getStoredSubmissions().find(
    (submission) => submission.id === submissionId
  );
}

export function getStoredSubmissionsForBounty(
  bountyId: string
): Submission[] {
  return getStoredSubmissions().filter(
    (submission) => submission.bountyId === bountyId
  );
}

export function getStoredApprovedSubmissions(): Submission[] {
  return getStoredSubmissions().filter(
    (submission) => submission.status === "Approved"
  );
}

export function getPendingSubmissions(): Submission[] {
  return getStoredSubmissions().filter(
    (submission) => submission.status === "Pending"
  );
}

export function resetStoredSubmissions() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEY);

  const initial = cloneInitialSubmissions();

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(initial)
  );

  window.dispatchEvent(new Event("modelbounty-submissions-updated"));
}