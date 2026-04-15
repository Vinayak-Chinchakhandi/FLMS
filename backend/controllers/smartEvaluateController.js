import { evaluateLeave } from '../services/smartEngine.js';

// POST /api/smart-evaluate
export const smartEvaluate = async (req, res) => {
  try {
    const { faculty_id, from_date, to_date, reason } = req.body;

    if (!faculty_id || !from_date || !to_date) {
      return res.status(400).json({
        success: false,
        message: 'Required: faculty_id, from_date, to_date',
      });
    }

    const result = await evaluateLeave(Number(faculty_id), from_date, to_date, reason || '');
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[smartEvaluate]', err);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};
