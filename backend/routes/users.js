import express from 'express';
import { getMe, updateMySkills, getLeaveSummary } from '../controllers/userController.js';

const router = express.Router();
router.get('/me',                   getMe);
router.patch('/me/skills',          updateMySkills);
router.get('/leave-summary/:id',    getLeaveSummary);
export default router;
