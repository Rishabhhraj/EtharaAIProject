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
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

router.use(protect, requireAdminOrMember);

router.get('/project/:projectId/pending', validateObjectId('projectId'), getPendingByProject);
router.get('/project/:projectId', validateObjectId('projectId'), getMyRequestsForProject);

router.post(
  '/task/:taskId',
  validateObjectId('taskId'),
  [
    body('requestedStatus')
      .isIn(['todo', 'in_progress', 'done'])
      .withMessage('Invalid status'),
  ],
  validate,
  createStatusRequest
);

router.patch('/:id/approve', validateObjectId('id'), approveStatusRequest);

router.patch(
  '/:id/reject',
  validateObjectId('id'),
  [body('reviewNote').optional().trim().isLength({ max: 500 })],
  validate,
  rejectStatusRequest
);

export default router;
