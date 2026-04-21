"use strict";
/**
 * Automated evaluation of rule-based CV screening vs golden labels.
 * Usage: npm run eval:cv (from backend/)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cvScreening_1 = require("../cvScreening");
const goldenCvCases_1 = require("./goldenCvCases");
const recruitmentMetrics_1 = require("./recruitmentMetrics");
function confusion(expectedApproved, predictedApproved) {
    if (expectedApproved && predictedApproved)
        return 'TP';
    if (!expectedApproved && !predictedApproved)
        return 'TN';
    if (!expectedApproved && predictedApproved)
        return 'FP';
    return 'FN';
}
function main() {
    let tp = 0, tn = 0, fp = 0, fn = 0;
    const failures = [];
    for (const c of goldenCvCases_1.GOLDEN_CV_CASES) {
        const r = (0, cvScreening_1.evaluateCvForJob)(c.cvText, c.jobTitle);
        const cell = confusion(c.expectedApproved, r.approved);
        if (cell === 'TP')
            tp++;
        else if (cell === 'TN')
            tn++;
        else if (cell === 'FP')
            fp++;
        else
            fn++;
        if (r.approved !== c.expectedApproved) {
            failures.push(`[FAIL] ${c.id} (${c.jobTitle}): expected approved=${c.expectedApproved}, got ${r.approved}. Reasons: ${r.reasons.join('; ') || '(none)'}`);
        }
    }
    const n = tp + tn + fp + fn;
    const accuracy = n ? (tp + tn) / n : 0;
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    console.log('=== Recruitment CV rule engine — golden set evaluation ===\n');
    console.log(`Cases: ${n}`);
    console.log(`Confusion: TP=${tp} TN=${tn} FP=${fp} FN=${fn}`);
    console.log(`Accuracy:  ${accuracy.toFixed(4)}`);
    console.log(`Precision (approved): ${precision.toFixed(4)}`);
    console.log(`Recall (approved):    ${recall.toFixed(4)}`);
    console.log(`F1 (approved):        ${f1.toFixed(4)}`);
    console.log('\nMaps to metrics: RS-ACC (accuracy), RS-F1 (F1), RS-YEAR (implicit in case design).\n');
    if (failures.length) {
        console.log('--- Failures ---');
        failures.forEach(f => console.log(f));
        process.exitCode = 1;
    }
    else {
        console.log('All golden CV cases passed.\n');
    }
    console.log('--- Metric catalog (summary) ---');
    for (const m of recruitmentMetrics_1.RECRUITMENT_METRICS) {
        console.log(`[${m.id}] ${m.name} (${m.category})`);
    }
    console.log('\n--- Conversation rubric (manual / LLM-judge) ---');
    for (const r of recruitmentMetrics_1.CONVERSATION_RUBRIC) {
        console.log(`[${r.id}] ${r.scenario} → ${r.passCriteria}`);
    }
}
main();
