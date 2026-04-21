"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachAuthMiddleware = attachAuthMiddleware;
/**
 * Very simple auth shim.
 *
 * In production you should replace this with real JWT/SSO validation
 * and user lookup. For now, we just read headers:
 *   x-user-id, x-user-role
 */
function attachAuthMiddleware(req, _res, next) {
    const id = req.header('x-user-id') || 'anonymous';
    const roleHeader = (req.header('x-user-role') || 'candidate').toLowerCase();
    const role = (['candidate', 'hr', 'admin'].includes(roleHeader)
        ? roleHeader
        : 'candidate');
    req.user = { id, role };
    next();
}
