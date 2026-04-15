import { runSimulation as simulate } from '../services/simulationService.js';
import { getUserById } from '../utils/dataLayer.js';

// POST /api/simulate
export const runSimulation = async (req, res) => {
  try {
    const { faculty_id, from_date, to_date } = req.body;

    if (!faculty_id || !from_date || !to_date) {
      return res.status(400).json({
        success: false,
        message: 'Required: faculty_id, from_date, to_date',
      });
    }

    const faculty = await getUserById(Number(faculty_id));
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    const result = await simulate(Number(faculty_id), from_date, to_date);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[simulate]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
