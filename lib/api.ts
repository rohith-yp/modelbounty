export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api" : "http://127.0.0.1:8000/api");

export interface AIAnalysisDetails {
  severity: string;
  confidence: number;
  classification: string;
  summary: string;
  reasoning: string;
  potential_impact: string;
  evidence_assessment: string;
  reproduction_assessment: string;
  recommended_validation_checks: string[];
}

export interface AIAnalysisResponse {
  id: string;
  finding_id: string;
  provider: string;
  model: string;
  analysis_type?: string;
  confidence: number;
  created_at: string;
  result?: string;
  analysis?: AIAnalysisDetails;
  severity?: string;
  classification?: string;
  summary?: string;
  reasoning?: string;
  potential_impact?: string;
  evidence_assessment?: string;
  reproduction_assessment?: string;
  recommended_validation_checks?: string[];
}

export interface BackendFinding {
  id: string;
  bounty_id: string;
  researcher_id: string;
  finding_title: string;
  severity: string;
  what_happened: string;
  evidence: string;
  reproduction_steps: string;
  expected_behavior: string;
  actual_behavior: string;
  status: string;
  reward: string;
  created_at: string;
  updated_at: string;
  bounty_title?: string;
  model_name?: string;
  researcher_name?: string;
}

export interface BackendBounty {
  id: string;
  title: string;
  description: string;
  model_name: string;
  model_version: string;
  category: string;
  reward: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | string;
  expected_behavior?: string | null;
  testing_requirements?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  finding_count: number;
}

export interface CreateBountyPayload {
  title: string;
  description: string;
  model_name: string;
  model_version?: string;
  category: string;
  reward: string;
  expected_behavior?: string;
  testing_requirements?: string;
  owner_id?: string;
}

export interface CreateFindingPayload {
  bounty_id: string;
  researcher_id?: string;
  finding_title: string;
  severity: string;
  what_happened: string;
  evidence: string;
  reproduction_steps: string;
  expected_behavior?: string;
  actual_behavior?: string;
  reward?: string;
}

export interface DashboardStatsData {
  active_bounties: number;
  total_bounties: number;
  total_findings: number;
  pending_findings: number;
  approved_findings: number;
  rejected_findings: number;
  total_rewards: string;
  distributed_rewards: string;
  verification_rate: string;
}

// --- Dashboard Functions ---
export async function fetchDashboardStats(): Promise<DashboardStatsData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// --- Bounty Functions ---
export async function fetchBounties(): Promise<BackendBounty[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/bounties`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchBountyById(bountyId: string): Promise<BackendBounty | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/bounties/${encodeURIComponent(bountyId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createBounty(payload: CreateBountyPayload): Promise<BackendBounty> {
  const body = {
    title: payload.title,
    description: payload.description,
    model_name: payload.model_name,
    model_version: payload.model_version || "1.0.0",
    category: payload.category,
    reward: payload.reward,
    status: "ACTIVE",
    expected_behavior: payload.expected_behavior || "",
    testing_requirements: payload.testing_requirements || "",
    owner_id: payload.owner_id || "user-owner",
  };

  const res = await fetch(`${API_BASE_URL}/bounties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || `Failed to create bounty (${res.status})`);
  }

  return await res.json();
}

// --- Finding Submission Functions ---
export async function submitFinding(payload: CreateFindingPayload): Promise<BackendFinding> {
  const body = {
    bounty_id: payload.bounty_id,
    researcher_id: payload.researcher_id || "user-researcher",
    finding_title: payload.finding_title,
    severity: payload.severity.toUpperCase(),
    what_happened: payload.what_happened,
    evidence: payload.evidence,
    reproduction_steps: payload.reproduction_steps,
    expected_behavior: payload.expected_behavior || "Expected normal model output",
    actual_behavior: payload.actual_behavior || payload.what_happened,
    reward: payload.reward || "0.50 ETH",
  };

  const res = await fetch(`${API_BASE_URL}/findings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || `Failed to submit finding (${res.status})`);
  }

  return await res.json();
}

// --- Findings Query Functions ---
export async function getBackendFindings(): Promise<BackendFinding[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/findings`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export const fetchFindings = getBackendFindings;

export async function getFindingById(findingId: string): Promise<BackendFinding | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/findings/${encodeURIComponent(findingId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// --- AI Analysis Functions ---
export async function getAIAnalysis(findingId: string): Promise<AIAnalysisResponse> {
  let res: Response;
  try {
    const url = `${API_BASE_URL}/findings/${encodeURIComponent(findingId)}/ai-analysis`;
    res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new Error("Unable to connect to backend server. Please check your network connection.");
  }

  if (res.status === 404) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || "No AI analysis is available for this finding yet.";
    const err = new Error(message);
    (err as unknown as { status: number }).status = 404;
    throw err;
  }

  if (res.status === 429) {
    throw new Error("Groq AI rate limit reached. Please wait a moment before trying again.");
  }

  if (res.status >= 500) {
    throw new Error("Groq AI is currently unavailable.");
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || `AI analysis request failed with status ${res.status}`);
  }

  const data: AIAnalysisResponse = await res.json();
  if (!data.analysis && data.result) {
    try {
      data.analysis = JSON.parse(data.result);
    } catch {
      // Ignore JSON parse error if invalid string
    }
  }

  if (data.analysis) {
    data.severity = data.analysis.severity;
    data.classification = data.analysis.classification;
    data.summary = data.analysis.summary;
    data.reasoning = data.analysis.reasoning;
    data.potential_impact = data.analysis.potential_impact;
    data.evidence_assessment = data.analysis.evidence_assessment;
    data.reproduction_assessment = data.analysis.reproduction_assessment;
    data.recommended_validation_checks = data.analysis.recommended_validation_checks;
  }

  return data;
}

export async function runAIAnalysis(findingId: string): Promise<AIAnalysisResponse> {
  let res: Response;
  try {
    const url = `${API_BASE_URL}/findings/${encodeURIComponent(findingId)}/ai-analysis`;
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new Error("Unable to connect to backend server. Please check your network connection.");
  }

  if (res.status === 404) {
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData.detail || "Finding not found in database.");
    (err as unknown as { status: number }).status = 404;
    throw err;
  }

  if (res.status === 429) {
    throw new Error("Groq AI rate limit reached. Please wait a moment before re-running.");
  }

  if (res.status >= 500) {
    throw new Error("Groq AI is currently unavailable.");
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || "AI analysis could not be generated. Please try again.");
  }

  const data: AIAnalysisResponse = await res.json();
  if (!data.analysis && data.result) {
    try {
      data.analysis = JSON.parse(data.result);
    } catch {
      // Ignore
    }
  }

  if (data.analysis) {
    data.severity = data.analysis.severity;
    data.classification = data.analysis.classification;
    data.summary = data.analysis.summary;
    data.reasoning = data.analysis.reasoning;
    data.potential_impact = data.analysis.potential_impact;
    data.evidence_assessment = data.analysis.evidence_assessment;
    data.reproduction_assessment = data.analysis.reproduction_assessment;
    data.recommended_validation_checks = data.analysis.recommended_validation_checks;
  }

  return data;
}

