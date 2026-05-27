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

const router = express.Router();

router.use(protect, requireAdminOrMember);

router.get('/project/:projectId', getTasksByProject);

router.post(
  '/project/:projectId',
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim(),
    body('assignedTo').optional().isMongoId().withMessage('Invalid assignee id'),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  ],
  validate,
  createTask
);

router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('assignedTo').optional(),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('dueDate').optional().isISO8601(),
  ],
  validate,
  updateTask
);

router.delete('/:id', deleteTask);

export default router;
