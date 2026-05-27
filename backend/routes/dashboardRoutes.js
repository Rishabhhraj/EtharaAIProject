import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { requireAdminOrMember } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', protect, requireAdminOrMember, getDashboard);

export default router;
