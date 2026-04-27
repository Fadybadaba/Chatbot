import { JobKey, sha256Pdf } from './approvedCvsStore';
import { getSupabaseAdmin } from './supabaseAdmin';

export type CvDecisionRecord = {
  id: string;
  createdAt: string;
  jobTitle: JobKey;
  approved: boolean;
  reasons: string[];
  candidateEmail: string | null;
  yearsDetected: number | null;
  score: number | null;
  fileName: string;
  fileSizeKb: number;
  sessionId: string;
  uploadedByUserId: string;
  extractedTextPreview: string;
  pdfSha256: string;
  expectedApproved?: boolean | null;
  expectedMissingCriteria?: string[] | null;
  labelNotes?: string | null;
  labeledAt?: string | null;
  labeledByUserId?: string | null;
};

// In-memory store for demo purposes.
const decisions: CvDecisionRecord[] = [];

export async function addCvDecision(
  input: Omit<
    CvDecisionRecord,
    | 'pdfSha256'
    | 'expectedApproved'
    | 'expectedMissingCriteria'
    | 'labelNotes'
    | 'labeledAt'
    | 'labeledByUserId'
  > & { pdfBytes: Buffer },
): Promise<void> {
  const pdfSha256 = sha256Pdf(input.pdfBytes);
  const record: CvDecisionRecord = { ...input, pdfSha256 };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from('cv_decisions').upsert({
      id: record.id,
      created_at: record.createdAt,
      job_title: record.jobTitle,
      predicted_approved: record.approved,
      predicted_reasons: record.reasons,
      candidate_email: record.candidateEmail,
      score: record.score,
      years_detected: record.yearsDetected,
      file_name: record.fileName,
      file_size_kb: record.fileSizeKb,
      session_id: record.sessionId,
      uploaded_by_user_id: record.uploadedByUserId,
      extracted_text_preview: record.extractedTextPreview,
      pdf_sha256: record.pdfSha256,
    });
    if (error) throw error;
    return;
  }

  // De-dupe by (jobTitle + pdf hash). Keep newest record.
  const key = `${record.jobTitle}:${record.pdfSha256}`;
  for (let i = decisions.length - 1; i >= 0; i--) {
    const d = decisions[i];
    if (`${d.jobTitle}:${d.pdfSha256}` === key) decisions.splice(i, 1);
  }
  decisions.unshift(record);
  if (decisions.length > 2000) decisions.length = 2000;
}

export function getCvDecisionsSummary(): {
  total: number;
  approved: number;
  rejected: number;
} {
  const total = decisions.length;
  const approved = decisions.filter(d => d.approved).length;
  return { total, approved, rejected: total - approved };
}

export async function listCvDecisions(limit = 200): Promise<CvDecisionRecord[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('cv_decisions')
      .select(
        'id, created_at, job_title, predicted_approved, predicted_reasons, candidate_email, score, years_detected, file_name, file_size_kb, session_id, uploaded_by_user_id, extracted_text_preview, pdf_sha256, expected_approved, expected_missing_criteria, label_notes, labeled_at, labeled_by_user_id',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id as string,
      createdAt: r.created_at as string,
      jobTitle: r.job_title as JobKey,
      approved: r.predicted_approved as boolean,
      reasons: (r.predicted_reasons as string[]) || [],
      candidateEmail: (r.candidate_email as string | null) ?? null,
      score: (r.score as number | null) ?? null,
      yearsDetected: (r.years_detected as number | null) ?? null,
      fileName: r.file_name as string,
      fileSizeKb: r.file_size_kb as number,
      sessionId: r.session_id as string,
      uploadedByUserId: r.uploaded_by_user_id as string,
      extractedTextPreview: r.extracted_text_preview as string,
      pdfSha256: r.pdf_sha256 as string,
      expectedApproved: (r.expected_approved as boolean | null) ?? null,
      expectedMissingCriteria: (r.expected_missing_criteria as string[] | null) ?? null,
      labelNotes: (r.label_notes as string | null) ?? null,
      labeledAt: (r.labeled_at as string | null) ?? null,
      labeledByUserId: (r.labeled_by_user_id as string | null) ?? null,
    }));
  }

  return decisions.slice(0, limit);
}

export async function labelCvDecision(params: {
  id: string;
  expectedApproved: boolean | null;
  expectedMissingCriteria: string[] | null;
  labelNotes: string | null;
  labeledByUserId: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from('cv_decisions').update({
      expected_approved: params.expectedApproved,
      expected_missing_criteria: params.expectedMissingCriteria,
      label_notes: params.labelNotes,
      labeled_at: now,
      labeled_by_user_id: params.labeledByUserId,
    }).eq('id', params.id);
    if (error) throw error;
    return;
  }

  const rec = decisions.find(d => d.id === params.id);
  if (!rec) return;
  rec.expectedApproved = params.expectedApproved;
  rec.expectedMissingCriteria = params.expectedMissingCriteria;
  rec.labelNotes = params.labelNotes;
  rec.labeledAt = now;
  rec.labeledByUserId = params.labeledByUserId;
}

export async function getCvAccuracyMetrics(): Promise<{
  labeledCount: number;
  confusion: { tp: number; fp: number; tn: number; fn: number };
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
}> {
  const list = await listCvDecisions(2000);
  const labeled = list.filter(d => d.expectedApproved === true || d.expectedApproved === false);
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const d of labeled) {
    const expected = Boolean(d.expectedApproved);
    const predicted = Boolean(d.approved);
    if (expected && predicted) tp++;
    else if (!expected && predicted) fp++;
    else if (!expected && !predicted) tn++;
    else fn++;
  }
  const n = labeled.length;
  const accuracy = n ? (tp + tn) / n : null;
  const precision = tp + fp ? tp / (tp + fp) : null;
  const recall = tp + fn ? tp / (tp + fn) : null;
  const f1 =
    precision !== null && recall !== null && precision + recall
      ? (2 * precision * recall) / (precision + recall)
      : null;
  return { labeledCount: n, confusion: { tp, fp, tn, fn }, accuracy, precision, recall, f1 };
}

