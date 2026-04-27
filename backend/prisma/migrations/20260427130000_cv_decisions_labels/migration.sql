-- CreateTable
CREATE TABLE "cv_decisions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "job_title" TEXT NOT NULL,
    "predicted_approved" BOOLEAN NOT NULL,
    "predicted_reasons" JSONB NOT NULL,
    "candidate_email" TEXT,
    "score" INTEGER,
    "years_detected" INTEGER,
    "file_name" TEXT NOT NULL,
    "file_size_kb" INTEGER NOT NULL,
    "session_id" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "extracted_text_preview" TEXT NOT NULL,
    "pdf_sha256" TEXT NOT NULL,
    "expected_approved" BOOLEAN,
    "expected_missing_criteria" JSONB,
    "label_notes" TEXT,
    "labeled_at" TIMESTAMPTZ(6),
    "labeled_by_user_id" TEXT,

    CONSTRAINT "cv_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cv_decisions_created_at_idx" ON "cv_decisions"("created_at" DESC);

