import express from 'express';
import { getMe, updateMySkills } from '../controllers/userController.js';

const router = express.Router();
router.get('/me', getMe);
router.patch('/me/skills', updateMySkills);
export default router;
