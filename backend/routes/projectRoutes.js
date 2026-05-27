import express from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMembers,
  removeMember,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin, requireAdminOrMember } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect, requireAdminOrMember);

router.get('/', getProjects);

router.get('/:id', getProject);

router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
    body('memberIds').optional().isArray(),
  ],
  validate,
  createProject
);

router.put(
  '/:id',
  requireAdmin,
  [body('name').optional().trim().notEmpty(), body('description').optional().trim()],
  validate,
  updateProject
);

router.delete('/:id', requireAdmin, deleteProject);

router.post(
  '/:id/members',
  requireAdmin,
  [body('memberIds').isArray({ min: 1 }).withMessage('memberIds array is required')],
  validate,
  addMembers
);

router.delete('/:id/members/:memberId', requireAdmin, removeMember);

export default router;
