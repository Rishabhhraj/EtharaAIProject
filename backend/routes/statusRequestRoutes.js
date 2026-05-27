import express from 'express';
import { body } from 'express-validator';
import {
  createStatusRequest,
  getPendingByProject,
  getMyRequestsForProject,
  approveStatusRequest,
  rejectStatusRequest,
} from '../controllers/statusRequestController.js';
import { protect } from '../middleware/auth.js';
import { requireAdminOrMember } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect, requireAdminOrMember);

router.get('/project/:projectId/pending', getPendingByProject);
router.get('/project/:projectId', getMyRequestsForProject);

router.post(
  '/task/:taskId',
  [
    body('requestedStatus')
      .isIn(['todo', 'in_progress', 'done'])
      .withMessage('Invalid status'),
  ],
  validate,
  createStatusRequest
);

router.patch('/:id/approve', approveStatusRequest);

router.patch(
  '/:id/reject',
  [body('reviewNote').optional().trim().isLength({ max: 500 })],
  validate,
  rejectStatusRequest
);

export default router;
