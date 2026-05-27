import express from 'express';
import { body } from 'express-validator';
import {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { requireAdminOrMember } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

router.use(protect, requireAdminOrMember);

router.get('/project/:projectId', validateObjectId('projectId'), getTasksByProject);

router.post(
  '/project/:projectId',
  validateObjectId('projectId'),
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim(),
    body('assignedTo').optional().isMongoId().withMessage('Invalid assignee id'),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  ],
  validate,
  createTask
);

router.put(
  '/:id',
  validateObjectId('id'),
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('assignedTo').optional(),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601(),
  ],
  validate,
  updateTask
);

router.delete('/:id', validateObjectId('id'), deleteTask);

export default router;
