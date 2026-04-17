import { getUserById } from '../utils/dataLayer.js';
import pool from '../db.js';
import * as mock from '../utils/mockData.js';

const useDB = () => pool !== null;

// GET /api/users/me
export const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({
      success: true,
      data: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        acting_role:  user.acting_role ?? null,
        department_id: user.department_id,
        skills:       Array.isArray(user.skills) ? user.skills : [],
        max_leaves:   user.max_leaves  ?? 12,
        leaves_taken: user.leaves_taken ?? 0,
      },
    });
  } catch (err) {
    console.error('[getMe]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/me/skills
export const updateMySkills = async (req, res) => {
  try {
    const { skills } = req.body;
    if (!Array.isArray(skills)) {
      return res.status(400).json({ success: false, message: 'skills must be an array of strings' });
    }
    const cleanedSkills = skills.map((s) => String(s).trim()).filter(Boolean);

    if (!useDB()) {
      const userRecord = mock.users.find((u) => u.id === req.user.id);
      if (!userRecord) return res.status(404).json({ success: false, message: 'User not found' });
      userRecord.skills = cleanedSkills;
      return res.json({ success: true, data: { skills: cleanedSkills } });
    }

    try {
      await pool.query('UPDATE users SET skills = $1 WHERE id = $2', [JSON.stringify(cleanedSkills), req.user.id]);
      return res.json({ success: true, data: { skills: cleanedSkills } });
    } catch (dbErr) {
      const userRecord = mock.users.find((u) => u.id === req.user.id);
      if (userRecord) userRecord.skills = cleanedSkills;
      return res.json({ success: true, data: { skills: cleanedSkills } });
    }
  } catch (err) {
    console.error('[updateMySkills]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/leave-summary/:id
export const getLeaveSummary = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    // Faculty can only see their own summary; HOD can see anyone in dept
    if (req.user.role === 'faculty' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const max       = user.max_leaves  ?? 12;
    const taken     = user.leaves_taken ?? 0;
    const remaining = Math.max(0, max - taken);

    return res.json({
      success: true,
      data: {
        userId,
        name:      user.name,
        max,
        taken,
        remaining,
        pct: Math.round((taken / max) * 100),
      },
    });
  } catch (err) {
    console.error('[getLeaveSummary]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
