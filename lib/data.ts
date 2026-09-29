export type BountyStatus = "Testing" | "Review" | "Closed";
export type SubmissionStatus = "Pending" | "Approved" | "Rejected";
export type Severity = "Low" | "Medium" | "High" | "Critical";

export type Bounty = {
  id: string;
  model: string;
  category: string;
  description: string;
  tests: number;
  findings: number;
  reward: string;
  status: BountyStatus;
  expectedBehaviour: string;
  testingRequirements: string[];
};

export type Submission = {
  id: string;
  bountyId: string;
  model: string;
  finding: string;
  category: string;
  severity: Severity;
  status: SubmissionStatus;
  reward: string;
  researcher: string;
  submitted: string;
  title?: string;
  description?: string;
  evidence?: string;
  reproduction?: string;
};

export const bounties: Bounty[] = [
  {
    id: "fraud-detect-v1",
    model: "FraudDetect V1",
    category: "Fraud Detection",
    description:
      "A machine learning model designed to identify potentially fraudulent financial transactions.",
    tests: 48,
    findings: 12,
    reward: "0.50 ETH",
    status: "Testing",
    expectedBehaviour:
      "The model should correctly identify suspicious financial transactions while avoiding false positives on legitimate transactions.",
    testingRequirements: [
      "Test unexpected or unusual transaction amounts.",
      "Look for inconsistent model behaviour.",
      "Test edge-case transaction patterns.",
      "Document reproducible failures with evidence.",
    ],
  },
  {
    id: "health-risk-classifier",
    model: "HealthRisk Classifier",
    category: "Healthcare ML",
    description:
      "A machine learning classifier designed to estimate health-risk categories from input features.",
    tests: 31,
    findings: 7,
    reward: "0.35 ETH",
    status: "Testing",
    expectedBehaviour:
      "The model should produce consistent predictions when similar valid inputs are provided.",
    testingRequirements: [
      "Test small variations in input features.",
      "Look for inconsistent predictions.",
      "Check behaviour around classification boundaries.",
      "Document reproducible failures with evidence.",
    ],
  },
  {
    id: "support-intent-ai",
    model: "SupportIntent AI",
    category: "NLP",
    description:
      "An NLP model designed to classify customer support messages into predefined intents.",
    tests: 19,
    findings: 4,
    reward: "0.20 ETH",
    status: "Review",
    expectedBehaviour:
      "The model should assign customer messages to the correct support intent, including ambiguous messages.",
    testingRequirements: [
      "Test ambiguous customer messages.",
      "Test variations in wording.",
      "Check inconsistent intent classification.",
      "Document reproducible failures with evidence.",
    ],
  },
];

export const submissions: Submission[] = [
  {
    id: "submission-001",
    bountyId: "fraud-detect-v1",
    model: "FraudDetect V1",
    finding:
      "Fraudulent transaction missed under unusual amount pattern",
    category: "Fraud Detection",
    severity: "High",
    status: "Approved",
    reward: "0.50 ETH",
    researcher: "0x7A...91F2",
    submitted: "2 hours ago",
  },
  {
    id: "submission-002",
    bountyId: "health-risk-classifier",
    model: "HealthRisk Classifier",
    finding:
      "Prediction changes unexpectedly after minor input variation",
    category: "Healthcare ML",
    severity: "Critical",
    status: "Rejected",
    reward: "0.00 ETH",
    researcher: "0x91...4B21",
    submitted: "5 hours ago",
  },
  {
    id: "submission-003",
    bountyId: "support-intent-ai",
    model: "SupportIntent AI",
    finding:
      "Intent classification fails on ambiguous customer messages",
    category: "NLP",
    severity: "Medium",
    status: "Pending",
    reward: "0.20 ETH",
    researcher: "0x42...A8D3",
    submitted: "Yesterday",
  },
];

export function getBountyById(id: string) {
  return bounties.find((bounty) => bounty.id === id);
}

export function getSubmissionsForBounty(bountyId: string) {
  return submissions.filter(
    (submission) => submission.bountyId === bountyId
  );
}

export function getApprovedSubmissions() {
  return submissions.filter(
    (submission) => submission.status === "Approved"
  );
}