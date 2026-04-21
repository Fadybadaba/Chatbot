"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const express_1 = require("express");
const simpleAuth_1 = require("./simpleAuth");
const chatbot_1 = require("./chatbot");
const jobs_1 = require("./jobs");
const hr_1 = require("./hr");
function registerRoutes(app) {
    // Basic health endpoint
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });
    // Attach minimal auth shim so req.user is available.
    app.use(simpleAuth_1.attachAuthMiddleware);
    const apiRouter = (0, express_1.Router)();
    apiRouter.use('/chat', (0, chatbot_1.createChatRouter)());
    apiRouter.use('/jobs', (0, jobs_1.createJobsRouter)());
    apiRouter.use('/hr', (0, hr_1.createHrRouter)());
    app.use('/api', apiRouter);
}
