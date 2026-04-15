import express from 'express';
import { smartEvaluate } from '../controllers/smartEvaluateController.js';

const router = express.Router();

// POST /api/smart-evaluate
router.post('/', smartEvaluate);

export default router;
