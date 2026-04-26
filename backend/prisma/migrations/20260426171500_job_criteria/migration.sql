-- CreateTable
CREATE TABLE "job_criteria" (
    "job_title" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "criteria" TEXT NOT NULL,

    CONSTRAINT "job_criteria_pkey" PRIMARY KEY ("job_title")
);