// --- ML Model Interfaces & Functions ---
export interface ModelHealth {
  model_id: string;
  model_name: string;
  framework: string;
  model_type: string;
  status: "READY" | "UNAVAILABLE" | string;
}

export interface FraudPredictionInputData {
  amount: number;
  frequency_24h: number;
  account_age_days: number;
  ip_risk_score: number;
  device_risk_score: number;
  new_ip: number;
  international: number;
}

export interface FraudPredictionResult {
  model_name: string;
  prediction: "FRAUD" | "LEGITIMATE" | string;
  prediction_value: number;
  fraud_probability: number;
}

export interface VerificationData {
  id: string;
  finding_id: string;
  model_id: string;
  model_name: string;
  prediction: string;
  prediction_value: number;
  fraud_probability: number;
  execution_time_ms?: number;
  verification_status: string;
  reproduced: number;
  input_data?: string;
  created_at: string;
}

export async function getModelHealth(
  modelId: string = "fraud-detect-v1"
): Promise<ModelHealth> {
  const url = `${API_BASE_URL}/models/${encodeURIComponent(modelId)}/health`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new Error("Unable to connect to backend server. Please check your network connection.");
  }

  if (res.status === 404) {
    throw new Error(`Model '${modelId}' not found.`);
  }

  if (res.status >= 500) {
    throw new Error("Model service is currently unavailable.");
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || `Model health check failed (${res.status})`);
  }

  return await res.json();
}

export async function predictModel(
  modelId: string,
  payload: FraudPredictionInputData
): Promise<FraudPredictionResult> {
  const url = `${API_BASE_URL}/models/${encodeURIComponent(modelId)}/predict`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Unable to connect to backend server. Please check your network connection.");
  }

  if (res.status === 404) {
    throw new Error(`Model '${modelId}' not found or does not support prediction.`);
  }

  if (res.status === 422) {
    const errJson = await res.json().catch(() => ({}));
    const detailMsg = Array.isArray(errJson.detail)
      ? errJson.detail.map((d: { msg: string; loc?: string[] }) => d.msg).join(", ")
      : errJson.detail || "Invalid input parameters.";
    throw new Error(`Validation Error: ${detailMsg}`);
  }

  if (res.status >= 500) {
    throw new Error("Prediction service error or model unavailable.");
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || `Prediction failed (${res.status})`);
  }

  return await res.json();
}

export async function predictFraud(
  inputData: FraudPredictionInputData,
  modelId: string = "fraud-detect-v1"
): Promise<FraudPredictionResult> {
  return predictModel(modelId, inputData);
}

// --- Finding Verification Functions ---
export async function verifyFinding(
  findingId: string,
  payload?: Record<string, unknown>
): Promise<VerificationData> {
  const url = `${API_BASE_URL}/findings/${encodeURIComponent(findingId)}/verify`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ? { custom_payload: payload } : {}),
    });
  } catch {
    throw new Error("Unable to connect to backend server for verification.");
  }

  if (res.status === 404) {
    throw new Error(`Finding '${findingId}' not found.`);
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || `Verification failed (${res.status})`);
  }

  return await res.json();
}

export async function getVerification(
  findingId: string
): Promise<VerificationData | null> {
  const url = `${API_BASE_URL}/findings/${encodeURIComponent(findingId)}/verification`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getVerificationHistory(
  findingId: string
): Promise<VerificationData[]> {
  const url = `${API_BASE_URL}/findings/${encodeURIComponent(findingId)}/verification/history`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// --- Approval / Rejection Functions ---
export async function approveFinding(
  findingId: string,
  validatorId: string = "user-validator",
  comment?: string
): Promise<BackendFinding> {
  const url = `${API_BASE_URL}/findings/${encodeURIComponent(findingId)}/approve`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      validator_id: validatorId,
      comment: comment || "Approved by validator",
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || `Approval failed with status ${res.status}`);
  }

  return await res.json();
}

export async function rejectFinding(
  findingId: string,
  validatorId: string = "user-validator",
  comment?: string
): Promise<BackendFinding> {
  const url = `${API_BASE_URL}/findings/${encodeURIComponent(findingId)}/reject`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      validator_id: validatorId,
      comment: comment || "Rejected by validator",
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || `Rejection failed with status ${res.status}`);
  }

  return await res.json();
}

export async function getRewards(): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/rewards`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
