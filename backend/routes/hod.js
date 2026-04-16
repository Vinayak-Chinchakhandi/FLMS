import express from 'express';
import { getHodDashboard } from '../controllers/hodController.js';

const router = express.Router();
router.get('/dashboard/:departmentId', getHodDashboard);
export default router;
