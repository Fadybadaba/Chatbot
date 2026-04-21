"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addApprovedCv = addApprovedCv;
exports.listApprovedCvs = listApprovedCvs;
exports.getApprovedCvById = getApprovedCvById;
exports.sha256Pdf = sha256Pdf;
const crypto_1 = __importDefault(require("crypto"));
// In-memory store for demo purposes.
const approvedCvs = [];
function addApprovedCv(record) {
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
    if (approvedCvs.length > 200)
        approvedCvs.length = 200;
}
function listApprovedCvs() {
    return approvedCvs;
}
function getApprovedCvById(id) {
    return approvedCvs.find(r => r.id === id);
}
function sha256Pdf(buffer) {
    return crypto_1.default.createHash('sha256').update(buffer).digest('hex');
}
