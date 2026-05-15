import crypto from 'crypto';

export type JobKey =
  | 'Senior Full-Stack Developer'
  | 'Talent Acquisition Lead (HR)'
  | 'Senior Financial Analyst';

export interface ApprovedCvRecord {
  id: string;
  createdAt: string;
  jobTitle: JobKey;
  candidateEmail: string | null;
  score: number | null;
  yearsDetected: number | null;
  fileName: string;
  fileSizeKb: number;
  sessionId: string;
  uploadedByUserId: string;
  extractedTextPreview: string;
  pdfBytes: Buffer;
  pdfSha256: string;
}

// In-memory store for demo purposes.
const approvedCvs: ApprovedCvRecord[] = [];

export function addApprovedCv(record: ApprovedCvRecord): void {
  // De-dupe by (jobTitle + pdf hash). If the same CV is approved multiple times,
  // we keep only the newest record.
  const key = `${record.jobTitle}:${record.pdfSha256}`;
  for (let i = approvedCvs.length - 1; i >= 0; i--) {
    const existing = approvedCvs[i];
    const existingKey = `${existing.jobTitle}:${existing.pdfSha256}`;
    if (existingKey === key) {
      approvedCvs.splice(i, 1);
    }
  }

  approvedCvs.unshift(record);
  // Keep last 200 to avoid unbounded growth in dev.
  if (approvedCvs.length > 200) approvedCvs.length = 200;
}

export function listApprovedCvs(): ApprovedCvRecord[] {
  return approvedCvs;
}

export function getApprovedCvById(id: string): ApprovedCvRecord | undefined {
  return approvedCvs.find(r => r.id === id);
}

export function sha256Pdf(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

