import express from 'express';
import { getMembers } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.get('/members', protect, requireAdmin, getMembers);

export default router;
