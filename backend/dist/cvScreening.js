"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractYearsFromText = extractYearsFromText;
exports.evaluateCvForJob = evaluateCvForJob;
function extractYearsFromText(text) {
    const normalized = text.toLowerCase();
    const found = [];
    for (const m of normalized.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b(?:\s+experience|\s+exp)?/gi)) {
        const n = Number(m[1]);
        if (!Number.isNaN(n))
            found.push(n);
    }
    for (const m of normalized.matchAll(/(?:experience|exp\.?)\s*[:\-]?\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)/gi)) {
        const n = Number(m[1]);
        if (!Number.isNaN(n))
            found.push(n);
    }
    return found.length ? Math.max(...found) : null;
}
function keywordExists(text, keyword) {
    return text.toLowerCase().includes(keyword.toLowerCase());
}
/**
 * Rule-based screening used by POST /api/chat/cv (same logic as Streamlit demo).
 */
function evaluateCvForJob(extractedText, jobTitle) {
    const text = extractedText.toLowerCase();
    const years = extractYearsFromText(extractedText);
    const reasons = [];
    const bonusHits = [];
    let bonusPoints = 0;
    if (jobTitle === 'Senior Full-Stack Developer') {
        if (!keywordExists(text, 'python'))
            reasons.push('Missing mandatory keyword: Python');
        if (!keywordExists(text, 'react'))
            reasons.push('Missing mandatory keyword: React');
        if (years === null || years < 5)
            reasons.push(`Experience requirement not met (need ≥ 5 years, found ${years ?? 'not detected'})`);
        if (keywordExists(text, 'aws')) {
            bonusPoints += 10;
            bonusHits.push('AWS (+10%)');
        }
        if (keywordExists(text, 'docker')) {
            bonusPoints += 10;
            bonusHits.push('Docker (+10%)');
        }
    }
    if (jobTitle === 'Talent Acquisition Lead (HR)') {
        const hasHrCert = /\bshrm\b/i.test(text) || /\bphri\b/i.test(text);
        if (!hasHrCert)
            reasons.push('Missing mandatory credential keyword: SHRM or PHRi');
        if (years === null || years < 4)
            reasons.push(`Experience requirement not met (need ≥ 4 years, found ${years ?? 'not detected'})`);
        if (keywordExists(text, 'payroll')) {
            bonusPoints += 10;
            bonusHits.push('Payroll (+10%)');
        }
        if (keywordExists(text, 'linkedin recruiter')) {
            bonusPoints += 10;
            bonusHits.push('LinkedIn Recruiter (+10%)');
        }
    }
    if (jobTitle === 'Senior Financial Analyst') {
        const hasFinCert = /\bcma\b/i.test(text) || /\bcfa\b/i.test(text);
        if (!hasFinCert)
            reasons.push('Missing mandatory credential keyword: CMA or CFA');
        if (years === null || years < 8)
            reasons.push(`Experience requirement not met (need ≥ 8 years, found ${years ?? 'not detected'})`);
        if (keywordExists(text, 'oracle') || keywordExists(text, 'sap')) {
            bonusPoints += 15;
            bonusHits.push('Oracle or SAP (+15%)');
        }
    }
    const approved = reasons.length === 0;
    const score = approved ? Math.min(100, 70 + bonusPoints) : null;
    return {
        jobTitle,
        approved,
        yearsDetected: years,
        reasons,
        bonusPoints,
        bonusHits,
        score,
    };
}
