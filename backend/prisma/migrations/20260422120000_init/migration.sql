-- CreateTable
CREATE TABLE "chat_ratings" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,

    CONSTRAINT "chat_ratings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_ratings_stars_check" CHECK ("stars" >= 1 AND "stars" <= 5)
);

-- CreateTable
CREATE TABLE "approved_cvs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "job_title" TEXT NOT NULL,
    "candidate_email" TEXT,
    "score" INTEGER,
    "years_detected" INTEGER,
    "file_name" TEXT NOT NULL,
    "file_size_kb" INTEGER NOT NULL,
    "session_id" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "extracted_text_preview" TEXT NOT NULL,
    "pdf_sha256" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL DEFAULT 'approved-cvs',
    "storage_path" TEXT NOT NULL,

    CONSTRAINT "approved_cvs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_ratings_created_at_idx" ON "chat_ratings"("created_at" DESC);

-- CreateIndex
CREATE INDEX "approved_cvs_created_at_idx" ON "approved_cvs"("created_at" DESC);
