import express from 'express';
import { getSubstitutionsForFaculty, updateSubstitution } from '../controllers/substitutionController.js';

const router = express.Router();
router.get('/:facultyId', getSubstitutionsForFaculty);
router.patch('/:id', updateSubstitution);
export default router;
