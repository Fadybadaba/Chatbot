"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobsRouter = createJobsRouter;
const express_1 = require("express");
// In-memory sample jobs for discovery.
const sampleJobs = [
    {
        id: 'job_1',
        title: 'Backend Engineer',
        location: 'Berlin',
        department: 'Engineering',
        employmentType: 'full-time',
        status: 'open',
    },
    {
        id: 'job_2',
        title: 'HR Generalist',
        location: 'Remote',
        department: 'People',
        employmentType: 'full-time',
        status: 'open',
    },
];
function createJobsRouter() {
    const router = (0, express_1.Router)();
    // Public list of open jobs, for candidate job discovery.
    router.get('/', (req, res, next) => {
        try {
            const location = req.query.location?.toLowerCase();
            const filtered = sampleJobs.filter(job => {
                if (job.status !== 'open')
                    return false;
                if (location && !job.location.toLowerCase().includes(location)) {
                    return false;
                }
                return true;
            });
            res.json(filtered);
        }
        catch (err) {
            next(err);
        }
    });
    // Simple HR endpoint for creating a job. In a real system this would
    // persist to PostgreSQL and validate input carefully.
    router.post('/', (req, res, next) => {
        try {
            const userRole = req.user?.role;
            if (userRole !== 'hr' && userRole !== 'admin') {
                res.status(403).json({ error: 'Only HR can create jobs' });
                return;
            }
            const { title, location, department, employmentType } = req.body || {};
            if (!title || !location) {
                res.status(400).json({ error: 'title and location are required' });
                return;
            }
            const job = {
                id: `job_${Date.now()}`,
                title,
                location,
                department: department || 'General',
                employmentType: employmentType || 'full-time',
                status: 'open',
            };
            sampleJobs.push(job);
            res.status(201).json(job);
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
