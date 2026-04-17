import express from 'express';
import { getHodDashboard, getSubstitutionStatus, getActingHod } from '../controllers/hodController.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/dashboard/:departmentId',         requireRole('hod'), getHodDashboard);
router.get('/substitution-status/:leaveId',    requireRole('hod'), getSubstitutionStatus);
router.get('/acting/:departmentId',            requireRole('hod'), getActingHod);
export default router;
