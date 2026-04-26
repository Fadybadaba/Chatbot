import { JobKey, sha256Pdf } from './approvedCvsStore';

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
};

// In-memory store for demo purposes.
const decisions: CvDecisionRecord[] = [];

export function addCvDecision(input: Omit<CvDecisionRecord, 'pdfSha256'> & { pdfBytes: Buffer }) {
  const pdfSha256 = sha256Pdf(input.pdfBytes);
  const record: CvDecisionRecord = { ...input, pdfSha256 };

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

