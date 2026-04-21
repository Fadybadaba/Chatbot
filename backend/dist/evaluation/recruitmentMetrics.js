"use strict";
/**
 * Recruitment chatbot evaluation framework: suggested metrics and rubric items.
 * Run automated rule checks: `npm run eval:cv` (from backend/).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONVERSATION_RUBRIC = exports.RECRUITMENT_METRICS = void 0;
/**
 * Core metrics aligned with your stack: rule-based CV screen + optional LLM chat (Groq/Gemini/Grok).
 */
exports.RECRUITMENT_METRICS = [
    {
        id: 'RS-ACC',
        category: 'rule_screening',
        name: 'Golden-set accuracy (approve/reject)',
        description: 'Share of labeled CV snippets where rule engine matches expected APPROVED vs REJECTED for the given job.',
        howToMeasure: 'Run `npm run eval:cv` on golden_cv_cases; report overall accuracy.',
        suggestedTarget: '≥ 0.95 on curated golden set',
    },
    {
        id: 'RS-F1',
        category: 'rule_screening',
        name: 'F1 score (positive class = APPROVED)',
        description: 'Harmonic mean of precision and recall for approvals; catches imbalance.',
        howToMeasure: 'Computed in eval runner from TP/FP/FN/TN vs expected labels.',
        suggestedTarget: '≥ 0.90 per job family on golden set',
    },
    {
        id: 'RS-YEAR',
        category: 'rule_screening',
        name: 'Experience extraction sanity',
        description: 'Years-of-experience parser picks plausible max from noisy CV text.',
        howToMeasure: 'Spot-check golden cases with edge phrases; optional dedicated year-parse tests.',
        suggestedTarget: 'No systematic under-read on listed patterns',
    },
    {
        id: 'LLM-REL',
        category: 'conversational_llm',
        name: 'Response relevance (human or LLM-as-judge)',
        description: 'Assistant answers address the user question and stay on recruitment topics.',
        howToMeasure: 'Sample N dialogs; score 1–5 rubric or use a second model as judge.',
        suggestedTarget: 'Mean ≥ 4/5 on sample',
    },
    {
        id: 'LLM-FACT',
        category: 'conversational_llm',
        name: 'Grounding / no false screening claims',
        description: 'Model does not invent pass/fail before a real screening message exists.',
        howToMeasure: 'Adversarial prompts + review logs; count violations.',
        suggestedTarget: '0 critical violations per 100 prompts',
    },
    {
        id: 'LLM-BTN',
        category: 'conversational_llm',
        name: 'Job button marker compliance',
        description: 'When listing roles, reply includes exact `[JOB_BUTTONS:...]` line for UI.',
        howToMeasure: 'Regex check on responses to greeting / “what jobs” prompts.',
        suggestedTarget: '≥ 95% on scripted triggers',
    },
    {
        id: 'PIPE-LAT',
        category: 'pipeline',
        name: 'p95 chat latency',
        description: 'Time from POST /api/chat/messages to response body.',
        howToMeasure: 'Load tool or simple script with timestamps.',
        suggestedTarget: '< 3s p95 with LLM; < 500ms without',
    },
    {
        id: 'PIPE-CV',
        category: 'pipeline',
        name: 'CV upload success rate',
        description: 'Valid PDFs under size limit complete without 5xx.',
        howToMeasure: 'Integration tests or manual matrix (size, corrupt, non-PDF).',
        suggestedTarget: '100% on valid inputs',
    },
    {
        id: 'SEC-HR',
        category: 'security_compliance',
        name: 'HR dashboard access control',
        description: 'Approved CV list and PDFs require HR role + password.',
        howToMeasure: 'Negative tests without headers / wrong password.',
        suggestedTarget: '401/403 on all unauthorized paths',
    },
];
/** Manual or semi-automated checks for the conversational layer. */
exports.CONVERSATION_RUBRIC = [
    {
        id: 'C1',
        scenario: 'User: "Hi"',
        passCriteria: 'Warm reply; lists or points to three roles; includes JOB_BUTTONS line when appropriate.',
    },
    {
        id: 'C2',
        scenario: 'User: "What jobs do you have?"',
        passCriteria: 'Names all three roles; JOB_BUTTONS present; no invented company facts.',
    },
    {
        id: 'C3',
        scenario: 'User: "Was I approved?" (no prior screening in thread)',
        passCriteria: 'Explains screening happens after PDF upload; no fake approval.',
    },
    {
        id: 'C4',
        scenario: 'User selects exact job title button text',
        passCriteria: 'Requirements match published rules (years, keywords, bonuses).',
    },
    {
        id: 'C5',
        scenario: 'Off-topic question (e.g. general knowledge)',
        passCriteria: 'Brief helpful answer if safe; steers back to application without being rude.',
    },
];
