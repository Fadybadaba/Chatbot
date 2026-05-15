import { Router, Request, Response, NextFunction } from 'express';
import { getApprovedCvById, listApprovedCvs } from '../services/approvedCvsStore';
import {
  getCvAccuracyMetrics,
  getCvDecisionsSummary,
  labelCvDecision,
  listCvDecisions,
} from '../services/cvDecisionsStore';
import { getChatRatingsSummary, listChatRatings } from '../services/ratingsStore';

function requireHrDashboardPassword(req: Request, res: Response): boolean {
  const expected = (process.env.HR_DASHBOARD_PASSWORD || '').trim();
  if (!expected) {
    res.status(500).json({
      error:
        'HR dashboard password not configured (set HR_DASHBOARD_PASSWORD in backend/.env)',
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

export function createHrRouter(): Router {
  const router = Router();

  router.get('/auth-check', (req: Request, res: Response): void => {
    const role = req.user?.role;
    if (role !== 'hr' && role !== 'admin') {
      res.status(403).json({ error: 'Only HR can access the dashboard' });
      return;
    }
    if (!requireHrDashboardPassword(req, res)) return;
    res.json({ ok: true });
  });

  router.get(
    '/approved-cvs',
    (req: Request, res: Response, next: NextFunction): void => {
      try {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
          res.status(403).json({ error: 'Only HR can view approved CVs' });
          return;
        }

        if (!requireHrDashboardPassword(req, res)) return;

        // Do not include raw PDF bytes in the listing response.
        res.json(
          listApprovedCvs().map(r => ({
            ...r,
            pdfBytes: undefined,
            pdfSha256: undefined,
          })),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/approved-cvs/:id/pdf',
    (req: Request, res: Response, next: NextFunction): void => {
      try {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
          res.status(403).json({ error: 'Only HR can view approved CVs' });
          return;
        }

        if (!requireHrDashboardPassword(req, res)) return;

        const record = getApprovedCvById(String(req.params.id));
        if (!record) {
          res.status(404).json({ error: 'CV not found' });
          return;
        }

        res.setHeader('Content-Type', 'application/pdf');
        const wantsDownload =
          String((req.query.download as string | undefined) || '') === '1';
        res.setHeader(
          'Content-Disposition',
          `${wantsDownload ? 'attachment' : 'inline'}; filename=\"${record.fileName.replace(/\"/g, '')}\"`,
        );
        res.send(record.pdfBytes);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/cv-decisions/summary',
    (req: Request, res: Response, next: NextFunction): void => {
      try {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
          res.status(403).json({ error: 'Only HR can view CV decisions' });
          return;
        }
        if (!requireHrDashboardPassword(req, res)) return;

        res.json(getCvDecisionsSummary());
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/cv-decisions',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
          res.status(403).json({ error: 'Only HR can view CV decisions' });
          return;
        }
        if (!requireHrDashboardPassword(req, res)) return;

        res.json(await listCvDecisions());
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/cv-decisions/:id/label',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
          res.status(403).json({ error: 'Only HR can label CV decisions' });
          return;
        }
        if (!requireHrDashboardPassword(req, res)) return;

        const id = String(req.params.id);
        const { expectedApproved, expectedMissingCriteria, labelNotes } = (req.body || {}) as {
          expectedApproved?: boolean | null;
          expectedMissingCriteria?: string[] | null;
          labelNotes?: string | null;
        };

        // Normalize inputs
        const exp =
          expectedApproved === true
            ? true
            : expectedApproved === false
              ? false
              : null;
        const missing =
          Array.isArray(expectedMissingCriteria)
            ? expectedMissingCriteria.map(s => String(s).trim()).filter(Boolean)
            : null;
        const notes = labelNotes == null ? null : String(labelNotes);

        await labelCvDecision({
          id,
          expectedApproved: exp,
          expectedMissingCriteria: missing,
          labelNotes: notes,
          labeledByUserId: req.user?.id || 'hr',
        });

        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/cv-decisions/metrics',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
          res.status(403).json({ error: 'Only HR can view metrics' });
          return;
        }
        if (!requireHrDashboardPassword(req, res)) return;

        res.json(await getCvAccuracyMetrics());
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/chat-ratings/summary',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
          res.status(403).json({ error: 'Only HR can view ratings' });
          return;
        }
        if (!requireHrDashboardPassword(req, res)) return;

        res.json(await getChatRatingsSummary());
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/chat-ratings',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
          res.status(403).json({ error: 'Only HR can view ratings' });
          return;
        }
        if (!requireHrDashboardPassword(req, res)) return;
        res.json(await listChatRatings());
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/chat-ratings/export',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const role = req.user?.role;
        if (role !== 'hr' && role !== 'admin') {
          res.status(403).json({ error: 'Only HR can view ratings' });
          return;
        }
        if (!requireHrDashboardPassword(req, res)) return;

        const data = await listChatRatings();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=\"chat_ratings.json\"',
        );
        res.send(JSON.stringify(data, null, 2));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

