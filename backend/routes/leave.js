import express from 'express';
import {
  applyLeave,
  getAllLeaves,
  getLeaveById,
  updateLeaveStatus,
} from '../controllers/leaveController.js';

const router = express.Router();

router.post('/apply',         applyLeave);
router.get('/',               getAllLeaves);
router.get('/:id',            getLeaveById);
router.patch('/:id/status',   updateLeaveStatus);

export default router;
