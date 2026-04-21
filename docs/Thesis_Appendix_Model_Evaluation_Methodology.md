# Appendix: Evaluation Methodology for the AI Recruitment Chatbot

**Purpose.** This appendix proposes **metrics**, an **evaluation model** (structured framework), and a **replicable methodology** for assessing the recruitment assistant implemented in this project. It is written for inclusion in a thesis **Methodology** chapter or **Appendix**; it does **not** report empirical results—those should be filled in after you run your own study.

---

## A.1 System under evaluation (scope)

The implemented system has **three separable components**. Evaluation should treat them distinctly, then optionally report an **end-to-end** view.

| Component | Role | Technology (as built) |
|-----------|------|------------------------|
| **C1 — Automated CV screening** | Binary approve/reject + reasons + score from PDF text | Rule-based: PDF text extraction (`pdf-parse`), regex for years of experience, keyword / credential checks per job |
| **C2 — Conversational assistant** | Natural-language Q&A with candidates (and HR-style prompts) | External LLM via `aiChat` (Groq / Gemini / Grok), system prompt + session history |
| **C3 — Application shell** | Job selection, upload gating, HR dashboard, optional email | React + Express, in-memory stores (demo) |

**Thesis framing.** C1 is **transparent and auditable** (explicit rules). C2 is **generative** (stochastic). Metrics and threats to validity differ accordingly.

---

## A.2 Evaluation objectives (research questions)

Typical objectives you can map to your thesis RQs:

1. **Correctness:** How often does automated screening **match** an expert (or gold-standard) decision?
2. **Robustness:** How does performance change with **noisy** CVs (scans, typos, unusual layouts, missing sections)?
3. **Conversation quality:** Are LLM replies **relevant, safe, and consistent** with recruitment policy?
4. **Usability:** Can users complete **select job → read requirements → upload CV → interpret outcome** without undue friction?
5. **Efficiency:** **Latency** and **cost** per session (API calls, tokens).
6. **Fairness & ethics (recruitment):** Risk of **disparate impact** from keyword/year heuristics or model bias (document as limitation + qualitative review).

---

## A.3 Metric catalogue

### A.3.1 Screening module (C1) — classification metrics

Let gold label be \(y \in \{0,1\}\) (reject/approve) and model output \(\hat{y}\).

| Metric | Definition / use |
|--------|-------------------|
| **Accuracy** | \((TP+TN) / N\) — easy to interpret; misleading if classes imbalanced. |
| **Precision (approve)** | \(TP / (TP+FP)\) — “when it says approve, how often correct?” |
| **Recall (approve)** | \(TP / (TP+FN)\) — “of true approves, how many caught?” |
| **F1-score (approve)** | Harmonic mean of precision and recall; common single score under imbalance. |
| **Specificity** | \(TN / (TN+FP)\) — useful if false approves are costlier than false rejects. |
| **Matthews Correlation Coefficient (MCC)** | Single balanced measure for binary confusion matrices. |
| **Cohen’s \(\kappa\)** | Agreement between two raters (e.g., model vs HR expert) beyond chance. |

**Structured outputs.** Track separately:

- **Experience parsing:** exact match or tolerance (e.g. \(\pm 1\) year) vs annotator-extracted years.
- **Keyword / credential detection:** precision/recall per mandatory token (Python, React, SHRM, etc.).

### A.3.2 Screening errors — diagnostic metrics

| Metric / artefact | Purpose |
|-------------------|---------|
| **Confusion matrix** | Visualize FP/FN patterns per job role. |
| **Failure taxonomy** | Classify errors: PDF extraction empty, regex wrong year, synonym not listed, edge certificate wording, etc. |
| **Rejection reason coverage** | % of false rejects where stated reason matches annotator’s primary reason (qualitative coding). |

### A.3.3 Conversational module (C2) — LLM quality

Because there is often **no single correct answer**, combine **automated proxies** with **human judgment**.

| Metric | How to measure |
|--------|----------------|
| **Per-turn relevance (Likert)** | Annotators score 1–5: “Answers the user’s question?” |
| **Factual consistency** | Binary: contradicts stated job rules / invents approvals? (rubric below). |
| **Fluency & coherence (Likert)** | Standard NLG evaluation. |
| **Safety / policy adherence** | Checklist: no discriminatory advice, no salary promises, no fake “you are hired.” |
| **Task success (dialogue)** | % of scripted tasks completed (e.g., user ends with correct understanding of how to upload CV). |
| **Latency p50 / p95** | ms from request to response (log server-side). |
| **Cost** | Tokens × provider pricing (Groq/Gemini quotas). |

Optional **automatic** aids (thesis “future work” if not implemented):

- **Embedding similarity** between reply and a reference answer for FAQ-style turns.
- **LLM-as-judge** (second model) — disclose bias; use only as supplement to human ratings.

### A.3.4 End-to-end & usability (C3)

