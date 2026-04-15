import express from 'express';
import { getHeatmap, getLeaderboard } from '../controllers/dashboardController.js';

const router = express.Router();

// GET /api/dashboard/heatmap
router.get('/heatmap',     getHeatmap);

// GET /api/dashboard/leaderboard
router.get('/leaderboard', getLeaderboard);

export default router;
