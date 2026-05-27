import express from 'express';
import { body } from 'express-validator';
import { getTaskComments, createComment } from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import { requireAdminOrMember } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

router.use(protect, requireAdminOrMember);

router.get('/task/:taskId', validateObjectId('taskId'), getTaskComments);

router.post(
  '/task/:taskId',
  validateObjectId('taskId'),
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  validate,
  createComment
);

export default router;