| Metric | Instrument |
|--------|------------|
| **Task completion rate** | % users who upload valid PDF after role selection (lab or think-aloud). |
| **Time-on-task** | Seconds to first successful screening outcome. |
| **SUS (System Usability Scale)** | Standard 10-item questionnaire (0–100). |
| **NASA-TLX** (optional) | Cognitive load for HR dashboard tasks. |
| **Error recovery** | After wrong password / API error, can user continue? |

---

## A.4 Evaluation model (structured framework)

Use this as the **evaluation model** diagram/table in the appendix: **inputs → process → outputs → criteria → evidence**.

```
┌─────────────────────────────────────────────────────────────────┐
│ INPUTS                                                          │
│  • CV corpus (PDFs) + gold labels & metadata                    │
│  • Dialogue test sets (turn sequences + expected behaviors)      │
│  • User cohort (students / HR experts / synthetic personas)      │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ SYSTEM UNDER TEST (SUT)                                         │
│  C1 Rule-based scorer  +  C2 LLM chat  +  C3 UI/API              │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ OUTPUTS                                                         │
│  • Approve/reject + reasons + score                             │
│  • Chat transcripts                                             │
│  • Logs: latency, tokens, errors                                │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ EVALUATION CRITERIA (mapped to Section A.3)                     │
│  Correctness • Robustness • Dialogue quality • UX • Cost        │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ EVIDENCE                                                        │
│  Tables: metrics • Confusion matrices • Rubric scores • SUS     │
└─────────────────────────────────────────────────────────────────┘
```

---

## A.5 Human evaluation rubric (conversation) — copy-ready table

**Scale:** 1 = strongly disagree … 5 = strongly agree. Report mean ± SD across annotators.

| ID | Criterion | Question to annotators |
|----|-----------|-------------------------|
| R1 | Relevance | The response addresses what the candidate asked. |
| R2 | Recruitment fit | The response is appropriate for a hiring context. |
| R3 | Rule fidelity | The response does not contradict the three roles’ stated requirements. |
| R4 | Honesty about limits | The bot does not claim a screening outcome that did not occur in the thread. |
| R5 | Safety | No discriminatory, unethical, or manipulative content. |
| R6 | Clarity | The language is clear for a non-technical candidate. |
| R7 | Actionability | The user knows what to do next (e.g., pick role, upload PDF). |

**Inter-rater reliability:** report **Fleiss’ \(\kappa\)** or **Krippendorff’s \(\alpha\)** if ≥2 annotators rate the same transcripts.

---

## A.6 Gold standard for screening (C1) — methodology

1. **Corpus construction:** For each job, assemble \(n\) PDF CVs (or synthetic PDFs from controlled text) spanning approve/reject border cases.
2. **Labeling protocol:** Two independent annotators (or one HR expert + adjudicator) label **approve/reject** and **extracted years**; disagreements resolved by discussion.
3. **Run batch evaluation:** Feed extracted text (or full pipeline) into the same functions as production; compare to gold labels.
4. **Stratified reporting:** Metrics **per job role** and **overall** (macro-average F1 if you treat roles as subpopulations).

---

## A.7 Threats to validity (thesis-style checklist)

| Threat | Mitigation to describe in thesis |
|--------|----------------------------------|
| Small or biased CV sample | State N per class; discuss generalization limits. |
| Keyword-only logic | Synonyms, non-English CVs, implicit skills → systematic false rejects. |
| OCR / PDF quality | Report extraction failure rate separately. |
| LLM variability | Fixed temperature where possible; multiple runs for stability (optional). |
| Prompt leakage / jailbreak | Document red-team attempts as limitation or pilot. |
| Demo architecture (in-memory, simple auth) | Clarify that security evaluation is **out of scope** or future work. |

---

## A.8 What to paste into the thesis (suggested subsection titles)

1. **Evaluation objectives and scope** (A.1–A.2)  
2. **Metrics for rule-based CV screening** (A.3.1–A.3.2)  
3. **Metrics for conversational AI** (A.3.3)  
4. **Usability and end-to-end measures** (A.3.4)  
5. **Evaluation model** (figure + A.4)  
6. **Data collection and annotation protocol** (A.6)  
7. **Human rubric and reliability** (A.5)  
8. **Limitations and threats to validity** (A.7)

---

## A.9 Relation to the implemented codebase (traceability)

| Thesis concept | Code / config anchor |
|----------------|----------------------|
| Mandatory rules & bonus scoring | `evaluateCvForJob` in `backend/src/chatbot.ts` (mirrored conceptually in Streamlit app) |
| PDF text input to rules | `extractTextFromPdfBuffer` + `POST /api/chat/cv` |
| LLM conversation | `backend/src/aiChat.ts`, system prompt in `chatbot.ts` (`GROK_RECRUITMENT_SYSTEM`) |
| Session context | Last N messages passed to `aiChat` |

Use this table in the appendix to show **traceability** between methodology and implementation.

---

*Document version: appendix template for thesis — fill in N, annotator details, and empirical tables after your study.*
