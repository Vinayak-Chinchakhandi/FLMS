import express from 'express';
import { runSimulation } from '../controllers/simulationController.js';

const router = express.Router();

// POST /api/simulate
router.post('/', runSimulation);

export default router;
