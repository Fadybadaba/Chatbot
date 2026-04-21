"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHrRouter = createHrRouter;
const express_1 = require("express");
const approvedCvsStore_1 = require("./approvedCvsStore");
const ratingsStore_1 = require("./ratingsStore");
function requireHrDashboardPassword(req, res) {
    const expected = (process.env.HR_DASHBOARD_PASSWORD || '').trim();
    if (!expected) {
        res.status(500).json({
            error: 'HR dashboard password not configured (set HR_DASHBOARD_PASSWORD in backend/.env)',
        });
        return false;
    }
    const provided = String(req.header('x-hr-dashboard-password') || '').trim();
    if (!provided || provided !== expected) {
        res.status(401).json({ error: 'Invalid HR dashboard password' });
        return false;
    }
    return true;
}
function createHrRouter() {
    const router = (0, express_1.Router)();
    router.get('/auth-check', (req, res) => {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
            res.status(403).json({ error: 'Only HR can access the dashboard' });
            return;
        }
        if (!requireHrDashboardPassword(req, res))
            return;
        res.json({ ok: true });
    });
    router.get('/approved-cvs', (req, res, next) => {
        try {
            const role = req.user?.role;
            if (role !== 'hr' && role !== 'admin') {
                res.status(403).json({ error: 'Only HR can view approved CVs' });
                return;
            }
            if (!requireHrDashboardPassword(req, res))
                return;
            // Do not include raw PDF bytes in the listing response.
            res.json((0, approvedCvsStore_1.listApprovedCvs)().map(r => ({
                ...r,
                pdfBytes: undefined,
                pdfSha256: undefined,
            })));
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/approved-cvs/:id/pdf', (req, res, next) => {
        try {
            const role = req.user?.role;
            if (role !== 'hr' && role !== 'admin') {
                res.status(403).json({ error: 'Only HR can view approved CVs' });
                return;
            }
            if (!requireHrDashboardPassword(req, res))
                return;
            const record = (0, approvedCvsStore_1.getApprovedCvById)(String(req.params.id));
            if (!record) {
                res.status(404).json({ error: 'CV not found' });
                return;
            }
            res.setHeader('Content-Type', 'application/pdf');
            const wantsDownload = String(req.query.download || '') === '1';
            res.setHeader('Content-Disposition', `${wantsDownload ? 'attachment' : 'inline'}; filename=\"${record.fileName.replace(/\"/g, '')}\"`);
            res.send(record.pdfBytes);
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/chat-ratings/summary', async (req, res, next) => {
        try {
            const role = req.user?.role;
            if (role !== 'hr' && role !== 'admin') {
                res.status(403).json({ error: 'Only HR can view ratings' });
                return;
            }
            if (!requireHrDashboardPassword(req, res))
                return;
            res.json(await (0, ratingsStore_1.getChatRatingsSummary)());
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/chat-ratings', async (req, res, next) => {
        try {
            const role = req.user?.role;
            if (role !== 'hr' && role !== 'admin') {
                res.status(403).json({ error: 'Only HR can view ratings' });
                return;
            }
            if (!requireHrDashboardPassword(req, res))
                return;
            res.json(await (0, ratingsStore_1.listChatRatings)());
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/chat-ratings/export', async (req, res, next) => {
        try {
            const role = req.user?.role;
            if (role !== 'hr' && role !== 'admin') {
                res.status(403).json({ error: 'Only HR can view ratings' });
                return;
            }
            if (!requireHrDashboardPassword(req, res))
                return;
            const data = await (0, ratingsStore_1.listChatRatings)();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=\"chat_ratings.json\"');
            res.send(JSON.stringify(data, null, 2));
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
