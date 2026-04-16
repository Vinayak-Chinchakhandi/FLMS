import express from 'express';
import { getFacultyDashboard } from '../controllers/facultyController.js';

const router = express.Router();
router.get('/dashboard/:id', getFacultyDashboard);
export default router;
